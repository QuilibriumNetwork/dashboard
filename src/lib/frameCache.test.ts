import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { GlobalFrame } from "./api";

type FrameCache = typeof import("./frameCache");

const MAX_CACHE_SIZE = 2000;

// Frame numbers arrive from the API as strings.
function makeFrame(frameNumber: number): GlobalFrame {
  return {
    header: {
      frameNumber: String(frameNumber) as unknown as number,
      rank: frameNumber,
      timestamp: String(1_700_000_000_000 + frameNumber * 10_000),
      difficulty: 50000,
      output: "",
      parentSelector: "",
      prover: `prover-${frameNumber % 7}`,
    },
    requests: [],
  };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Fail instead of hanging when a promise never settles. */
function settles<T>(promise: Promise<T>, label: string, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} never resolved`)), ms)),
  ]);
}

/** Write frames straight to the store, as an older build left them. */
async function seedFrames(frameNumbers: number[]): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("frames-cache-db", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("frames", { keyPath: "frameNumber" });
      request.result.createObjectStore("metadata", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["frames", "metadata"], "readwrite");
    frameNumbers.forEach((n) => tx.objectStore("frames").put({ frameNumber: n, frame: makeFrame(n) }));
    tx.objectStore("metadata").put({
      id: "cache",
      metadata: { version: 1, latestFrameNumber: Math.max(...frameNumbers), cachedAt: Date.now(), frameNumbers },
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

interface FrameStoreActivity {
  framesRead: number;
  framesWritten: number;
}

/** Count the frames read from and written to the frame store while `fn` runs. */
async function frameStoreActivity(fn: () => Promise<unknown>): Promise<FrameStoreActivity> {
  const activity: FrameStoreActivity = { framesRead: 0, framesWritten: 0 };
  const proto = IDBObjectStore.prototype as unknown as Record<string, (...args: unknown[]) => IDBRequest>;
  const reads: Record<string, (result: unknown) => number> = {
    get: (result) => (result ? 1 : 0),
    getAll: (result) => (result as unknown[]).length,
    openCursor: (result) => (result ? 1 : 0), // Once per record visited
  };
  const originals = Object.fromEntries(
    [...Object.keys(reads), "put"].map((method) => [method, proto[method]])
  );
  for (const [method, count] of Object.entries(reads)) {
    proto[method] = function (this: IDBObjectStore, ...args: unknown[]) {
      const request = originals[method].apply(this, args);
      if (this.name === "frames") {
        request.addEventListener("success", () => {
          activity.framesRead += count(request.result);
        });
      }
      return request;
    };
  }
  proto.put = function (this: IDBObjectStore, ...args: unknown[]) {
    if (this.name === "frames") activity.framesWritten++;
    return originals.put.apply(this, args);
  };
  try {
    await fn();
  } finally {
    Object.assign(proto, originals);
  }
  return activity;
}

describe("frameCache", () => {
  let cache: FrameCache;

  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    vi.resetModules(); // The module keeps its open database
    cache = await import("./frameCache");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves saveFramesToCache once the frames are written", async () => {
    await settles(cache.saveFramesToCache(range(1, 10).map(makeFrame)), "saveFramesToCache");

    const frames = await cache.getFramesByNumbers(range(1, 10));
    expect(frames.size).toBe(10);
    expect(frames.get(5)?.header.frameNumber).toBe(5);
    expect(await cache.getLatestCachedFrameNumber()).toBe(10);
  });

  it("writes only frames that are not cached yet, and reads no frames", async () => {
    await settles(cache.saveFramesToCache(range(1, 50).map(makeFrame)), "first save");

    const activity = await frameStoreActivity(() =>
      settles(cache.saveFramesToCache(range(1, 51).map(makeFrame)), "second save")
    );

    expect(activity).toEqual({ framesRead: 0, framesWritten: 1 });
  });

  it("caps the stored frames at MAX_CACHE_SIZE, not only the in-memory copy", async () => {
    await settles(cache.saveFramesToCache(range(1, MAX_CACHE_SIZE + 10).map(makeFrame)), "saveFramesToCache");

    const usage = await cache.estimateStorageUsage();
    expect(usage.frameCount).toBe(MAX_CACHE_SIZE);
    expect(await cache.findGapsInCache(MAX_CACHE_SIZE + 10, MAX_CACHE_SIZE + 10)).toEqual(range(1, 10));
  });

  it("trims an oversized cache left by an older build on the next save", async () => {
    await seedFrames(range(1, 3000));

    await settles(cache.saveFramesToCache([makeFrame(3001)]), "saveFramesToCache");

    expect((await cache.estimateStorageUsage()).frameCount).toBe(MAX_CACHE_SIZE);
    expect(await cache.getLatestCachedFrameNumber()).toBe(3001);
  });

  it("prunes by key range without reading frames", async () => {
    await seedFrames(range(1, 3000));

    const activity = await frameStoreActivity(() => settles(cache.pruneCache(2500, 510), "pruneCache"));

    expect(activity).toEqual({ framesRead: 0, framesWritten: 0 });
    expect((await cache.estimateStorageUsage()).frameCount).toBe(510);
    expect(await cache.findGapsInCache(2500, 510)).toEqual([]);
    expect(await cache.getLatestCachedFrameNumber()).toBe(2500);
  });

  it("prunes with the string frame number the API returns", async () => {
    await seedFrames(range(1, 100));

    await settles(cache.pruneCache("90" as unknown as number, 20), "pruneCache");

    expect(await cache.findGapsInCache(100, 100)).toEqual([...range(1, 70), ...range(91, 100)]);
  });

  it("returns cached frames in a range, ascending and normalized", async () => {
    await seedFrames(range(1, 100));

    const frames = await cache.getCachedFramesInRange("100" as unknown as number, 5);

    expect(frames.map((f) => f.header.frameNumber)).toEqual([96, 97, 98, 99, 100]);
  });

  it("estimates storage from a sample instead of reading every frame", async () => {
    await seedFrames(range(1, 500));

    let usage = { sizeBytes: 0, frameCount: 0 };
    const activity = await frameStoreActivity(async () => {
      usage = await cache.estimateStorageUsage();
    });

    expect(usage.frameCount).toBe(500);
    expect(usage.sizeBytes).toBeGreaterThan(0);
    expect(activity.framesRead).toBeLessThanOrEqual(20);
  });

  it("deletes all but the newest frames", async () => {
    await seedFrames(range(1, 100));

    const activity = await frameStoreActivity(() =>
      settles(cache.deleteFramesKeepingLast(10), "deleteFramesKeepingLast")
    );

    expect(activity).toEqual({ framesRead: 0, framesWritten: 0 });
    expect(await cache.findGapsInCache(100, 100)).toEqual(range(1, 90));
    expect(await cache.getLatestCachedFrameNumber()).toBe(100);
  });

  it("clears frames and metadata", async () => {
    await seedFrames(range(1, 10));

    await settles(cache.clearFrameCache(), "clearFrameCache");

    expect((await cache.estimateStorageUsage()).frameCount).toBe(0);
    expect(await cache.getLatestCachedFrameNumber()).toBeNull();
  });
});
