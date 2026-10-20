import { GlobalFrame } from "./api";

const DB_NAME = "frames-cache-db";
const DB_VERSION = 1;
const FRAMES_STORE = "frames";
const METADATA_STORE = "metadata";
const MAX_CACHE_SIZE = 2000; // Keep more than requested to allow for gaps
const SIZE_SAMPLE_FRAMES = 20; // Newest frames measured by estimateStorageUsage

interface CacheMetadata {
  version: number;
  latestFrameNumber: number;
  cachedAt: number;
  frameNumbers: number[];
}

interface CachedFrameRecord {
  frameNumber: number | string;
  frame: GlobalFrame;
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

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Run `body` in one transaction over both stores and resolve once it commits.
 * The completion listeners are attached before any request is made, so the
 * commit cannot be missed. `body` may only await requests of this
 * transaction: awaiting anything else lets it auto-commit.
 */
async function inTransaction<T>(
  mode: IDBTransactionMode,
  body: (frames: IDBObjectStore, metadata: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDatabase();
  const transaction = db.transaction([FRAMES_STORE, METADATA_STORE], mode);
  const committed = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Transaction aborted"));
  });

  try {
    const result = await body(
      transaction.objectStore(FRAMES_STORE),
      transaction.objectStore(METADATA_STORE)
    );
    await committed;
    return result;
  } catch (err) {
    committed.catch(() => {}); // The failed request's error is the one reported
    throw err;
  }
}

/** Every frame number key; frames have only ever been stored under numbers. */
function frameNumberKeys(): IDBKeyRange {
  return IDBKeyRange.upperBound(Infinity);
}

/** Frame numbers arrive from the API as strings despite their declared type. */
function toFrameNumber(value: number | string): number {
  return typeof value === "string" ? parseInt(value, 10) : value;
}

function normalizeRecord(item: CachedFrameRecord): [number, GlobalFrame] {
  return [
    toFrameNumber(item.frameNumber),
    {
      ...item.frame,
      header: {
        ...item.frame.header,
        frameNumber: toFrameNumber(item.frame.header.frameNumber),
      },
    },
  ];
}

/** Rewrite the metadata from the stored keys. */
async function refreshMetadata(frames: IDBObjectStore, metadata: IDBObjectStore): Promise<void> {
  const frameNumbers = (await requestResult(frames.getAllKeys(frameNumberKeys()))) as number[];
  const entry: CacheMetadata = {
    version: 1,
    latestFrameNumber: frameNumbers.length > 0 ? frameNumbers[frameNumbers.length - 1] : 0,
    cachedAt: Date.now(),
    frameNumbers, // Ascending, as keys are returned
  };
  await requestResult(metadata.put({ id: "cache", metadata: entry }));
}

/**
 * Delete all but the newest `keepCount` frames by key range, without reading
 * any frame. Returns whether anything was deleted.
 */
async function trimToNewest(frames: IDBObjectStore, keepCount: number): Promise<boolean> {
  const excess = (await requestResult(frames.count(frameNumberKeys()))) - keepCount;
  if (excess <= 0) return false;

  const oldest = (await requestResult(frames.getAllKeys(frameNumberKeys(), excess))) as number[];
  await requestResult(frames.delete(IDBKeyRange.upperBound(oldest[oldest.length - 1])));
  return true;
}

/**
 * Get cached metadata
 */
