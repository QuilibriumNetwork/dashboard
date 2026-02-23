import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import {
  LineChart,
  Line,
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
import { coerceTimestamp, formatTimestamp, base64ToIPFSCID } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Callout from "@/components/ui/Callout";
import { useTheme } from "@/components/helpers/ThemeContext";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import {
  getCachedFramesInRange,
  findGapsInCache,
  saveFramesToCache,
  pruneCache,
  isCacheStale,
  getCachedFrames,
  getFramesByNumbers,
  estimateStorageUsage,
  deleteFramesKeepingLast,
  clearFrameCache,
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
    minRequestsPerFrame: number;
    maxRequestsPerFrame: number;
    medianRequestsPerFrame: number;
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
    lastFrameNumber: number;
    lastTimestamp: number;
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
  const [storageUsage, setStorageUsage] = useState<{ sizeBytes: number; frameCount: number } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [proverQmMap, setProverQmMap] = useState<Map<string, string>>(new Map());
  const [framesPerProverQmMap, setFramesPerProverQmMap] = useState<Map<string, string>>(new Map());
  const [hoveredProver, setHoveredProver] = useState<string | null>(null);

  // Theme-aware colors
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(57,31,91,0.1)";
  const axisColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(57,31,91,0.6)";
  const lineColor = isDark ? "#ffffff" : "#8B1538";
  const tooltipBg = isDark ? "rgba(26,15,39,0.95)" : "rgba(255,255,255,0.95)";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.2)" : "rgba(57,31,91,0.2)";

  useEffect(() => {
    let mounted = true;
    let cancelled = false;

    // Set loading to true FIRST to prevent analytics effect from running prematurely
    setLoading(true);

    // Clear cached analytics and frames immediately when frameCount changes
    setCachedAnalyticsData([]);
    setCachedStats(null);
    setCachedProverDistribution([]);
    setCachedFramesPerProverPerHour(null);
    setCachedFrameSpacingOverTime(null);
    setFrames([]); // Clear old frames immediately to prevent showing stale data
    setFramesWarning(null); // Clear warning when changing frame count

    async function loadFrames() {
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

            // Update frames state so UI reflects newly fetched frames
            if (mounted && !cancelled) {
              const currentFrames = framesToLoad
                .filter((f) => f.header.frameNumber >= startNumber && f.header.frameNumber <= latestNumber)
                .sort((a, b) => a.header.frameNumber - b.header.frameNumber);
              setFrames([...currentFrames]);
            }
          }

          // After processing all batches, hide the loading message
          // (we've finished fetching all missing frames we could fetch)
          setLoadingFromCache(false);

          // Save any remaining frames in the batch (non-blocking)
          if (framesToSave.length > 0) {
            const batchToSave = [...framesToSave];
            framesToSave.length = 0;
            // Save asynchronously without blocking - don't await
            saveFramesToCache(batchToSave).catch((err) => {
              console.warn("Failed to save final batch to cache:", err);
            });
          }

          // Don't wait for lastBatchSavePromise - it's non-blocking and frames are already saved in batches
          // This prevents the function from hanging if the promise doesn't resolve
          if (lastBatchSavePromise) {
            // Let it complete in the background without blocking
            lastBatchSavePromise.catch((err) => {
              console.warn("Background batch save failed:", err);
            });
          }
        } else {
          // No missing frames - all frames were cached, hide the loading message immediately
          setLoadingFromCache(false);
        }

        if (!mounted || cancelled) {
          return;
        }

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
        // Make this non-blocking since frames are already saved in batches
        if (apiCallCount > 0) {
          // Save asynchronously without blocking - frames are already saved in batches
          saveFramesToCache(finalFrames).catch((err) => {
            console.warn("Failed to save final frames to cache:", err);
          });
        }

        // Prune cache to keep it manageable
        await pruneCache(latestNumber, frameCount + 500); // Keep extra for gap filling

        if (!mounted || cancelled) {
          return;
        }

        // Use function form to ensure we're setting the latest state
        setFrames(() => {
          return [...finalFrames]; // Create new array reference
        });

        // Set warning if we have fewer frames than requested
        if (finalFrames.length < frameCount) {
          const missingCount = frameCount - finalFrames.length;
          setFramesWarning(`Only ${finalFrames.length.toLocaleString()} frames loaded (expected ${frameCount.toLocaleString()}). ${missingCount.toLocaleString()} frame${missingCount === 1 ? "" : "s"} may be missing or unavailable.`);
        } else {
          setFramesWarning(null);
        }

        // Keep progress bar visible if we're still calculating analytics for large datasets
        // Don't hide it here - let the analytics calculation control visibility
        if (!shouldShowProgress && !calculatingAnalytics) {
          setShowProgressBar(false);
        }

        // Final safety check: ensure loading message is hidden
        setLoadingFromCache(false);

        // Recalculate storage usage asynchronously (non-blocking)
        // This happens after loading is set to false so buttons aren't blocked
        if (mounted && !cancelled) {
          // Use setTimeout to ensure this doesn't block the finally block
          setTimeout(async () => {
            if (mounted && !cancelled) {
              try {
                const usage = await estimateStorageUsage();
                setStorageUsage(usage);
              } catch (err) {
                console.warn("Failed to recalculate storage usage:", err);
              }
            }
          }, 100);
        }
      } catch (err) {
        if (mounted && !cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load frames");
          // Hide loading message on error
          setLoadingFromCache(false);

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
        // Always set loading to false in finally block
        // The cleanup function handles unmounting, so it's safe to always set it here
        setLoading(false);
      }
    }

    loadFrames();

    return () => {
      mounted = false;
      cancelled = true;
      // Note: loading will be set to false in the finally block of loadFrames
      // No need to set it here to avoid race conditions
    };
  }, [frameCount]);

  // Cache and load analytics calculations
  useEffect(() => {
    let mounted = true;

    async function loadOrCalculateAnalytics() {
      // Don't calculate analytics while still loading frames
      if (loading) {
        setCalculatingAnalytics(false); // Ensure it's false when waiting for frames
        return;
      }

      if (frames.length === 0) {
        // Clear analytics when frames are cleared
        setCachedAnalyticsData([]);
        setCachedStats(null);
        setCachedProverDistribution([]);
        setCachedFramesPerProverPerHour(null);
        setCachedFrameSpacingOverTime(null);
        setCalculatingAnalytics(false); // Ensure it's false when no frames
        return;
      }

      // If we have fewer frames than requested, check if we're still loading
      // If loading is complete and we have fewer frames, proceed with what we have
      // (some frames may be missing/unavailable)
      if (frames.length < frameCount && loading) {
        // Still loading - wait for more frames
        return;
      }

      const latestFrameNumber = frames[frames.length - 1]?.header.frameNumber;
      if (!latestFrameNumber) {
        setCalculatingAnalytics(false); // Ensure it's false when no latest frame
        return;
      }

      // Try to load from IndexedDB cache first
      try {
        const cached = await getCachedAnalytics(frameCount, latestFrameNumber);
        // Only use cache if frameCount matches exactly AND cached data length matches the actual frames we have
        // This handles cases where we have fewer frames than requested (some frames may be missing)
        if (cached && mounted && cached.frameCount === frameCount && cached.analyticsData.length === frames.length) {
          setCachedAnalyticsData(cached.analyticsData);
          // Ensure cached stats has all required properties (handle old cache format)
          const stats = cached.stats;
          if ('minRequestsPerFrame' in stats && 'maxRequestsPerFrame' in stats && 'medianRequestsPerFrame' in stats) {
            setCachedStats(stats);
          } else {
            // Old cache format - recalculate stats
            const recalculatedStats = calculateStats(cached.analyticsData);
            setCachedStats(recalculatedStats);
          }
          setCachedProverDistribution(cached.proverDistribution);
          if (cached.framesPerProverPerHour) {
            setCachedFramesPerProverPerHour(cached.framesPerProverPerHour);
          }
          if (cached.frameSpacingOverTime) {
            setCachedFrameSpacingOverTime(cached.frameSpacingOverTime);
          }
          setShowProgressBar(false);
          setCalculatingAnalytics(false); // Ensure this is false when using cached analytics
          return;
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
          // Reset progress to show we're starting analytics calculation
          setProgress({ current: 0, total: frames.length, phase: "analytics" });
        } else {
          // Even if we don't show progress bar, still set phase for UI consistency
          setProgress(prev => ({ ...prev, phase: "analytics" }));
        }
      }

      // Use requestIdleCallback or setTimeout to avoid blocking UI
      const calculateAsync = () => {
        if (!mounted) return;

        // Update progress during calculation for large datasets
        // Track progress through 5 main steps of analytics calculation
        const totalSteps = 5;
        const updateProgress = (step: number) => {
          if (mounted && shouldShowProgress) {
            setProgress({
              current: Math.floor((step / totalSteps) * frames.length),
              total: frames.length,
              phase: "analytics"
            });
          }
        };

        // Step 1: Process frames for analytics
        updateProgress(1);
        const processedData = processFramesForAnalytics(frames);

        // Step 2: Calculate stats
        updateProgress(2);
        const calculatedStats = calculateStats(processedData);

        // Step 3: Calculate prover distribution
        updateProgress(3);
        const calculatedDistribution = calculateProverDistribution(processedData);

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

        // Step 4: Calculate frames per prover per hour
        updateProgress(4);
        const calculatedFramesPerProverPerHour = { chartData, topProvers };

        // Step 5: Calculate frame spacing over time
        updateProgress(5);
        const frameSpacingOverTime = calculateFrameSpacingOverTime(processedData);

        if (mounted) {
          // Show 100% completion before hiding
          if (shouldShowProgress) {
            setProgress({ current: frames.length, total: frames.length, phase: "analytics" });
          }

          setCachedAnalyticsData(processedData);
          setCachedStats(calculatedStats);
          setCachedProverDistribution(calculatedDistribution);
          setCachedFramesPerProverPerHour(calculatedFramesPerProverPerHour);
          setCachedFrameSpacingOverTime(frameSpacingOverTime);

          // Small delay before hiding to show completion
          setTimeout(() => {
            if (mounted) {
              setCalculatingAnalytics(false);
              setShowProgressBar(false);
            }
          }, 300);

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
      // Ensure calculatingAnalytics is reset when effect unmounts
      setCalculatingAnalytics(false);
    };
  }, [frames, frameCount, loading]);

  // Calculate storage usage
  useEffect(() => {
    async function calculateStorage() {
      try {
        // Add a small delay to ensure IndexedDB operations from frame loading are complete
        await new Promise(resolve => setTimeout(resolve, 500));
        const usage = await estimateStorageUsage();
        setStorageUsage(usage);
      } catch (err) {
        console.warn("Failed to calculate storage usage:", err);
      }
    }
    calculateStorage();
    // Recalculate after frames change or when modal closes
    if (!showClearModal) {
      calculateStorage();
    }
  }, [frames, showClearModal]);

  // Format storage size for display
  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Handle frame deletion
  const handleDeleteFrames = async (keepCount: number | null) => {
    setIsClearing(true);
    try {
      // Check current frame count
      const currentUsage = await estimateStorageUsage();

      if (keepCount === null) {
        // Delete all - check if we have frames to delete
        if (currentUsage.frameCount === 0) {
          setError("No frames to delete");
          setIsClearing(false);
          return;
        }
        await clearFrameCache();
      } else {
        // Ensure we keep at least 10 frames
        if (keepCount < 10) {
          setError("Cannot delete frames. Must keep at least 10 frames.");
          setIsClearing(false);
          return;
        }

        // Check if we have enough frames to keep
        if (currentUsage.frameCount <= keepCount) {
          setError(`Cannot delete frames. Only ${currentUsage.frameCount} frames available.`);
          setIsClearing(false);
          return;
        }

        // Keep last N frames
        await deleteFramesKeepingLast(keepCount);
      }

      // Clear analytics cache and reload frames
      setCachedAnalyticsData([]);
      setCachedStats(null);
      setCachedProverDistribution([]);
      setCachedFramesPerProverPerHour(null);
      setCachedFrameSpacingOverTime(null);
      setFrames([]);

      // Recalculate storage
      const usage = await estimateStorageUsage();
      setStorageUsage(usage);

      // Update frame count to match what was kept
      if (keepCount !== null) {
        // Find the closest valid option that matches or is less than keepCount
        const validOptions = FRAME_COUNT_OPTIONS.filter(opt => opt <= keepCount);
        const newFrameCount = validOptions.length > 0 ? validOptions[validOptions.length - 1] : 10;
        setFrameCount(newFrameCount);
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(FRAME_COUNT_STORAGE_KEY, String(newFrameCount));
        }
      } else {
        // If all deleted, set to minimum (10)
        const newFrameCount = 10;
        setFrameCount(newFrameCount);
        if (typeof window !== "undefined") {
          localStorage.setItem(FRAME_COUNT_STORAGE_KEY, String(newFrameCount));
        }
      }

      setShowClearModal(false);
    } catch (err) {
      console.error("Failed to delete frames:", err);
      setError(err instanceof Error ? err.message : "Failed to delete frames");
    } finally {
      setIsClearing(false);
    }
  };

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
        minRequestsPerFrame: 0,
        maxRequestsPerFrame: 0,
        medianRequestsPerFrame: 0,
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

    // Calculate requests per frame statistics
    const requestsPerFrame = analyticsDataToProcess.map((f) => f.requests);
    const sortedRequests = [...requestsPerFrame].sort((a, b) => a - b);
    const minRequestsPerFrame = sortedRequests[0];
    const maxRequestsPerFrame = sortedRequests[sortedRequests.length - 1];

    // Calculate median (50th percentile)
    const calculatePercentile = (sorted: number[], percentile: number): number => {
      if (sorted.length === 0) return 0;
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };
    const medianRequestsPerFrame = calculatePercentile(sortedRequests, 50);

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
      minRequestsPerFrame,
      maxRequestsPerFrame,
      medianRequestsPerFrame,
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
    const proverMap = new Map<string, { count: number; lastFrameNumber: number; lastTimestamp: number }>();

    analyticsDataToProcess.forEach((frame) => {
      const existing = proverMap.get(frame.prover);
      if (existing) {
        if (frame.frameNumber > existing.lastFrameNumber) {
          proverMap.set(frame.prover, {
            count: existing.count + 1,
            lastFrameNumber: frame.frameNumber,
            lastTimestamp: frame.timestamp,
          });
        } else {
          proverMap.set(frame.prover, {
            count: existing.count + 1,
            lastFrameNumber: existing.lastFrameNumber,
            lastTimestamp: existing.lastTimestamp,
          });
        }
      } else {
        proverMap.set(frame.prover, {
          count: 1,
          lastFrameNumber: frame.frameNumber,
          lastTimestamp: frame.timestamp,
        });
      }
    });

    return Array.from(proverMap.entries())
      .map(([prover, data]) => ({
        prover,
        count: data.count,
        percentage: (data.count / analyticsDataToProcess.length) * 100,
        lastFrameNumber: data.lastFrameNumber,
        lastTimestamp: data.lastTimestamp,
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

  // Convert prover addresses to Qm format for Prover Distribution
  useEffect(() => {
    async function convertProversToQm() {
      if (proverDistribution.length === 0) {
        setProverQmMap(new Map());
        return;
      }

      const newMap = new Map<string, string>();
      const promises = proverDistribution.map(async (entry) => {
        const qm = await base64ToIPFSCID(entry.prover);
        if (qm) {
          newMap.set(entry.prover, qm);
        }
      });
      await Promise.all(promises);
      setProverQmMap(newMap);
    }
    convertProversToQm();
  }, [proverDistribution]);

  // Convert prover addresses to Qm format for Frames Per Prover Over Time
  useEffect(() => {
    async function convertProversToQm() {
      if (!framesPerProverPerHour || framesPerProverPerHour.topProvers.length === 0) {
        setFramesPerProverQmMap(new Map());
        return;
      }

      const newMap = new Map<string, string>();
      const promises = framesPerProverPerHour.topProvers.map(async (prover) => {
        const qm = await base64ToIPFSCID(prover);
        if (qm) {
          newMap.set(prover, qm);
        }
      });
      await Promise.all(promises);
      setFramesPerProverQmMap(newMap);
    }
    convertProversToQm();
  }, [framesPerProverPerHour]);

  // Format time spacing for display
  const formatSpacing = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}min`;
    return `${(ms / 3600000).toFixed(2)}h`;
  };

  // Get color for a prover by index
  const getProverColor = (index: number) => {
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
    return colors[index % colors.length];
  };

  // Don't block the view - always show content

  return (
    <PageLayout title="Frames Analytics • Quilibrium Explorer">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/"
            className="text-sm action-text"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-4">
            {storageUsage && (
              <div className="text-sm sm:text-xs text-muted">
                Cache: {formatStorageSize(storageUsage.sizeBytes)} ({storageUsage.frameCount.toLocaleString()} frames)
              </div>
            )}
            {storageUsage && storageUsage.frameCount > 10 && (
              <button
                onClick={() => setShowClearModal(true)}
                className="text-sm sm:text-xs font-medium text-muted hover:text-danger transition-colors"
              >
                Clear Frame Data
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-xs text-muted">
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
                      title={loading ? "Loading frames..." : calculatingAnalytics ? "Calculating analytics..." : ""}
                      className={`text-sm sm:text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        frameCount === count
                          ? "text-primary font-bold"
                          : "text-muted hover:text-burgundy dark:hover:text-white"
                      }`}
                    >
                      {count.toLocaleString()}
                    </button>
                    {index < FRAME_COUNT_OPTIONS.length - 1 && (
                      <span className="mx-1 text-faint">|</span>
                    )}
                  </span>
                ))}
              </div>
              <span className="text-sm sm:text-xs text-muted">
                frames
              </span>
            </div>
            {(showProgressBar || calculatingAnalytics) && (
              <div className="flex items-center gap-3 w-full max-w-2xl">
                <span className="text-sm sm:text-xs text-muted whitespace-nowrap">
                  {progress.phase === "analytics" || calculatingAnalytics
                    ? "Calculating analytics"
                    : "Downloading frames"}
                </span>
                <div className="flex-1 bg-burgundy/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden min-w-[200px]">
                  <div
                    className="h-full bg-burgundy dark:bg-white transition-all duration-300 ease-out rounded-full"
                    style={{
                      width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="text-sm sm:text-xs text-muted min-w-[3rem] text-right whitespace-nowrap">
                  {progress.current} / {progress.total}
                </div>
              </div>
            )}
            {(frameCount === 500 || frameCount === 1000) && (loading || calculatingAnalytics) && (
              <Callout type="warning">
                <div className="font-semibold mb-1">Large dataset warning</div>
                <div>
                  Loading {frameCount.toLocaleString()} frames will use approximately{" "}
                  <strong>{frameCount === 1000 ? "200-400MB" : "100-200MB"}</strong> of storage space.
                </div>
              </Callout>
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

        {/* Statistics Cards */}
        <section className="mb-10 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 text-burgundy shadow-xl dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Statistics</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-subtle bg-white/90 p-4 dark:bg-surface-raised flex-1">
                <div className="label-text">
                  Total Frames
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {stats.totalFrames.toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl border border-subtle bg-white/90 p-4 dark:bg-surface-raised flex-1">
                <div className="label-text">
                  Total Requests
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {stats.totalRequests.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-subtle bg-white/90 p-5 dark:bg-surface-raised">
              <div className="label-text">
                Requests Per Frame
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Min:</span>
                  <span className="font-semibold">{stats.minRequestsPerFrame.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Median:</span>
                  <span className="font-semibold">{stats.medianRequestsPerFrame.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Max:</span>
                  <span className="font-semibold">{stats.maxRequestsPerFrame.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Avg:</span>
                  <span className="font-semibold">{stats.avgRequestsPerFrame.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-subtle bg-white/90 p-4 dark:bg-surface-raised">
              <div className="label-text">
                Unique Provers
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {stats.uniqueProvers.toLocaleString()}
              </div>
              <div className="mt-1 text-sm sm:text-xs text-secondary">
                {stats.uniqueSelectors.toLocaleString()} selectors
              </div>
            </div>
            <div className="rounded-2xl border border-subtle bg-white/90 p-5 dark:bg-surface-raised">
              <div className="label-text">
                Frame Spacing (Percentiles)
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">P50:</span>
                  <span className="font-semibold">{formatSpacing(stats.p50)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">P75:</span>
                  <span className="font-semibold">{formatSpacing(stats.p75)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">P90:</span>
                  <span className="font-semibold">{formatSpacing(stats.p90)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">P95:</span>
                  <span className="font-semibold">{formatSpacing(stats.p95)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">P99:</span>
                  <span className="font-semibold">{formatSpacing(stats.p99)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Requests Per Frame Chart */}
        <section className="mb-10 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 shadow-xl dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Requests Per Frame</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="frameNumber"
                stroke={axisColor}
                style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}
                label={{ value: "Frame Number", position: "insideBottom", offset: -5, style: { fontSize: "clamp(10px, 2.5vw, 12px)" } }}
                tick={{ fill: axisColor }}
              />
              <YAxis
                stroke={axisColor}
                style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}
                label={{ value: "Requests", angle: -90, position: "insideLeft", style: { fontSize: "clamp(10px, 2.5vw, 12px)" } }}
                tick={{ fill: axisColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  color: isDark ? "#ffffff" : "#391F5B",
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                }}
              />
              <Legend
                wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B", paddingTop: "20px", fontSize: "clamp(11px, 2.5vw, 12px)" }}
                verticalAlign="bottom"
              />
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
        <section className="mb-10 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 shadow-xl dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">
            Prover Distribution (Top 10 by Frame Count)
          </h2>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="md:w-1/2 flex items-center justify-center min-h-[400px]">
              <ResponsiveContainer width="100%" height={400}>
              <PieChart>
              <Pie
                data={proverDistribution}
                dataKey="count"
                nameKey="prover"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry: any) => {
                  if (entry && typeof entry === 'object' && 'percentage' in entry) {
                    return `${entry.percentage.toFixed(1)}%`;
                  }
                  return '';
                }}
              >
                {proverDistribution.map((entry, index) => {
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={getProverColor(index)}
                      onMouseEnter={() => setHoveredProver(entry.prover)}
                      onMouseLeave={() => {
                        // Keep the last hovered prover - don't clear on mouse leave
                      }}
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
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                }}
                content={() => null}
              />
              </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="md:w-1/2 w-full">
              <Accordion
                type="single"
                collapsible
                value={hoveredProver ?? ""}
                onValueChange={(value) => {
                  // Allow manual accordion control, but also sync with hover
                  if (value) {
                    setHoveredProver(value);
                  }
                }}
                className="w-full"
              >
                {proverDistribution.map((entry, index) => {
                  const qm = proverQmMap.get(entry.prover);
                  const borderColor = getProverColor(index);
                  const isHovered = hoveredProver === entry.prover;

                  return (
                    <AccordionItem
                      key={entry.prover}
                      value={entry.prover}
                      className="border border-subtle rounded-lg transition-all p-2 mb-2"
                      style={{
                        borderColor: borderColor,
                      }}
                    >
                      <AccordionTrigger
                        className="hover:no-underline px-2"
                        onMouseEnter={() => setHoveredProver(entry.prover)}
                      >
                        <div className="flex items-center gap-3 w-full text-left">
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: borderColor }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-primary">
                              {qm ? (
                                <HoverableCopyText text={qm}>
                                  <span className="font-mono break-all">{qm}</span>
                                </HoverableCopyText>
                              ) : (
                                <span className="font-mono break-all">{entry.prover}</span>
                              )}
                            </div>
                            <div className="text-sm sm:text-xs text-muted mt-1">
                              {entry.percentage.toFixed(2)}% • {entry.count.toLocaleString()} frames
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4 px-4 space-y-2 text-sm sm:text-xs">
                          <div className="flex justify-between">
                            <span className="text-secondary">Frames processed:</span>
                            <span className="font-semibold">{entry.count.toLocaleString()}/{stats.totalFrames.toLocaleString()} ({entry.percentage.toFixed(2)}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Last frame processed:</span>
                            <span className="font-semibold">{entry.lastFrameNumber.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Last frame processed timestamp:</span>
                            <span className="font-semibold">{formatTimestamp(String(entry.lastTimestamp))}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Frames Per Prover Per Hour */}
        {framesPerProverPerHour.chartData.length > 0 && (
          <section className="mb-10 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 shadow-xl dark:text-white">
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
                  style={{ fontSize: "clamp(10px, 2.5vw, 11px)" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: axisColor }}
                />
                <YAxis
                  stroke={axisColor}
                  style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}
                  label={{ value: "Frames", angle: -90, position: "insideLeft", style: { fontSize: "clamp(10px, 2.5vw, 12px)" } }}
                  tick={{ fill: axisColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    color: isDark ? "#ffffff" : "#391F5B",
                    fontSize: "clamp(11px, 2.5vw, 12px)",
                  }}
                  formatter={(value: number, name: string) => {
                    const qm = framesPerProverQmMap.get(name);
                    const displayName = qm ? (qm.length > 20 ? `${qm.slice(0, 10)}...${qm.slice(-6)}` : qm) : (name.length > 20 ? `${name.slice(0, 10)}...${name.slice(-6)}` : name);
                    return [`${value} frames`, displayName];
                  }}
                />
                <Legend
                  wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B", fontSize: "clamp(10px, 2.5vw, 12px)" }}
                  verticalAlign="bottom"
                  content={(props) => {
                    const { payload } = props;
                    if (!payload || !Array.isArray(payload)) return null;
                    return (
                      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-3 mt-4">
                        {payload.map((entry: any, index: number) => {
                          const qm = framesPerProverQmMap.get(entry.value);
                          const displayText = qm ? (qm.length > 20 ? `${qm.slice(0, 10)}...${qm.slice(-6)}` : qm) : (entry.value.length > 20 ? `${entry.value.slice(0, 10)}...${entry.value.slice(-6)}` : entry.value);
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm sm:text-xs">
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  backgroundColor: entry.color,
                                  borderRadius: "2px",
                                }}
                              />
                              {qm ? (
                                <HoverableCopyText text={qm}>
                                  <span className="font-mono">{displayText}</span>
                                </HoverableCopyText>
                              ) : (
                                <span className="font-mono">{displayText}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
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
          <section className="mb-10 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 shadow-xl dark:text-white">
            <h2 className="mb-6 text-2xl font-semibold">Average Time Between Frames Over Time</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={frameSpacingOverTime} margin={{ left: 50, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="timeLabel"
                  stroke={axisColor}
                  style={{ fontSize: "clamp(10px, 2.5vw, 11px)" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: axisColor }}
                />
                <YAxis
                  stroke={axisColor}
                  style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}
                  width={100}
                  label={{
                    value: "Average Spacing",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fontSize: "clamp(11px, 2.5vw, 12px)",
                      fontWeight: "bold",
                      textAnchor: "middle"
                    },
                    offset: 15
                  }}
                  tick={{ fill: axisColor }}
                  tickFormatter={(value) => formatSpacing(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    color: isDark ? "#ffffff" : "#391F5B",
                    fontSize: "clamp(11px, 2.5vw, 12px)",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${formatSpacing(value)} (${props.payload.frameCount} frame${props.payload.frameCount === 1 ? "" : "s"})`,
                    "Avg Spacing",
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B", fontSize: "clamp(11px, 2.5vw, 12px)" }} />
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
      </div>

      {/* Clear Frame Data Modal */}
      <Modal
        show={showClearModal}
        onClose={() => !isClearing && setShowClearModal(false)}
        title="Clear Frame Data"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {storageUsage && (
            <div className="text-sm text-primary">
              <p className="mb-2">
                Current cache: <strong>{formatStorageSize(storageUsage.sizeBytes)}</strong> ({storageUsage.frameCount.toLocaleString()} frames)
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="form-label mb-4">
              Select how many frames to keep:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleDeleteFrames(10)}
                disabled={isClearing || !!(storageUsage && storageUsage.frameCount <= 10)}
                className="w-full text-left px-4 py-3 rounded-lg border border-default bg-white dark:bg-overlay text-primary hover:bg-active-highlight hover:border-strong focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:dark:hover:bg-[#1a0f27] disabled:hover:border-default"
              >
                Delete All Frames
                <span className="ml-2 text-sm sm:text-xs text-muted">
                  (saves last 10)
                </span>
                {storageUsage && storageUsage.frameCount <= 10 && (
                  <span className="ml-2 text-sm sm:text-xs text-muted">
                    (Must keep at least 10 frames)
                  </span>
                )}
              </button>
              {[25, 50, 100, 250, 500, 1000].map((count) => {
                const canDelete = storageUsage && storageUsage.frameCount > count;
                return (
                  <button
                    key={count}
                    onClick={() => handleDeleteFrames(count)}
                    disabled={isClearing || !canDelete}
                    className="w-full text-left px-4 py-3 rounded-lg border border-default bg-white dark:bg-overlay text-primary hover:bg-active-highlight hover:border-strong focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:dark:hover:bg-[#1a0f27] disabled:hover:border-default"
                  >
                    Keep Last {count.toLocaleString()} Frames
                    {!canDelete && storageUsage && (
                      <span className="ml-2 text-sm sm:text-xs text-muted">
                        ({storageUsage.frameCount} frames available)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {isClearing && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner size="16" />
              <span>Clearing frames...</span>
            </div>
          )}
        </div>
      </Modal>
    </PageLayout>
  );
}

