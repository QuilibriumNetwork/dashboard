import { GlobalFrame } from "./api";

const DB_NAME = "frames-cache-db";
const DB_VERSION = 1;
const FRAMES_STORE = "frames";
const METADATA_STORE = "metadata";
const MAX_CACHE_SIZE = 2000; // Keep more than requested to allow for gaps

interface CacheMetadata {
  version: number;
  latestFrameNumber: number;
  cachedAt: number;
  frameNumbers: number[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create frames store (keyed by frame number)
      if (!db.objectStoreNames.contains(FRAMES_STORE)) {
        db.createObjectStore(FRAMES_STORE, { keyPath: "frameNumber" });
      }

      // Create metadata store (single entry)
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: "id" });
      }
    };
  });

  return dbPromise;
}

/**
 * Get cached metadata
 */
async function getCacheMetadata(): Promise<CacheMetadata | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([METADATA_STORE], "readonly");
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.get("cache");

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        resolve(result.metadata);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Failed to read cache metadata:", err);
    return null;
  }
}

/**
 * Save cache metadata
 */
async function saveCacheMetadata(metadata: CacheMetadata): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([METADATA_STORE], "readwrite");
    const store = transaction.objectStore(METADATA_STORE);
    store.put({ id: "cache", metadata });
  } catch (err) {
    console.warn("Failed to save cache metadata:", err);
  }
}

/**
 * Get latest cached frame number from metadata
 */
export async function getLatestCachedFrameNumber(): Promise<number | null> {
  const metadata = await getCacheMetadata();
  return metadata?.latestFrameNumber ?? null;
}

/**
 * Get cached frames from IndexedDB
 */
export async function getCachedFrames(): Promise<{ metadata: CacheMetadata; frames: Map<number, GlobalFrame> } | null> {
  try {
    const metadata = await getCacheMetadata();
    if (!metadata) return null;

    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE], "readonly");
    const store = transaction.objectStore(FRAMES_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const frames = new Map<number, GlobalFrame>();
        request.result.forEach((item: { frameNumber: number | string; frame: GlobalFrame }) => {
          // Ensure frameNumber is always a number
          const num = typeof item.frameNumber === 'string' ? parseInt(item.frameNumber, 10) : item.frameNumber;
          // Also ensure the frame's header.frameNumber is a number (not a string)
          const normalizedFrame: GlobalFrame = {
            ...item.frame,
            header: {
              ...item.frame.header,
              frameNumber: typeof item.frame.header.frameNumber === 'string'
                ? parseInt(item.frame.header.frameNumber, 10)
                : item.frame.header.frameNumber,
            },
          };
          frames.set(num, normalizedFrame);
        });
        resolve({ metadata, frames });
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Failed to read frame cache:", err);
    return null;
  }
}

/**
 * Save frames to cache (IndexedDB)
 */