async function getCacheMetadata(): Promise<CacheMetadata | null> {
  try {
    return await inTransaction("readonly", async (_, metadata) => {
      const result = await requestResult(metadata.get("cache"));
      return result ? (result.metadata as CacheMetadata) : null;
    });
  } catch (err) {
    console.warn("Failed to read cache metadata:", err);
    return null;
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
 * Get every cached frame from IndexedDB. This reads the whole cache (up to
 * MAX_CACHE_SIZE frames of ~200 KB each): prefer getFramesByNumbers,
 * getCachedFramesInRange or getLatestCachedFrameNumber.
 */
export async function getCachedFrames(): Promise<{ metadata: CacheMetadata; frames: Map<number, GlobalFrame> } | null> {
  try {
    return await inTransaction("readonly", async (framesStore, metadataStore) => {
      const result = await requestResult(metadataStore.get("cache"));
      if (!result) return null;

      const items = (await requestResult(framesStore.getAll(frameNumberKeys()))) as CachedFrameRecord[];
      return { metadata: result.metadata as CacheMetadata, frames: new Map(items.map(normalizeRecord)) };
    });
  } catch (err) {
    console.warn("Failed to read frame cache:", err);
    return null;
  }
}

/**
 * Save frames to cache (IndexedDB). Only frames not already cached are
 * written; the cache is then trimmed to the newest MAX_CACHE_SIZE frames.
 */
export async function saveFramesToCache(frames: GlobalFrame[]): Promise<void> {
  if (frames.length === 0) return;

  try {
    await inTransaction("readwrite", async (framesStore, metadataStore) => {
      const incoming = new Map<number, GlobalFrame>();
      frames.forEach((frame) => {
        incoming.set(toFrameNumber(frame.header.frameNumber), frame);
      });

      const numbers = Array.from(incoming.keys());
      const range = IDBKeyRange.bound(Math.min(...numbers), Math.max(...numbers));
      const stored = new Set((await requestResult(framesStore.getAllKeys(range))) as number[]);

      let written = 0;
      incoming.forEach((frame, frameNumber) => {
        if (!stored.has(frameNumber)) {
          framesStore.put({ frameNumber, frame });
          written++;
        }
      });

      const trimmed = await trimToNewest(framesStore, MAX_CACHE_SIZE);
      if (written > 0 || trimmed) {
        await refreshMetadata(framesStore, metadataStore);
      }
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
    await inTransaction("readonly", async (framesStore) => {
      const items = await Promise.all(
        frameNumbers.map((frameNumber) => requestResult(framesStore.get(frameNumber)))
      );
      items.forEach((item: CachedFrameRecord | undefined) => {
        if (item) {
          const [num, frame] = normalizeRecord(item);
          result.set(num, frame);
        }
      });
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
  const latest = toFrameNumber(latestFrameNumber);
  const startNumber = Math.max(1, latest - count + 1);
  if (startNumber > latest) return [];

  try {
    return await inTransaction("readonly", async (framesStore) => {
      const range = IDBKeyRange.bound(startNumber, latest);
      const items = (await requestResult(framesStore.getAll(range))) as CachedFrameRecord[];
      return items.map((item) => normalizeRecord(item)[1]); // Ascending, as keys are returned
    });
  } catch (err) {
    console.warn("[frameCache] Failed to get frames from IndexedDB:", err);
    return [];
  }
}

/**
 * Find gaps in cached frames within a range
 */
export async function findGapsInCache(
  latestFrameNumber: number,
  count: number
): Promise<number[]> {
  const latest = toFrameNumber(latestFrameNumber);
  const startNumber = Math.max(1, latest - count + 1);
  if (startNumber > latest) return [];

  let cached = new Set<number>();
  try {
    cached = await inTransaction("readonly", async (framesStore) => {
      const range = IDBKeyRange.bound(startNumber, latest);
      return new Set((await requestResult(framesStore.getAllKeys(range))) as number[]);
    });
  } catch (err) {
    console.warn("[frameCache] Failed to read cached frame numbers:", err);
  }

  const gaps: number[] = [];
  for (let i = startNumber; i <= latest; i++) {
    if (!cached.has(i)) {
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
  const latest = toFrameNumber(latestFrameNumber);
  const startNumber = Math.max(1, latest - keepCount + 1);

  try {
    await inTransaction("readwrite", async (framesStore, metadataStore) => {
      const older = IDBKeyRange.upperBound(startNumber, true);
      const newer = IDBKeyRange.lowerBound(latest, true);
      const outside =
        (await requestResult(framesStore.count(older))) +
        (await requestResult(framesStore.count(newer)));
      if (outside === 0) return;

      framesStore.delete(older);
      framesStore.delete(newer);
      await refreshMetadata(framesStore, metadataStore);
    });
  } catch (err) {
    console.warn("Failed to prune cache:", err);
  }
}

/**
 * Clear all frame cache
 */
export async function clearFrameCache(): Promise<void> {
  try {
    await inTransaction("readwrite", async (framesStore, metadataStore) => {
      framesStore.clear();
      metadataStore.clear();
    });
  } catch (err) {
    console.warn("Failed to clear frame cache:", err);
  }
}

/**
 * Estimate storage usage of frame cache from the size of the newest frames,
 * rather than reading every frame.
 */
export async function estimateStorageUsage(): Promise<{ sizeBytes: number; frameCount: number }> {
  try {
    return await inTransaction("readonly", async (framesStore) => {
      const frameCount = await requestResult(framesStore.count());
      const keys = (await requestResult(framesStore.getAllKeys(frameNumberKeys()))) as number[];
      if (frameCount === 0 || keys.length === 0) {
        return { sizeBytes: 0, frameCount };
      }

      const newest = IDBKeyRange.bound(keys[Math.max(0, keys.length - SIZE_SAMPLE_FRAMES)], keys[keys.length - 1]);
      const sample = (await requestResult(framesStore.getAll(newest))) as CachedFrameRecord[];
      let sampleSize = 0;
      sample.forEach((item) => {
        try {
          // UTF-8 byte length of the JSON form; an approximation of the stored size
          sampleSize += new Blob([JSON.stringify(item)]).size;
        } catch {
          sampleSize += 10000; // Rough estimate per frame
        }
      });

      return {
        sizeBytes: Math.round((sampleSize / sample.length) * frameCount),
        frameCount,
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
    await inTransaction("readwrite", async (framesStore, metadataStore) => {
      if (await trimToNewest(framesStore, keepCount)) {
        await refreshMetadata(framesStore, metadataStore);
      }
    });
  } catch (err) {
    console.warn("Failed to delete frames:", err);
    throw err;
  }
}
