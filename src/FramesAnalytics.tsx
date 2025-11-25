import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { GlobalFrame, explorerApi } from "@/lib/api";
import { coerceTimestamp } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { useTheme } from "@/components/helpers/ThemeContext";
import {
  getCachedFramesInRange,
  findGapsInCache,
  saveFramesToCache,
  pruneCache,
  isCacheStale,
  getCachedFrames,
  getFramesByNumbers,
} from "@/lib/frameCache";
import {
  getCachedAnalytics,
  saveAnalyticsCache,
  pruneAnalyticsCache,
} from "@/lib/analyticsCache";

interface FrameAnalytics {
  frameNumber: number;
  requests: number;
  timestamp: number;
  prover: string;
  selector: string;
}


const FRAME_COUNT_OPTIONS = [10, 25, 50, 100, 250, 500, 1000] as const;
const FRAME_COUNT_STORAGE_KEY = "frames-analytics-frame-count";

export default function FramesAnalytics() {
  const { theme } = useTheme();
  const [frameCount, setFrameCount] = useState(() => {
    // Load from localStorage or default to 10
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FRAME_COUNT_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (FRAME_COUNT_OPTIONS.includes(parsed as any)) {
          return parsed;
        }
      }
    }
    return 10;
  });
  const [frames, setFrames] = useState<GlobalFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [framesWarning, setFramesWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "frames" as "frames" | "analytics" });
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [calculatingAnalytics, setCalculatingAnalytics] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Cached analytics data
  const [cachedAnalyticsData, setCachedAnalyticsData] = useState<FrameAnalytics[]>([]);
  const [cachedStats, setCachedStats] = useState<{
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
  } | null>(null);
  const [cachedProverDistribution, setCachedProverDistribution] = useState<Array<{
    prover: string;
    count: number;
    percentage: number;
  }>>([]);
  const [cachedFramesPerProverPerHour, setCachedFramesPerProverPerHour] = useState<{
    chartData: Array<Record<string, string | number>>;
    topProvers: string[];
  } | null>(null);
  const [cachedFrameSpacingOverTime, setCachedFrameSpacingOverTime] = useState<Array<{
    timeLabel: string;
    timestamp: number;
    avgSpacing: number;
    frameCount: number;
  }> | null>(null);

  // Theme-aware colors
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(57,31,91,0.1)";
  const axisColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(57,31,91,0.6)";
  const lineColor = isDark ? "#ffffff" : "#8B1538";
  const barColor = isDark ? "#ffffff" : "#8B1538";
  const tooltipBg = isDark ? "rgba(26,15,39,0.95)" : "rgba(255,255,255,0.95)";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.2)" : "rgba(57,31,91,0.2)";

  useEffect(() => {
    let mounted = true;
    let cancelled = false;

    // Clear cached analytics and frames immediately when frameCount changes
    setCachedAnalyticsData([]);
    setCachedStats(null);
    setCachedProverDistribution([]);
    setCachedFramesPerProverPerHour(null);
    setCachedFrameSpacingOverTime(null);
    setFrames([]); // Clear old frames immediately to prevent showing stale data
    setFramesWarning(null); // Clear warning when changing frame count

    async function loadFrames() {
      setLoading(true);
      setError(null);
      setLoadingFromCache(false);
      setCalculatingAnalytics(false);

      // Show progress bar for larger datasets or when changing frameCount
      const shouldShowProgress = frameCount >= 100;
      setShowProgressBar(shouldShowProgress);

      // Always show initial progress
      setProgress({ current: 0, total: frameCount, phase: "frames" });

      try {
        // Step 1: Check cache metadata first (NO API CALL)
        const cachedData = await getCachedFrames();
        const cachedLatestFrameNumber = cachedData?.metadata.latestFrameNumber ?? null;

        let latestNumber: number;

        // ONLY fetch latest frame from API if we have NO cache at all
        // Otherwise, use cached latest frame number - NO API CALL
        if (!cachedLatestFrameNumber) {
          // No cache - must fetch latest frame to know what to load
          const latestFrame = await explorerApi.getLatestFrame();
          if (!mounted || cancelled) return;
          latestNumber = latestFrame.header.frameNumber;
        } else {
          // Use cached latest frame number - NO API CALL
          latestNumber = cachedLatestFrameNumber;
        }

        // Step 3: Calculate which frames we need
        const startNumber = Math.max(1, latestNumber - frameCount + 1);
        const neededFrameNumbers = Array.from(
          { length: latestNumber - startNumber + 1 },
          (_, i) => startNumber + i
        );

        // Step 4: Query IndexedDB for those specific frame numbers (no API call)
        const cachedFramesMap = await getFramesByNumbers(neededFrameNumbers);
        const cachedFrames = Array.from(cachedFramesMap.values()).sort(
          (a, b) => a.header.frameNumber - b.header.frameNumber
        );
        const cachedFrameNumbers = new Set(cachedFrames.map((f) => f.header.frameNumber));

        // Show cached data immediately if available
        if (cachedFrames.length > 0) {
          setLoadingFromCache(true);
          setFrames(cachedFrames);
        }

        // Step 5: Find missing frames (gaps) - only these will hit the API
        const missingFrameNumbers = neededFrameNumbers.filter(
          (num) => !cachedFrameNumbers.has(num)
        );

        // Update progress
        setProgress({ current: cachedFrames.length, total: frameCount, phase: "frames" });

        // Step 6: Fetch missing frames from API in parallel batches
        const framesToLoad = [...cachedFrames];
        let apiCallCount = 0;
        const fetchedLatest = !cachedLatestFrameNumber;
        const BATCH_FETCH_SIZE = 20; // Fetch 20 frames in parallel at a time
        const BATCH_SAVE_SIZE = 50; // Save to cache every 50 frames
        const framesToSave: GlobalFrame[] = [];
        let lastBatchSavePromise: Promise<void> | null = null;

        if (missingFrameNumbers.length > 0) {
          // Sort to fetch in order
          missingFrameNumbers.sort((a, b) => a - b);

          // Fetch frames in parallel batches
          for (let i = 0; i < missingFrameNumbers.length; i += BATCH_FETCH_SIZE) {
            if (!mounted || cancelled) return;

            const batch = missingFrameNumbers.slice(i, i + BATCH_FETCH_SIZE);

            // Fetch all frames in this batch in parallel
            const fetchPromises = batch.map(async (frameNum) => {
              try {
                const frame = await explorerApi.getFrame(frameNum);
                return { success: true, frame, frameNum };
              } catch (err) {
                console.warn(`Failed to load frame ${frameNum}:`, err);
                return { success: false, frame: null, frameNum };
              }
            });

            const results = await Promise.all(fetchPromises);
            if (!mounted || cancelled) return;

            // Process successful fetches
            for (const result of results) {
              if (result.success && result.frame) {
                apiCallCount++;

                // Insert frame in correct position
                const insertIndex = framesToLoad.findIndex(
                  (f) => f.header.frameNumber > result.frameNum
                );
                if (insertIndex === -1) {
                  framesToLoad.push(result.frame);
                } else {
                  framesToLoad.splice(insertIndex, 0, result.frame);
                }

                // Add to batch save queue
                framesToSave.push(result.frame);

                // Save to cache in batches to preserve progress on refresh (non-blocking)
                if (framesToSave.length >= BATCH_SAVE_SIZE) {
                  const batchToSave = [...framesToSave];
                  framesToSave.length = 0; // Clear the batch immediately

                  // Save asynchronously without blocking the loop
                  lastBatchSavePromise = saveFramesToCache(batchToSave).catch((err) => {
                    console.warn("Failed to save batch to cache:", err);
                  });
                }
              }
            }

            // Update progress after each batch
            setProgress({
              current: framesToLoad.length,
              total: frameCount,
              phase: "frames",
            });
          }

          // Save any remaining frames in the batch
          if (framesToSave.length > 0) {
            const batchToSave = [...framesToSave];
            framesToSave.length = 0;
            lastBatchSavePromise = saveFramesToCache(batchToSave).catch((err) => {
              console.warn("Failed to save final batch to cache:", err);
            });
          }

          // Wait for the last batch save to complete before continuing
          if (lastBatchSavePromise) {
            await lastBatchSavePromise;
          }
        }

        if (!mounted || cancelled) return;

        // Ensure we have frames in the requested range and sort
        const finalFrames = framesToLoad
          .filter((f) => f.header.frameNumber >= startNumber && f.header.frameNumber <= latestNumber)
          .sort((a, b) => a.header.frameNumber - b.header.frameNumber);

        // Save any remaining frames that weren't saved in batches
        if (framesToSave.length > 0 && apiCallCount > 0) {
          try {
            await saveFramesToCache(framesToSave);
          } catch (err) {
            console.warn("Failed to save final batch to cache:", err);
          }
        }

        // Also ensure all final frames are in cache (in case batch saves missed some)
        if (apiCallCount > 0) {
          try {
            await saveFramesToCache(finalFrames);
          } catch (err) {
            console.warn("Failed to save final frames to cache:", err);
          }
        }

        // Prune cache to keep it manageable
        await pruneCache(latestNumber, frameCount + 500); // Keep extra for gap filling

        if (!mounted || cancelled) return;

        // Use function form to ensure we're setting the latest state
        setFrames(() => {
          console.log(`Setting frames state with ${finalFrames.length} frames (expected ${frameCount})`);
          return [...finalFrames]; // Create new array reference
        });
        setLoadingFromCache(false);

        // Set warning if we have fewer frames than requested
        if (finalFrames.length < frameCount) {
          const missingCount = frameCount - finalFrames.length;
          setFramesWarning(`Only ${finalFrames.length.toLocaleString()} frames loaded (expected ${frameCount.toLocaleString()}). ${missingCount.toLocaleString()} frame${missingCount === 1 ? "" : "s"} may be missing or unavailable.`);
        } else {
          setFramesWarning(null);
        }

        // Keep progress bar visible if we're still calculating analytics for large datasets
        if (!shouldShowProgress) {
          setShowProgressBar(false);
        }
      } catch (err) {
        if (mounted && !cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load frames");

          // Try to use cached frames as fallback
          try {
            const latestFrame = await explorerApi.getLatestFrame();
            if (mounted && !cancelled) {
              const cachedFrames = await getCachedFramesInRange(
                latestFrame.header.frameNumber,
                frameCount
              );
              if (cachedFrames.length > 0) {
                setFrames(cachedFrames);
                setError("Using cached data. Some frames may be missing.");
              }
            }
          } catch {
            // Ignore fallback errors
          }
        }
      } finally {
        if (mounted && !cancelled) {
          setLoading(false);
        }
      }
    }

    loadFrames();

    return () => {
      mounted = false;
      cancelled = true;
    };
  }, [frameCount]);

  // Cache and load analytics calculations
  useEffect(() => {
    let mounted = true;

    async function loadOrCalculateAnalytics() {
      // Don't calculate analytics while still loading frames
      if (loading) {
        return;
      }

      if (frames.length === 0) {
        // Clear analytics when frames are cleared
        setCachedAnalyticsData([]);
        setCachedStats(null);
        setCachedProverDistribution([]);
        setCachedFramesPerProverPerHour(null);
        setCachedFrameSpacingOverTime(null);
        return;
      }

      const latestFrameNumber = frames[frames.length - 1]?.header.frameNumber;
      if (!latestFrameNumber) return;

      console.log(`loadOrCalculateAnalytics: frames.length=${frames.length}, frameCount=${frameCount}, latestFrameNumber=${latestFrameNumber}`);

      // Try to load from IndexedDB cache first
      try {
        const cached = await getCachedAnalytics(frameCount, latestFrameNumber);
        // Only use cache if frameCount matches exactly AND we have the expected number of frames
        // Also check that cached data length matches the actual frames we have
        if (cached && mounted && cached.frameCount === frameCount && cached.analyticsData.length === frames.length) {
          console.log(`Using cached analytics for frameCount=${frameCount}, cached length=${cached.analyticsData.length}, frames.length=${frames.length}`);
          setCachedAnalyticsData(cached.analyticsData);
          setCachedStats(cached.stats);
          setCachedProverDistribution(cached.proverDistribution);
          if (cached.framesPerProverPerHour) {
            setCachedFramesPerProverPerHour(cached.framesPerProverPerHour);
          }
          if (cached.frameSpacingOverTime) {
            setCachedFrameSpacingOverTime(cached.frameSpacingOverTime);
          }
          setShowProgressBar(false);
          return;
        } else {
          console.log(`Cache miss or mismatch: cached=${!!cached}, cached.frameCount=${cached?.frameCount}, cached.length=${cached?.analyticsData?.length}, frames.length=${frames.length}, expected=${frameCount}`);
        }
      } catch (err) {
        console.warn("Failed to load analytics cache:", err);
      }

      // Cache miss or invalid - calculate analytics
      const shouldShowProgress = frameCount >= 100;
      if (mounted) {
        setCalculatingAnalytics(true);
        if (shouldShowProgress) {
          setShowProgressBar(true);
          setProgress({ current: 0, total: frames.length, phase: "analytics" });
        }
      }

      // Use requestIdleCallback or setTimeout to avoid blocking UI
      const calculateAsync = () => {
        if (!mounted) return;

        // Update progress during calculation for large datasets
        const updateProgress = (current: number) => {
          if (mounted && shouldShowProgress) {
            setProgress({ current, total: frames.length, phase: "analytics" });
          }
        };

        // Process frames in chunks for progress updates
        const chunkSize = Math.max(1, Math.floor(frames.length / 10));
        let processedCount = 0;

        const processedData = processFramesForAnalytics(frames);
        processedCount += frames.length;
        updateProgress(processedCount);

        const calculatedStats = calculateStats(processedData);
        processedCount += frames.length;
        updateProgress(processedCount);

        const calculatedDistribution = calculateProverDistribution(processedData);
        processedCount += frames.length;
        updateProgress(processedCount);

        // Calculate frames per prover per hour (with adaptive bucket size)
        // Determine time range
        const timestamps = processedData.map((f) => f.timestamp).sort((a, b) => a - b);
        const minTime = timestamps[0];
        const maxTime = timestamps[timestamps.length - 1];
        const timeRangeHours = (maxTime - minTime) / (60 * 60 * 1000);

        // Use 10-minute buckets if data spans 2 hours or less
        const use10MinBuckets = timeRangeHours <= 2;
        const bucketSizeMs = use10MinBuckets ? 10 * 60 * 1000 : 60 * 60 * 1000;

        const bucketMap = new Map<number, Map<string, number>>();

        processedData.forEach((frame) => {
          // Round timestamp down to the bucket
          const bucketTimestamp = Math.floor(frame.timestamp / bucketSizeMs) * bucketSizeMs;

          if (!bucketMap.has(bucketTimestamp)) {
            bucketMap.set(bucketTimestamp, new Map());
          }

          const proverMap = bucketMap.get(bucketTimestamp)!;
          proverMap.set(frame.prover, (proverMap.get(frame.prover) || 0) + 1);
        });

        const proverTotals = new Map<string, number>();
        processedData.forEach((frame) => {
          proverTotals.set(frame.prover, (proverTotals.get(frame.prover) || 0) + 1);
        });

        const topProvers = Array.from(proverTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([prover]) => prover);

        // Get all bucket timestamps and sort chronologically
        const bucketTimestamps = Array.from(bucketMap.keys()).sort((a, b) => a - b);

        // Create chart data for all buckets chronologically
        const chartData: Array<Record<string, string | number>> = [];
        bucketTimestamps.forEach((bucketTimestamp) => {
          const proverMap = bucketMap.get(bucketTimestamp)!;
          const date = new Date(bucketTimestamp);

          // Format label based on bucket size
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          const day = String(date.getUTCDate()).padStart(2, "0");
          const hour = String(date.getUTCHours()).padStart(2, "0");

          let timeLabel: string;
          if (use10MinBuckets) {
            const minutes = String(date.getUTCMinutes()).padStart(2, "0");
            timeLabel = `${month}/${day} ${hour}:${minutes}`;
          } else {
            timeLabel = `${month}/${day} ${hour}:00`;
          }

          const dataPoint: Record<string, string | number> = {
            hour: timeLabel,
            timestamp: bucketTimestamp, // Keep numeric for sorting
          };

          topProvers.forEach((prover) => {
            dataPoint[prover] = proverMap.get(prover) || 0;
          });

          chartData.push(dataPoint);
        });

        const calculatedFramesPerProverPerHour = { chartData, topProvers };
        processedCount += frames.length;
        updateProgress(processedCount);

        // Calculate frame spacing over time
        const frameSpacingOverTime = calculateFrameSpacingOverTime(processedData);
        processedCount += frames.length;
        updateProgress(processedCount);

        if (mounted) {
          console.log(`Setting analytics data: processedData.length=${processedData.length}, frameCount=${frameCount}, calculatedStats.totalFrames=${calculatedStats.totalFrames}`);
          setCachedAnalyticsData(processedData);
          setCachedStats(calculatedStats);
          setCachedProverDistribution(calculatedDistribution);
          setCachedFramesPerProverPerHour(calculatedFramesPerProverPerHour);
          setCachedFrameSpacingOverTime(frameSpacingOverTime);
          setCalculatingAnalytics(false);
          setShowProgressBar(false);

          // Save to IndexedDB cache
          saveAnalyticsCache({
            frameCount,
            latestFrameNumber,
            cachedAt: Date.now(),
            analyticsData: processedData,
            stats: calculatedStats,
            proverDistribution: calculatedDistribution,
            framesPerProverPerHour: calculatedFramesPerProverPerHour,
            frameSpacingOverTime: frameSpacingOverTime,
          }).catch((err) => {
            console.warn("Failed to save analytics cache:", err);
          });

          // Prune old cache entries
          pruneAnalyticsCache().catch((err) => {
            console.warn("Failed to prune analytics cache:", err);
          });
        }
      };

      // Use requestIdleCallback if available, otherwise setTimeout
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(calculateAsync, { timeout: 1000 });
      } else {
        setTimeout(calculateAsync, 0);
      }
    }

    loadOrCalculateAnalytics();

    return () => {
      mounted = false;
    };
  }, [frames, frameCount, loading]);

  // Helper function to process frames for analytics
  const processFramesForAnalytics = (framesToProcess: GlobalFrame[]): FrameAnalytics[] => {
    if (framesToProcess.length === 0) return [];

    return framesToProcess.map((frame) => {
      const totalRequests = frame.requests?.reduce(
        (sum, bundle) => sum + (bundle.requests?.length ?? 0),
        0
      ) ?? 0;
      const timestamp = coerceTimestamp(frame.header.timestamp) ?? 0;

      return {
        frameNumber: frame.header.frameNumber,
        requests: totalRequests,
        timestamp,
        prover: frame.header.prover,
        selector: frame.header.parentSelector,
      } as FrameAnalytics;
    });
  };

  // Helper function to calculate statistics
  const calculateStats = (analyticsDataToProcess: FrameAnalytics[]) => {
    if (analyticsDataToProcess.length === 0) {
      return {
        totalFrames: 0,
        totalRequests: 0,
        avgRequestsPerFrame: 0,
        uniqueProvers: 0,
        uniqueSelectors: 0,
        avgFrameSpacing: 0,
        p50: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    const totalRequests = analyticsDataToProcess.reduce((sum, f) => sum + f.requests, 0);
    const avgRequestsPerFrame = totalRequests / analyticsDataToProcess.length;

    const uniqueProvers = new Set(analyticsDataToProcess.map((f) => f.prover)).size;
    const uniqueSelectors = new Set(analyticsDataToProcess.map((f) => f.selector)).size;

    // Calculate frame spacing (time difference between consecutive frames)
    const spacings: number[] = [];
    for (let i = 1; i < analyticsDataToProcess.length; i++) {
      const spacing = analyticsDataToProcess[i].timestamp - analyticsDataToProcess[i - 1].timestamp;
      if (spacing > 0) {
        spacings.push(spacing);
      }
    }

    // Calculate percentiles for frame spacing
    const calculatePercentile = (sorted: number[], percentile: number): number => {
      if (sorted.length === 0) return 0;
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    const sortedSpacings = [...spacings].sort((a, b) => a - b);
    const p50 = calculatePercentile(sortedSpacings, 50);
    const p75 = calculatePercentile(sortedSpacings, 75);
    const p90 = calculatePercentile(sortedSpacings, 90);
    const p95 = calculatePercentile(sortedSpacings, 95);
    const p99 = calculatePercentile(sortedSpacings, 99);

    const avgFrameSpacing = spacings.length > 0
      ? spacings.reduce((sum, s) => sum + s, 0) / spacings.length
      : 0;

    return {
      totalFrames: analyticsDataToProcess.length,
      totalRequests,
      avgRequestsPerFrame,
      uniqueProvers,
      uniqueSelectors,
      avgFrameSpacing,
      p50,
      p75,
      p90,
      p95,
      p99,
    };
  };

  // Helper function to calculate prover distribution
  const calculateProverDistribution = (analyticsDataToProcess: FrameAnalytics[]) => {
    const proverMap = new Map<string, number>();

    analyticsDataToProcess.forEach((frame) => {
      proverMap.set(frame.prover, (proverMap.get(frame.prover) || 0) + 1);
    });

    return Array.from(proverMap.entries())
      .map(([prover, count]) => ({
        prover,
        count,
        percentage: (count / analyticsDataToProcess.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 provers
  };

  // Helper function to calculate frame spacing over time
  function calculateFrameSpacingOverTime(analyticsDataToProcess: FrameAnalytics[]) {
    if (analyticsDataToProcess.length < 2) {
      return [];
    }

    // Sort frames by timestamp
    const sortedFrames = [...analyticsDataToProcess].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate intervals between consecutive frames
    const intervals: Array<{ timestamp: number; spacing: number }> = [];
    for (let i = 1; i < sortedFrames.length; i++) {
      const spacing = sortedFrames[i].timestamp - sortedFrames[i - 1].timestamp;
      if (spacing > 0) {
        // Use the timestamp of the later frame as the reference point
        intervals.push({
          timestamp: sortedFrames[i].timestamp,
          spacing,
        });
      }
    }

    if (intervals.length === 0) {
      return [];
    }

    // Determine time range and bucket size
    const timestamps = intervals.map((i) => i.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRangeHours = (maxTime - minTime) / (60 * 60 * 1000);

    // Use 10-minute buckets if data spans 2 hours or less, otherwise use hourly buckets
    const use10MinBuckets = timeRangeHours <= 2;
    const bucketSizeMs = use10MinBuckets ? 10 * 60 * 1000 : 60 * 60 * 1000;

    // Group intervals by time bucket
    const bucketMap = new Map<number, number[]>();
    intervals.forEach((interval) => {
      const bucketTimestamp = Math.floor(interval.timestamp / bucketSizeMs) * bucketSizeMs;
      if (!bucketMap.has(bucketTimestamp)) {
        bucketMap.set(bucketTimestamp, []);
      }
      bucketMap.get(bucketTimestamp)!.push(interval.spacing);
    });

    // Calculate average spacing per bucket
    const bucketTimestamps = Array.from(bucketMap.keys()).sort((a, b) => a - b);
    const chartData = bucketTimestamps.map((bucketTimestamp) => {
      const spacings = bucketMap.get(bucketTimestamp)!;
      const avgSpacing = spacings.reduce((sum, s) => sum + s, 0) / spacings.length;
      const date = new Date(bucketTimestamp);

      // Format label based on bucket size
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hour = String(date.getUTCHours()).padStart(2, "0");

      let timeLabel: string;
      if (use10MinBuckets) {
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        timeLabel = `${month}/${day} ${hour}:${minutes}`;
      } else {
        timeLabel = `${month}/${day} ${hour}:00`;
      }

      return {
        timeLabel,
        timestamp: bucketTimestamp,
        avgSpacing,
        frameCount: spacings.length,
      };
    });

    return chartData;
  }

  // Process frames for analytics (use cached if available)
  const analyticsData = useMemo(() => {
    return cachedAnalyticsData.length > 0 ? cachedAnalyticsData : processFramesForAnalytics(frames);
  }, [frames, cachedAnalyticsData]);

  // Calculate statistics (use cached if available)
  const stats = useMemo(() => {
    if (cachedStats) return cachedStats;
    return calculateStats(analyticsData);
  }, [analyticsData, cachedStats]);

  // Calculate prover distribution (use cached if available)
  const proverDistribution = useMemo(() => {
    if (cachedProverDistribution.length > 0) return cachedProverDistribution;
    return calculateProverDistribution(analyticsData);
  }, [analyticsData, cachedProverDistribution]);

  // Calculate frame spacing over time (use cached if available)
  const frameSpacingOverTime = useMemo(() => {
    if (cachedFrameSpacingOverTime) return cachedFrameSpacingOverTime;
    if (analyticsData.length < 2) return [];
    return calculateFrameSpacingOverTime(analyticsData);
  }, [analyticsData, cachedFrameSpacingOverTime]);

  // Calculate frames per prover per hour (use cached if available)
  const framesPerProverPerHour = useMemo(() => {
    if (cachedFramesPerProverPerHour) return cachedFramesPerProverPerHour;
    if (analyticsData.length === 0) return { chartData: [], topProvers: [] };

    // Determine time range
    const timestamps = analyticsData.map((f) => f.timestamp).sort((a, b) => a - b);
    const minTime = timestamps[0];
    const maxTime = timestamps[timestamps.length - 1];
    const timeRangeHours = (maxTime - minTime) / (60 * 60 * 1000);

    // Use 10-minute buckets if data spans 2 hours or less
    const use10MinBuckets = timeRangeHours <= 2;
    const bucketSizeMs = use10MinBuckets ? 10 * 60 * 1000 : 60 * 60 * 1000;

    // Group frames by time bucket and prover
    const bucketMap = new Map<number, Map<string, number>>();

    analyticsData.forEach((frame) => {
      // Round timestamp down to the bucket
      const bucketTimestamp = Math.floor(frame.timestamp / bucketSizeMs) * bucketSizeMs;

      if (!bucketMap.has(bucketTimestamp)) {
        bucketMap.set(bucketTimestamp, new Map());
      }

      const proverMap = bucketMap.get(bucketTimestamp)!;
      proverMap.set(frame.prover, (proverMap.get(frame.prover) || 0) + 1);
    });

    // Get top provers by total frame count
    const proverTotals = new Map<string, number>();
    analyticsData.forEach((frame) => {
      proverTotals.set(frame.prover, (proverTotals.get(frame.prover) || 0) + 1);
    });

    const topProvers = Array.from(proverTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([prover]) => prover);

    // Get all bucket timestamps and sort chronologically
    const bucketTimestamps = Array.from(bucketMap.keys()).sort((a, b) => a - b);

    // Create chart data for all buckets chronologically
    const chartData: Array<Record<string, string | number>> = [];
    bucketTimestamps.forEach((bucketTimestamp) => {
      const proverMap = bucketMap.get(bucketTimestamp)!;
      const date = new Date(bucketTimestamp);

      // Format label based on bucket size
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hour = String(date.getUTCHours()).padStart(2, "0");

      let timeLabel: string;
      if (use10MinBuckets) {
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        timeLabel = `${month}/${day} ${hour}:${minutes}`;
      } else {
        timeLabel = `${month}/${day} ${hour}:00`;
      }

      const dataPoint: Record<string, string | number> = {
        hour: timeLabel,
        timestamp: bucketTimestamp, // Keep numeric for sorting
      };

      topProvers.forEach((prover) => {
        dataPoint[prover] = proverMap.get(prover) || 0;
      });

      chartData.push(dataPoint);
    });

    return { chartData, topProvers };
  }, [analyticsData, cachedFramesPerProverPerHour]);

  // Format time spacing for display
  const formatSpacing = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}min`;
    return `${(ms / 3600000).toFixed(2)}h`;
  };

  // Don't block the view - always show content

  return (
    <div className="relative min-h-screen bg-beige pb-24 pt-16 dark:bg-[#100418]">
      <Helmet>
        <title>Frames Analytics • Quilibrium Explorer</title>
      </Helmet>

      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
      <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40 overflow-hidden" />
      <div className="pointer-events-none absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70"
          >
            ← Back
          </Link>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Analyze last
              </span>
              <div className="flex items-center gap-2">
                {FRAME_COUNT_OPTIONS.map((count, index) => (
                  <span key={count} className="flex items-center">
                    <button
                      onClick={() => {
                        if (!loading && !calculatingAnalytics) {
                          setFrameCount(count);
                          // Save to localStorage
                          if (typeof window !== "undefined") {
                            localStorage.setItem(FRAME_COUNT_STORAGE_KEY, String(count));
                          }
                        }
                      }}
                      disabled={loading || calculatingAnalytics}
                      className={`text-xs font-semibold uppercase tracking-[0.3em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        frameCount === count
                          ? "text-burgundy dark:text-white font-bold"
                          : "text-burgundy/60 dark:text-white/60 hover:text-burgundy dark:hover:text-white"
                      }`}
                    >
                      {count.toLocaleString()}
                    </button>
                    {index < FRAME_COUNT_OPTIONS.length - 1 && (
                      <span className="mx-1 text-burgundy/40 dark:text-white/40">|</span>
                    )}
                  </span>
                ))}
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                frames
              </span>
            </div>
            {showProgressBar && (
              <div className="flex items-center gap-3 w-full max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 whitespace-nowrap">
                  Downloading and analyzing
                </span>
                <div className="flex-1 bg-burgundy/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden min-w-[200px]">
                  <div
                    className="h-full bg-burgundy dark:bg-white transition-all duration-300 ease-out rounded-full"
                    style={{
                      width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-burgundy/60 dark:text-white/60 min-w-[3rem] text-right whitespace-nowrap">
                  {progress.current} / {progress.total}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
            {error}
          </div>
        )}

        {loadingFromCache && (
          <div className="mb-6 rounded-2xl border border-green/30 bg-light-green/40 p-4 text-sm text-green dark:border-green/30 dark:bg-green/15 dark:text-green">
            Loading from cache... Fetching missing frames in background.
          </div>
        )}

        {loadingFromCache && !showProgressBar && (
          <div className="mb-6 rounded-2xl border border-green/30 bg-light-green/40 p-4 text-sm text-green dark:border-green/30 dark:bg-green/15 dark:text-green">
            Loading from cache... Fetching missing frames in background.
          </div>
        )}

        {/* Statistics Cards */}
        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Statistics</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Total Frames
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {stats.totalFrames.toLocaleString()}
              </div>
            </div>
            <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Total Requests
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {stats.totalRequests.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-burgundy/70 dark:text-white/70">
                Avg: {stats.avgRequestsPerFrame.toFixed(2)} per frame
              </div>
            </div>
            <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Unique Provers
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {stats.uniqueProvers.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-burgundy/70 dark:text-white/70">
                {stats.uniqueSelectors.toLocaleString()} selectors
              </div>
            </div>
            <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Frame Spacing (Percentiles)
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-burgundy/70 dark:text-white/70">P50:</span>
                  <span className="font-semibold">{formatSpacing(stats.p50)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-burgundy/70 dark:text-white/70">P75:</span>
                  <span className="font-semibold">{formatSpacing(stats.p75)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-burgundy/70 dark:text-white/70">P90:</span>
                  <span className="font-semibold">{formatSpacing(stats.p90)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-burgundy/70 dark:text-white/70">P95:</span>
                  <span className="font-semibold">{formatSpacing(stats.p95)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-burgundy/70 dark:text-white/70">P99:</span>
                  <span className="font-semibold">{formatSpacing(stats.p99)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Requests Per Frame Chart */}
        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Requests Per Frame</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="frameNumber"
                stroke={axisColor}
                style={{ fontSize: "12px" }}
                label={{ value: "Frame Number", position: "insideBottom", offset: -5 }}
                tick={{ fill: axisColor }}
              />
              <YAxis
                stroke={axisColor}
                style={{ fontSize: "12px" }}
                label={{ value: "Requests", angle: -90, position: "insideLeft" }}
                tick={{ fill: axisColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  color: isDark ? "#ffffff" : "#391F5B",
                }}
              />
              <Legend wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B" }} />
              <Line
                type="monotone"
                dataKey="requests"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                name="Requests"
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Prover Distribution Pie Chart */}
        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">
            Prover Distribution (Top 10 by Frame Count)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={proverDistribution}
                dataKey="count"
                nameKey="prover"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ prover, percentage }) =>
                  `${percentage.toFixed(1)}%`
                }
              >
                {proverDistribution.map((entry, index) => {
                  // Generate colors that work in both light and dark mode
                  const colors = isDark
                    ? [
                        "#ffffff",
                        "#a78bfa",
                        "#60a5fa",
                        "#34d399",
                        "#fbbf24",
                        "#fb7185",
                        "#c084fc",
                        "#818cf8",
                        "#4ade80",
                        "#fcd34d",
                      ]
                    : [
                        "#8B1538",
                        "#6B21A8",
                        "#4338CA",
                        "#059669",
                        "#D97706",
                        "#DC2626",
                        "#7C3AED",
                        "#2563EB",
                        "#16A34A",
                        "#CA8A04",
                      ];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  color: isDark ? "#ffffff" : "#391F5B",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value} frames (${props.payload.percentage.toFixed(2)}%)`,
                  "Frames",
                ]}
              />
              <Legend
                wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B" }}
                formatter={(value: string) => {
                  const entry = proverDistribution.find((p) => p.prover === value);
                  if (!entry) return value;
                  const shortProver = value.length > 20
                    ? `${value.slice(0, 10)}...${value.slice(-6)}`
                    : value;
                  return `${shortProver} (${entry.count})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Frames Per Prover Per Hour */}
        {framesPerProverPerHour.chartData.length > 0 && (
          <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
            <h2 className="mb-6 text-2xl font-semibold">
              Frames Per Prover Over Time (Top 10 Provers)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={framesPerProverPerHour.chartData}>
                <defs>
                  {framesPerProverPerHour.topProvers.map((prover, index) => {
                    const colors = isDark
                      ? [
                          "#ffffff",
                          "#a78bfa",
                          "#60a5fa",
                          "#34d399",
                          "#fbbf24",
                          "#fb7185",
                          "#c084fc",
                          "#818cf8",
                          "#4ade80",
                          "#fcd34d",
                        ]
                      : [
                          "#8B1538",
                          "#6B21A8",
                          "#4338CA",
                          "#059669",
                          "#D97706",
                          "#DC2626",
                          "#7C3AED",
                          "#2563EB",
                          "#16A34A",
                          "#CA8A04",
                        ];
                    return (
                      <linearGradient
                        key={prover}
                        id={`color${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={colors[index % colors.length]}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={colors[index % colors.length]}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="hour"
                  stroke={axisColor}
                  style={{ fontSize: "11px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: axisColor }}
                />
                <YAxis
                  stroke={axisColor}
                  style={{ fontSize: "12px" }}
                  label={{ value: "Frames", angle: -90, position: "insideLeft" }}
                  tick={{ fill: axisColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    color: isDark ? "#ffffff" : "#391F5B",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} frames`,
                    name.length > 20 ? `${name.slice(0, 10)}...${name.slice(-6)}` : name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B" }}
                  formatter={(value: string) => {
                    const shortProver = value.length > 20
                      ? `${value.slice(0, 10)}...${value.slice(-6)}`
                      : value;
                    return shortProver;
                  }}
                />
                {framesPerProverPerHour.topProvers.map((prover, index) => {
                  const colors = isDark
                    ? [
                        "#ffffff",
                        "#a78bfa",
                        "#60a5fa",
                        "#34d399",
                        "#fbbf24",
                        "#fb7185",
                        "#c084fc",
                        "#818cf8",
                        "#4ade80",
                        "#fcd34d",
                      ]
                    : [
                        "#8B1538",
                        "#6B21A8",
                        "#4338CA",
                        "#059669",
                        "#D97706",
                        "#DC2626",
                        "#7C3AED",
                        "#2563EB",
                        "#16A34A",
                        "#CA8A04",
                      ];
                  return (
                    <Area
                      key={prover}
                      type="monotone"
                      dataKey={prover}
                      stackId="1"
                      stroke={colors[index % colors.length]}
                      fill={`url(#color${index})`}
                      name={prover}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Frame Spacing Over Time */}
        {frameSpacingOverTime.length > 0 && (
          <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
            <h2 className="mb-6 text-2xl font-semibold">Average Time Between Frames Over Time</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={frameSpacingOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="timeLabel"
                  stroke={axisColor}
                  style={{ fontSize: "11px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: axisColor }}
                />
                <YAxis
                  stroke={axisColor}
                  style={{ fontSize: "12px" }}
                  label={{ value: "Average Spacing", angle: -90, position: "insideLeft" }}
                  tick={{ fill: axisColor }}
                  tickFormatter={(value) => formatSpacing(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    color: isDark ? "#ffffff" : "#391F5B",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${formatSpacing(value)} (${props.payload.frameCount} frame${props.payload.frameCount === 1 ? "" : "s"})`,
                    "Avg Spacing",
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B" }} />
                <Line
                  type="monotone"
                  dataKey="avgSpacing"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  name="Average Frame Spacing"
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Frame Spacing Percentile Distribution */}
        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Frame Spacing Percentile Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={[
                { percentile: "P50", value: stats.p50 },
                { percentile: "P75", value: stats.p75 },
                { percentile: "P90", value: stats.p90 },
                { percentile: "P95", value: stats.p95 },
                { percentile: "P99", value: stats.p99 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="percentile"
                stroke={axisColor}
                style={{ fontSize: "12px" }}
                tick={{ fill: axisColor }}
              />
              <YAxis
                stroke={axisColor}
                style={{ fontSize: "12px" }}
                label={{ value: "Spacing", angle: -90, position: "insideLeft" }}
                tick={{ fill: axisColor }}
                tickFormatter={(value) => formatSpacing(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  color: isDark ? "#ffffff" : "#391F5B",
                }}
                formatter={(value: number) => formatSpacing(value)}
              />
              <Legend wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B" }} />
              <Bar dataKey="value" fill={barColor} name="Frame Spacing" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}