export async function saveFramesToCache(frames: GlobalFrame[]): Promise<void> {
  try {
    const existing = await getCachedFrames();
    const frameMap = new Map<number, GlobalFrame>(existing?.frames || []);

    // Merge new frames
    frames.forEach((frame) => {
      frameMap.set(frame.header.frameNumber, frame);
    });

    // Get all frame numbers and sort
    const frameNumbers = Array.from(frameMap.keys()).sort((a, b) => b - a); // Descending

    // Prune old frames if cache is too large
    if (frameNumbers.length > MAX_CACHE_SIZE) {
      const toKeep = frameNumbers.slice(0, MAX_CACHE_SIZE);
      const toRemove = frameNumbers.slice(MAX_CACHE_SIZE);

      toRemove.forEach((num) => {
        frameMap.delete(num);
      });

      frameNumbers.splice(MAX_CACHE_SIZE);
    }

    const latestFrameNumber = frameNumbers.length > 0 ? frameNumbers[0] : 0;

    const metadata: CacheMetadata = {
      version: 1,
      latestFrameNumber,
      cachedAt: Date.now(),
      frameNumbers: frameNumbers.sort((a, b) => a - b), // Ascending for easier gap detection
    };

    // Save metadata
    await saveCacheMetadata(metadata);

    // Save frames in batches to avoid quota issues
    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE], "readwrite");
    const store = transaction.objectStore(FRAMES_STORE);

    // Save frames in chunks
    const batchSize = 100;
    const frameArray = Array.from(frameMap.entries());

    for (let i = 0; i < frameArray.length; i += batchSize) {
      const batch = frameArray.slice(i, i + batchSize);
      await new Promise<void>((resolve, reject) => {
        const batchTransaction = db.transaction([FRAMES_STORE], "readwrite");
        const batchStore = batchTransaction.objectStore(FRAMES_STORE);

        let completed = 0;
        let hasError = false;

        batch.forEach(([frameNumber, frame]) => {
          // Ensure frameNumber is always a number (not a string)
          const numFrameNumber = typeof frameNumber === 'string' ? parseInt(frameNumber, 10) : frameNumber;
          const request = batchStore.put({ frameNumber: numFrameNumber, frame });
          request.onsuccess = () => {
            completed++;
            if (completed === batch.length && !hasError) {
              resolve();
            }
          };
          request.onerror = () => {
            if (!hasError) {
              hasError = true;
              reject(request.error);
            }
          };
        });
      });
    }

    // Wait for transaction to complete
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve(); // Resolve anyway to not block
    });
  } catch (err) {
    console.warn("[frameCache] Failed to save frame cache:", err);
    // If storage is full, try to clear old cache
    try {
      await clearFrameCache();
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Get specific frames by frame numbers from IndexedDB
 */
export async function getFramesByNumbers(frameNumbers: number[]): Promise<Map<number, GlobalFrame>> {
  const result = new Map<number, GlobalFrame>();

  if (frameNumbers.length === 0) return result;

  try {
    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE], "readonly");
    const store = transaction.objectStore(FRAMES_STORE);

    await Promise.all(
      frameNumbers.map(
        (frameNumber) =>
          new Promise<void>((resolve) => {
            // Try both number and string key since IndexedDB might have stored it as string
            // First try as number (correct way)
            const request = store.get(frameNumber);
            request.onsuccess = () => {
              const item = request.result as { frameNumber: number | string; frame: GlobalFrame } | undefined;
              if (item) {
                // Ensure frameNumber is a number
                const num = typeof item.frameNumber === 'string' ? parseInt(item.frameNumber, 10) : item.frameNumber;
                // Also ensure the frame's header.frameNumber is a number (not a string)
                const normalizedFrame: GlobalFrame = {
                  ...item.frame,
                  header: {
                    ...item.frame.header,
                    frameNumber: typeof item.frame.header.frameNumber === 'string'
                      ? parseInt(item.frame.header.frameNumber, 10)
                      : item.frame.header.frameNumber,
                  },
                };
                result.set(num, normalizedFrame);
                resolve();
              } else {
                // Try as string if number didn't work (for backwards compatibility with old data)
                const stringRequest = store.get(String(frameNumber));
                stringRequest.onsuccess = () => {
                  const stringItem = stringRequest.result as { frameNumber: number | string; frame: GlobalFrame } | undefined;
                  if (stringItem) {
                    const num = typeof stringItem.frameNumber === 'string' ? parseInt(stringItem.frameNumber, 10) : stringItem.frameNumber;
                    // Also ensure the frame's header.frameNumber is a number (not a string)
                    const normalizedFrame: GlobalFrame = {
                      ...stringItem.frame,
                      header: {
                        ...stringItem.frame.header,
                        frameNumber: typeof stringItem.frame.header.frameNumber === 'string'
                          ? parseInt(stringItem.frame.header.frameNumber, 10)
                          : stringItem.frame.header.frameNumber,
                      },
                    };
                    result.set(num, normalizedFrame);
                  }
                  resolve();
                };
                stringRequest.onerror = () => resolve();
              }
            };
            request.onerror = () => resolve();
          })
      )
    );

    // Wait for transaction to complete
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve(); // Resolve anyway to not block
    });
  } catch (err) {
    console.warn("[frameCache] Failed to get frames from IndexedDB:", err);
  }

  return result;
}

/**
 * Get frames from cache within a range
 */
export async function getCachedFramesInRange(
  latestFrameNumber: number,
  count: number
): Promise<GlobalFrame[]> {
  const startNumber = Math.max(1, latestFrameNumber - count + 1);
  const frameNumbers = Array.from({ length: count }, (_, i) => startNumber + i);

  const framesMap = await getFramesByNumbers(frameNumbers);
  return Array.from(framesMap.values()).sort((a, b) => a.header.frameNumber - b.header.frameNumber);
}

/**
 * Find gaps in cached frames within a range
 */
export async function findGapsInCache(
  latestFrameNumber: number,
  count: number
): Promise<number[]> {
  const cache = await getCachedFrames();
  if (!cache) {
    // If no cache, all frames are gaps
    const startNumber = Math.max(1, latestFrameNumber - count + 1);
    return Array.from({ length: count }, (_, i) => latestFrameNumber - i).reverse();
  }

  const startNumber = Math.max(1, latestFrameNumber - count + 1);
  const gaps: number[] = [];

  for (let i = startNumber; i <= latestFrameNumber; i++) {
    if (!cache.frames.has(i)) {
      gaps.push(i);
    }
  }

  return gaps;
}

