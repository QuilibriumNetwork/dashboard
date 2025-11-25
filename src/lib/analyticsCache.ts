interface AnalyticsCache {
  frameCount: number;
  latestFrameNumber: number;
  cachedAt: number;
  analyticsData: Array<{
    frameNumber: number;
    requests: number;
    timestamp: number;
    prover: string;
    selector: string;
  }>;
  stats: {
    totalFrames: number;
    totalRequests: number;
    avgRequestsPerFrame: number;
    uniqueProvers: number;
    uniqueSelectors: number;
    avgFrameSpacing: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  proverDistribution: Array<{
    prover: string;
    count: number;
    percentage: number;
    lastFrameNumber: number;
    lastTimestamp: number;
  }>;
  framesPerProverPerHour?: {
    chartData: Array<Record<string, string | number>>;
    topProvers: string[];
  };
  frameSpacingOverTime?: Array<{
    timeLabel: string;
    timestamp: number;
    avgSpacing: number;
    frameCount: number;
  }>;
}

const DB_NAME = "frames-analytics-db";
const DB_VERSION = 1;
const STORE_NAME = "analytics-cache";

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "frameCount" });
      }
    };
  });

  return dbPromise;
}

/**
 * Get cached analytics data
 */
export async function getCachedAnalytics(
  frameCount: number,
  latestFrameNumber: number
): Promise<AnalyticsCache | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(frameCount);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cached = request.result as AnalyticsCache | undefined;
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is still valid (same latest frame number and not too old)
        const maxAge = 5 * 60 * 1000; // 5 minutes
        const age = Date.now() - cached.cachedAt;
        const isStale = age > maxAge;
        const isOutdated = cached.latestFrameNumber !== latestFrameNumber;

        if (isStale || isOutdated) {
          resolve(null);
          return;
        }

        resolve(cached);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Failed to read analytics cache:", err);
    return null;
  }
}

/**
 * Save analytics data to cache
 */
export async function saveAnalyticsCache(
  cache: AnalyticsCache
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(cache);
  } catch (err) {
    console.warn("Failed to save analytics cache:", err);
  }
}

/**
 * Clear old cache entries (keep only recent ones)
 */
export async function pruneAnalyticsCache(keepCount = 5): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allEntries = request.result as AnalyticsCache[];
      if (allEntries.length <= keepCount) {
        return;
      }

      // Sort by cachedAt descending and remove oldest
      allEntries.sort((a, b) => b.cachedAt - a.cachedAt);
      const toRemove = allEntries.slice(keepCount);

      toRemove.forEach((entry) => {
        store.delete(entry.frameCount);
      });
    };
  } catch (err) {
    console.warn("Failed to prune analytics cache:", err);
  }
}

/**
 * Clear all analytics cache
 */
export async function clearAnalyticsCache(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.warn("Failed to clear analytics cache:", err);
  }
}