/**
 * Check if cache is stale (older than 5 minutes)
 */
export async function isCacheStale(maxAgeMs = 5 * 60 * 1000): Promise<boolean> {
  const metadata = await getCacheMetadata();
  if (!metadata) return true;

  const age = Date.now() - metadata.cachedAt;
  return age > maxAgeMs;
}

/**
 * Prune cache to keep only frames within a range
 */
export async function pruneCache(latestFrameNumber: number, keepCount: number): Promise<void> {
  const cache = await getCachedFrames();
  if (!cache) return;

  const startNumber = Math.max(1, latestFrameNumber - keepCount + 1);
  const framesToRemove: number[] = [];

  // Find frames to remove
  cache.frames.forEach((_, frameNumber) => {
    if (frameNumber < startNumber || frameNumber > latestFrameNumber) {
      framesToRemove.push(frameNumber);
    }
  });

  if (framesToRemove.length === 0) return;

  // Remove frames from IndexedDB
  try {
    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE], "readwrite");
    const store = transaction.objectStore(FRAMES_STORE);

    await Promise.all(
      framesToRemove.map(
        (frameNumber) =>
          new Promise<void>((resolve, reject) => {
            const request = store.delete(frameNumber);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
      )
    );

    // Update metadata
    const remainingFrames = Array.from(cache.frames.keys())
      .filter((num) => !framesToRemove.includes(num))
      .sort((a, b) => a - b);

    const metadata: CacheMetadata = {
      version: 1,
      latestFrameNumber: remainingFrames.length > 0 ? Math.max(...remainingFrames) : 0,
      cachedAt: Date.now(),
      frameNumbers: remainingFrames,
    };

    await saveCacheMetadata(metadata);
  } catch (err) {
    console.warn("Failed to prune cache:", err);
  }
}

/**
 * Clear all frame cache
 */
export async function clearFrameCache(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE, METADATA_STORE], "readwrite");
    transaction.objectStore(FRAMES_STORE).clear();
    transaction.objectStore(METADATA_STORE).clear();
  } catch (err) {
    console.warn("Failed to clear frame cache:", err);
  }
}

/**
 * Estimate storage usage of frame cache
 */
export async function estimateStorageUsage(): Promise<{ sizeBytes: number; frameCount: number }> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE], "readonly");
    const store = transaction.objectStore(FRAMES_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const frames = request.result as Array<{ frameNumber: number; frame: GlobalFrame }>;
        let totalSize = 0;

        // Estimate size by serializing each frame
        frames.forEach((item) => {
          try {
            const serialized = JSON.stringify(item);
            // Each character in UTF-16 is 2 bytes, but JSON uses UTF-8 which is 1 byte per ASCII char
            // This is an approximation
            totalSize += new Blob([serialized]).size;
          } catch (err) {
            // If serialization fails, estimate based on frame number
            totalSize += 10000; // Rough estimate per frame
          }
        });

        resolve({
          sizeBytes: totalSize,
          frameCount: frames.length,
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Failed to estimate storage usage:", err);
    return { sizeBytes: 0, frameCount: 0 };
  }
}

/**
 * Delete frames, keeping only the last N frames
 */
export async function deleteFramesKeepingLast(keepCount: number): Promise<void> {
  try {
    const cache = await getCachedFrames();
    if (!cache || cache.frames.size === 0) {
      return;
    }

    const frameNumbers = Array.from(cache.frames.keys()).sort((a, b) => b - a); // Descending
    const framesToKeep = frameNumbers.slice(0, keepCount);
    const framesToDelete = frameNumbers.slice(keepCount);

    if (framesToDelete.length === 0) {
      return;
    }

    const db = await openDatabase();
    const transaction = db.transaction([FRAMES_STORE], "readwrite");
    const store = transaction.objectStore(FRAMES_STORE);

    // Delete frames
    await Promise.all(
      framesToDelete.map(
        (frameNumber) =>
          new Promise<void>((resolve, reject) => {
            const request = store.delete(frameNumber);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
      )
    );

    // Update metadata
    const remainingFrames = framesToKeep.sort((a, b) => a - b);
    const latestFrameNumber = remainingFrames.length > 0 ? Math.max(...remainingFrames) : 0;

    const metadata: CacheMetadata = {
      version: 1,
      latestFrameNumber,
      cachedAt: Date.now(),
      frameNumbers: remainingFrames,
    };

    await saveCacheMetadata(metadata);
  } catch (err) {
    console.warn("Failed to delete frames:", err);
    throw err;
  }
}
