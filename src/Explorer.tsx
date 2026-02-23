import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { Select } from "@/components/ui/Select";

import {
  CertifiedProposal,
  GlobalFrame,
  GossipMessage,
  HypergraphRecord,
  PeerRecord,
  ProverRecord,
  ProverShardSummary,
  explorerApi,
} from "@/lib/api";
import {
  base64ToHex,
  formatBase64Bytes,
  formatTimestamp,
  formatRelative,
  coerceTimestamp,
  convertBase64ToHex,
} from "@/lib/format";
import {
  formatPeerRows,
  compareVersions,
  getProtocolsFromAddresses,
  matchesSearch,
  type PeerRow,
} from "@/lib/peers";
import ChevronDown from "@/components/ui/ChevronDown";
import Icon from "@/components/ui/Icons";
import Arrow from "@/components/ui/Arrow";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import { usePeerFilters, serializePeerFilters } from "@/components/PeerDirectoryFiltersAndExport";
import { PeerDirectoryFilters, type PeerFilterState } from "@/components/PeerDirectoryFilters";
import { PeerDirectoryExport } from "@/components/PeerDirectoryExport";
import { PeerDirectory } from "@/components/PeerDirectory";
import { FrameFeedFilters, type FrameFilterState } from "@/components/FrameFeedFilters";
import { FrameFeedExport } from "@/components/FrameFeedExport";
import {
  getCachedFrames,
  getFramesByNumbers,
  saveFramesToCache,
  pruneCache,
} from "@/lib/frameCache";
import { formatProvers } from "@/lib/provers";
import { ProverCard } from "@/components/ProverCard";

const SHARD_STATUS_COLUMNS = [
  "active",
  "joining",
  "paused",
  "leaving",
  "rejected",
  "kicked",
];

const FRAME_COUNT_STORAGE_KEY = "explorer-frame-count";
const VALID_FRAME_COUNTS = [10, 25, 50] as const;

function getShardTotal(summary: ProverShardSummary) {
  const counts = summary.counts ?? {};
  return Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function getShardStatusCount(summary: ProverShardSummary, status: string) {
  const counts = summary.counts ?? {};
  const value = counts[status];
  return Number.isFinite(value) ? Number(value) : 0;
}

function getCoverageToneForActive(activeCount: number) {
  if (activeCount < 3) return "risk";
  if (activeCount < 6) return "warn";
  return "safe";
}

function truncateFilter(filter: string) {
  if (!filter) return "–";
  const prefix = filter.startsWith("0x") ? "0x" : "";
  const value = prefix ? filter.slice(2) : filter;
  if (value.length <= 16) {
    return filter;
  }
  return `${prefix}${value.slice(0, 8)}…${value.slice(-6)}`;
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-default bg-light-grey px-4 py-1.5 text-sm md:px-3 md:py-1 md:text-xs font-semibold uppercase tracking-label text-secondary dark:bg-surface-subtle">
      {label}
    </span>
  );
}

function CopyButton({ text, className = "", showText = false }: { text: string; className?: string; showText?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 ml-2 px-2 py-1 rounded transition-colors hover:bg-active-highlight ${showText ? '' : 'border border-default'} ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <span className="text-sm sm:text-xs text-green dark:text-light-green">Copied</span>
      ) : (
        <>
          {showText && <span className="text-sm sm:text-xs text-secondary">Copy to Clipboard</span>}
          <Icon name="emptyclipboard" className="w-4 h-4 text-muted" />
        </>
      )}
    </button>
  );
}

function CopyFrameDataButton({ frame }: { frame: GlobalFrame | null }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (!frame) return;
      const convertedFrame = convertBase64ToHex(frame) as GlobalFrame;
      const frameDataJson = JSON.stringify(convertedFrame, null, 2);
      await navigator.clipboard.writeText(frameDataJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  if (!frame) return null;

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-2 py-1 text-sm action-text bg-transparent hover:bg-transparent"
    >
      <Icon name="emptyclipboard" className="w-4 h-4 flex-shrink-0" />
      <span>{copied ? 'Copied!' : 'Copy data'}</span>
    </button>
  );
}

function CopyFilterLinkButton({ filters }: { filters: PeerFilterState }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const params = serializePeerFilters(filters);
      const url = new URL(window.location.href);
      url.hash = "peer-directory";
      url.search = params.toString();
      const link = url.toString();

      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedVersions.size > 0 ||
    filters.selectedPubsubProtocols.size > 0 ||
    filters.selectedStreamProtocols.size > 0 ||
    filters.selectedCapabilityCounts.size > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <button
      onClick={handleCopy}
      className="text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
      title={copied ? "Link copied!" : "Copy filter link"}
      aria-label="Copy filter link"
    >
      {copied ? (
        <>
          <span className="text-green dark:text-light-green">Link copied!</span>
          <Icon name="check" className="w-3 h-3 text-green dark:text-light-green" />
        </>
      ) : (
        <>
          <span>Copy filter link</span>
          <Icon name="emptyclipboard" className="w-3 h-3" />
        </>
      )}
    </button>
  );
}


interface FrameDataProps {
  frameNumber: number;
  requests: number;
  prover: string;
  selector: string;
  timestamp: string;
  onNavigate: () => void;
}

function FrameDataCard({ frameNumber, requests, prover, selector, timestamp, onNavigate }: FrameDataProps) {
  return (
    <div
      onClick={onNavigate}
      className="rounded-2xl border border-default bg-white px-4 py-4 text-sm text-burgundy dark:bg-surface-raised dark:text-white cursor-pointer transition hover:bg-hover-highlight"
    >
      <div className="mb-3 font-semibold text-base text-primary">
        Frame #{frameNumber.toLocaleString()}
      </div>
      <div className="space-y-2 text-sm sm:text-xs">
        <div>
          <span className="text-muted">Prover: </span>
          <span className="font-mono break-all">
            {(() => {
              const displayValue = formatBase64Bytes(prover);
              const copyValue = base64ToHex(prover);
              const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
                ? `0x${copyValue}`
                : copyValue ?? prover;
              return (
                <HoverableCopyText text={finalCopyValue}>
                  {displayValue}
                </HoverableCopyText>
              );
            })()}
          </span>
        </div>
        <div>
          <span className="text-muted">Selector: </span>
          <span className="font-mono break-all">
            {(() => {
              const displayValue = formatBase64Bytes(selector);
              const copyValue = base64ToHex(selector);
              const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
                ? `0x${copyValue}`
                : copyValue ?? selector;
              return (
                <HoverableCopyText text={finalCopyValue}>
                  {displayValue}
                </HoverableCopyText>
              );
            })()}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-muted">Requests: </span>
            <span>{requests}</span>
          </div>
          <div className="text-muted text-right">
            {formatTimestamp(timestamp)}
          </div>
        </div>
        <div className="pt-3 border-t border-subtle">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="flex items-center gap-2 text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
          >
            <span>View frame details</span>
            <Arrow className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


function FrameDataRow({ frameNumber, requests, prover, selector, timestamp, onNavigate }: FrameDataProps) {
  return (
    <tr
      className="text-sm cursor-pointer transition hover:bg-hover-highlight"
      onClick={onNavigate}
    >
      <td className="py-4 pr-6 font-semibold text-primary">
        #{frameNumber.toLocaleString()}
      </td>
      <td className="py-4 pr-6">{requests}</td>
      <td className="py-4 pr-6 font-mono">
        {(() => {
          const displayValue = formatBase64Bytes(prover);
          const copyValue = base64ToHex(prover);
          const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
            ? `0x${copyValue}`
            : copyValue ?? prover;
          return (
            <HoverableCopyText text={finalCopyValue}>
              {displayValue}
            </HoverableCopyText>
          );
        })()}
      </td>
      <td className="py-4 pr-6 font-mono">
        {(() => {
          const displayValue = formatBase64Bytes(selector);
          const copyValue = base64ToHex(selector);
          const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
            ? `0x${copyValue}`
            : copyValue ?? selector;
          return (
            <HoverableCopyText text={finalCopyValue}>
              {displayValue}
            </HoverableCopyText>
          );
        })()}
      </td>
      <td className="py-4 pr-6">{formatTimestamp(timestamp)}</td>
      <td className="py-4 pr-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className="flex items-center gap-2 text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
        >
          <span>View frame details</span>
          <Arrow className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function PeerCard({ peer }: { peer: ReturnType<typeof formatPeerRows>[number] }) {
  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white">
      <div className="label-text">Peer</div>
      <div className="mt-1 font-mono text-sm sm:text-xs">
        <HoverableCopyText text={peer.peerId}>{peer.peerId}</HoverableCopyText>
      </div>
      <div className="mt-2 text-sm sm:text-xs text-secondary">Version {peer.version}</div>
      <div className="mt-3 text-sm sm:text-xs">
        <div className="text-sm sm:text-xs font-medium text-muted">Pubsub</div>
        {peer.pubsub.length ? peer.pubsub.map((addr) => (
          <div key={addr} className="break-all">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-3 text-sm sm:text-xs">
        <div className="text-sm sm:text-xs font-medium text-muted">Stream</div>
        {peer.stream.length ? peer.stream.map((addr) => (
          <div key={addr} className="break-all">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
    </div>
  );
}

const coverageBadgeClasses: Record<string, string> = {
  safe: "bg-green/10 text-green dark:bg-green/20 dark:text-light-green",
  warn: "bg-warning-subtle text-warning",
  risk: "bg-danger-subtle text-danger",
};

function ShardSummaryCard({ summary }: { summary: ProverShardSummary }) {
  const counts = summary.counts ?? {};
  const total = getShardTotal(summary);
  const activeCount = getShardStatusCount(summary, "active");
  const tone = getCoverageToneForActive(activeCount);
  const badgeClass = coverageBadgeClasses[tone] ?? "";

  const orderedStatuses = [
    ...SHARD_STATUS_COLUMNS,
    ...Object.keys(counts).filter((key) => !SHARD_STATUS_COLUMNS.includes(key)),
  ];

  return (
    <Link to={`/provers/shards/${summary.filter}`} className="block">
      <div className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white transition hover:bg-hover-highlight">
        <div className="label-text">Shard filter</div>
        <div className="mt-1 font-mono text-sm sm:text-xs break-all">
          <HoverableCopyText text={summary.filter}>{truncateFilter(summary.filter)}</HoverableCopyText>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-muted">Total provers:</span>
          <span className="font-semibold text-primary">{total.toLocaleString()}</span>
          <span className={`text-xs font-semibold uppercase tracking-label rounded-full px-3 py-1 ${badgeClass}`}>
            {tone === "safe" ? "healthy" : tone === "warn" ? "warning" : "risk"}
          </span>
        </div>
        <div className="mt-3 text-sm sm:text-xs text-secondary space-y-1">
          {orderedStatuses.map((status) => {
            const value = counts[status];
            if (value === undefined) return null;
            return (
              <div key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <span className="font-semibold text-primary">{value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

interface FrameSearchState {
  frame?: GlobalFrame;
  error?: string;
}

interface CertifiedSearchState {
  proposal?: CertifiedProposal;
  error?: string;
}

interface HypergraphSearchState {
  vertex?: HypergraphRecord;
  hyperedge?: HypergraphRecord;
  error?: string;
}

function CollapsibleMessage({
  message,
  isExpanded,
  onToggle,
}: {
  message: GossipMessage;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    if (measureRef.current && contentRef.current) {
      const measureElement = measureRef.current;
      const contentElement = contentRef.current;

      // Match the width of the visible content element
      const contentWidth = contentElement.offsetWidth;
      measureElement.style.width = `${contentWidth}px`;

      const computedStyle = window.getComputedStyle(measureElement);
      const calculatedLineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5;
      setLineHeight(calculatedLineHeight);

      // Measure the full height without restrictions
      const fullHeight = measureElement.scrollHeight;
      const maxHeight = calculatedLineHeight * 5;
      setHasOverflow(fullHeight > maxHeight);
    }
  }, [message.data]);

  return (
    <div className="rounded-2xl border border-default bg-white px-4 py-4 text-sm text-burgundy dark:bg-surface-raised dark:text-white">
      <div className="text-sm sm:text-xs text-muted">
        {formatTimestamp(message.timestamp)}
      </div>
      <div className="mt-1 font-mono text-sm sm:text-xs text-secondary break-words">
        <span className="flex items-center flex-wrap gap-1">
          <span>from </span>
          <HoverableCopyText text={message.from}>
            <span className="break-all">{message.from}</span>
          </HoverableCopyText>
          <span> · seqno </span>
          <HoverableCopyText text={String(message.seqno)}>
            {message.seqno}
          </HoverableCopyText>
        </span>
      </div>
      {/* Hidden element to measure full height - positioned off-screen */}
      <div
        ref={measureRef}
        className="mt-2 font-mono text-sm sm:text-xs text-primary break-all whitespace-pre-wrap absolute left-[-9999px] top-[-9999px]"
        aria-hidden="true"
      >
        {message.data}
      </div>
      <div className="relative mt-2">
        <div className="flex items-start justify-between mb-1">
          <div className="text-sm sm:text-xs font-medium text-muted">Data</div>
          <CopyButton text={message.data} showText={true} className="mb-1" />
        </div>
        <div className="relative">
          <div
            ref={contentRef}
            className={`font-mono text-sm sm:text-xs text-primary break-all whitespace-pre-wrap transition-all ${
              !isExpanded ? 'overflow-hidden' : ''
            }`}
            style={{
              maxHeight: !isExpanded && lineHeight > 0 ? `${lineHeight * 5}px` : 'none',
            }}
          >
            {message.data}
          </div>
          {!isExpanded && hasOverflow && (
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white via-white/70 to-transparent dark:from-surface-raised dark:via-surface-raised/70 dark:to-transparent">
              <button
                onClick={onToggle}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 text-sm sm:text-xs font-medium text-secondary hover:text-primary bg-burgundy/10 hover:bg-burgundy/20 dark:bg-white/10 dark:hover:bg-white/20 rounded-full backdrop-blur-sm transition-all border border-default hover:border-strong"
              >
                <ChevronDown className="size-3 transition-transform" />
                <span>Expand</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {isExpanded && hasOverflow && (
        <button
          onClick={onToggle}
          className="mt-3 flex items-center gap-1 text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
        >
          Collapse
          <ChevronDown
            className="size-3 transition-transform rotate-180"
          />
        </button>
      )}
    </div>
  );
}


function serializeFrameFilters(filters: FrameFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.searchQuery) {
    params.set("filter_prover_selector", filters.searchQuery);
  }
  if (filters.minFrameNumber) {
    params.set("filter_frame_min", filters.minFrameNumber);
  }
  if (filters.maxFrameNumber) {
    params.set("filter_frame_max", filters.maxFrameNumber);
  }
  if (filters.minRequests) {
    params.set("filter_requests_min", filters.minRequests);
  }
  if (filters.maxRequests) {
    params.set("filter_requests_max", filters.maxRequests);
  }

  return params;
}

function deserializeFrameFilters(params: URLSearchParams, defaultFilters: FrameFilterState): FrameFilterState {
  const filters = { ...defaultFilters };

  const proverSelector = params.get("filter_prover_selector");
  if (proverSelector) {
    filters.searchQuery = proverSelector;
  }

  const frameMin = params.get("filter_frame_min");
  if (frameMin) {
    filters.minFrameNumber = frameMin;
  }

  const frameMax = params.get("filter_frame_max");
  if (frameMax) {
    filters.maxFrameNumber = frameMax;
  }

  const requestsMin = params.get("filter_requests_min");
  if (requestsMin) {
    filters.minRequests = requestsMin;
  }

  const requestsMax = params.get("filter_requests_max");
  if (requestsMax) {
    filters.maxRequests = requestsMax;
  }

  return filters;
}

export default function Explorer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [latestFrame, setLatestFrame] = useState<GlobalFrame | null>(null);
  const [frameFeed, setFrameFeed] = useState<GlobalFrame[]>([]);
  const [certified, setCertified] = useState<CertifiedProposal | null>(null);
  const [messages, setMessages] = useState<GossipMessage[]>([]);
  const [peers, setPeers] = useState<PeerRecord[]>([]);
  const [provers, setProvers] = useState<ProverRecord[]>([]);
  const [shardSummaries, setShardSummaries] = useState<ProverShardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [frameCount, setFrameCount] = useState<number>(() => {
    // Load from localStorage or default to 10
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FRAME_COUNT_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (VALID_FRAME_COUNTS.includes(parsed as any)) {
          return parsed;
        }
      }
    }
    return 10;
  });
  const frameCountRef = useRef<number>(10);

  const [frameQuery, setFrameQuery] = useState("");
  const [frameLookup, setFrameLookup] = useState<FrameSearchState>({});

  const [certifiedQuery, setCertifiedQuery] = useState("");
  const [certifiedLookup, setCertifiedLookup] = useState<CertifiedSearchState>({});

  const [hypergraphQuery, setHypergraphQuery] = useState("");
  const [hypergraphLookup, setHypergraphLookup] = useState<HypergraphSearchState>({});

  // Function to hydrate frame feed with caching
  const hydrateFrameFeed = useCallback(async (baseFrame: GlobalFrame, count: number) => {
    const latestNumber = baseFrame.header.frameNumber;
    const startNumber = Math.max(1, latestNumber - count + 1);
    const neededFrameNumbers = Array.from(
      { length: latestNumber - startNumber + 1 },
      (_, i) => startNumber + i
    );

    // Step 1: Check cache for frames
    const cachedFramesMap = await getFramesByNumbers(neededFrameNumbers);
    const cachedFrames = Array.from(cachedFramesMap.values()).sort(
      (a, b) => b.header.frameNumber - a.header.frameNumber
    );
    const cachedFrameNumbers = new Set(cachedFrames.map((f) => f.header.frameNumber));

    // Show cached frames immediately
    if (cachedFrames.length > 0) {
      setFrameFeed(cachedFrames);
    }

    // Step 2: Find missing frames
    const missingFrameNumbers = neededFrameNumbers.filter(
      (num) => !cachedFrameNumbers.has(num)
    );

    if (missingFrameNumbers.length === 0) {
      return;
    }

    // Step 3: Fetch missing frames in parallel batches
    const framesToLoad = [...cachedFrames];
    const BATCH_FETCH_SIZE = 20; // Fetch 20 frames in parallel at a time
    const BATCH_SAVE_SIZE = 50; // Save to cache every 50 frames
    const framesToSave: GlobalFrame[] = [];
    let lastBatchSavePromise: Promise<void> | null = null;

    // Sort to fetch in order
    missingFrameNumbers.sort((a, b) => b - a);

    // Fetch frames in parallel batches
    for (let i = 0; i < missingFrameNumbers.length; i += BATCH_FETCH_SIZE) {
      const batch = missingFrameNumbers.slice(i, i + BATCH_FETCH_SIZE);

      // Fetch all frames in this batch in parallel
      const fetchPromises = batch.map(async (frameNum) => {
        try {
          // Use baseFrame if it's the latest frame
          if (frameNum === latestNumber) {
            return { success: true, frame: baseFrame, frameNum };
          }
          const frame = await explorerApi.getFrame(frameNum);
          return { success: true, frame, frameNum };
        } catch (err) {
          console.warn(`Failed to load frame ${frameNum}:`, err);
          return { success: false, frame: null, frameNum };
        }
      });

      const results = await Promise.all(fetchPromises);

      // Process successful fetches
      for (const result of results) {
        if (result.success && result.frame) {
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

          // Save to cache in batches (non-blocking)
          if (framesToSave.length >= BATCH_SAVE_SIZE) {
            const batchToSave = [...framesToSave];
            framesToSave.length = 0;

            lastBatchSavePromise = saveFramesToCache(batchToSave).catch((err) => {
              console.warn("Failed to save batch to cache:", err);
            });
          }
        }
      }

      // Update frame feed after each batch
      const sortedFrames = [...framesToLoad].sort((a, b) => b.header.frameNumber - a.header.frameNumber);
      setFrameFeed(sortedFrames);
    }

    // Save any remaining frames
    if (framesToSave.length > 0) {
      const batchToSave = [...framesToSave];
      framesToSave.length = 0;
      lastBatchSavePromise = saveFramesToCache(batchToSave).catch((err) => {
        console.warn("Failed to save final batch to cache:", err);
      });
    }

    // Ensure all frames are saved to cache
    const finalFrames = framesToLoad
      .filter((f) => f.header.frameNumber >= startNumber && f.header.frameNumber <= latestNumber)
      .sort((a, b) => b.header.frameNumber - a.header.frameNumber);

    if (finalFrames.length > cachedFrames.length) {
      try {
        await saveFramesToCache(finalFrames);
      } catch (err) {
        console.warn("Failed to save final frames to cache:", err);
      }
    }

    // Wait for last batch save
    if (lastBatchSavePromise) {
      await lastBatchSavePromise;
    }

    // Prune cache
    await pruneCache(latestNumber, count + 500);

    setFrameFeed(finalFrames);
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [frame, proposal, gossip, peerList, proversList, shardList] = await Promise.all([
          explorerApi.getLatestFrame(),
          explorerApi.getLatestCertified().catch(() => null),
          explorerApi.getMessages(20).catch(() => []),
          explorerApi.getPeers().catch(() => []),
          explorerApi.getProvers().catch(() => []),
          explorerApi.getProverShardSummaries().catch(() => []),
        ]);
        if (!mounted) {
          return;
        }
        setLatestFrame(frame);
        setCertified(proposal);
        setMessages(gossip);
        setPeers(peerList);
        setProvers(proversList);
        setShardSummaries(shardList);
        // Don't call hydrateFrameFeed here - let the frameCount effect handle it
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load explorer data");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = window.setInterval(load, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []); // Only run on mount

  // Update frame feed when frameCount changes (using existing latestFrame)
  useEffect(() => {
    if (latestFrame) {
      // Clear old data immediately to show loading state
      setFrameFeed([]);
      setLoading(true);
      hydrateFrameFeed(latestFrame, frameCount).then(() => {
        setLoading(false);
      }).catch((err) => {
        console.error('Error loading frames:', err);
        setLoading(false);
      });
    }
  }, [frameCount, latestFrame, hydrateFrameFeed]);

  // Update ref when frameCount changes
  useEffect(() => {
    frameCountRef.current = frameCount;
  }, [frameCount]);

  // Save frameCount to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(FRAME_COUNT_STORAGE_KEY, String(frameCount));
      } catch (err) {
        console.error("Failed to save frame count to localStorage:", err);
      }
    }
  }, [frameCount]);

  // Reset frameCount to valid value if it's set to an unavailable option
  useEffect(() => {
    if (!VALID_FRAME_COUNTS.includes(frameCount as any)) {
      setFrameCount(10);
    }
  }, [frameCount]);

  // Handle anchor scrolling when hash is present
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.substring(1); // Remove the #
      const element = document.getElementById(hash);
      if (element) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location.hash, loading]); // Re-run when hash changes or loading completes

  const latestHeader = latestFrame?.header;

  const frameFeedRows = useMemo(() => frameFeed.map((frame) => {
    const { header } = frame;
    const timestampNum = coerceTimestamp(header.timestamp) ?? 0;
    return {
      frameNumber: header.frameNumber,
      requests: frame.requests?.length ?? 0,
      shardsTouched: header.globalCommitments?.length ?? 0,
      prover: header.prover,
      selector: header.parentSelector,
      timestamp: header.timestamp, // Keep as string for formatTimestamp
      timestampNum, // Keep as number for export
    };
  }), [frameFeed]);

  // Frame filter state - initialize from URL params
  const defaultFrameFilters: FrameFilterState = {
    searchQuery: "",
    minFrameNumber: "",
    maxFrameNumber: "",
    minRequests: "",
    maxRequests: "",
  };

  const frameFiltersInitialized = useRef(false);
  const [frameFilters, setFrameFilters] = useState<FrameFilterState>(() =>
    deserializeFrameFilters(searchParams, defaultFrameFilters)
  );

  // Mark as initialized after first render
  useEffect(() => {
    frameFiltersInitialized.current = true;
  }, []);

  // Update URL when frame filters change (but not on initial mount)
  useEffect(() => {
    if (!frameFiltersInitialized.current) return;

    const newParams = serializeFrameFilters(frameFilters);
    const currentParams = new URLSearchParams(searchParams);

    // Remove old frame filter params
    currentParams.delete("filter_prover_selector");
    currentParams.delete("filter_frame_min");
    currentParams.delete("filter_frame_max");
    currentParams.delete("filter_requests_min");
    currentParams.delete("filter_requests_max");

    // Add new frame filter params
    newParams.forEach((value, key) => {
      currentParams.set(key, value);
    });

    // Only update if params actually changed
    const newParamsStr = currentParams.toString();
    const oldParamsStr = searchParams.toString();
    if (newParamsStr !== oldParamsStr) {
      setSearchParams(currentParams, { replace: true });
    }
  }, [frameFilters, searchParams, setSearchParams]);

  // Filter frames based on filters
  const filteredFrameRows = useMemo(() => {
    return frameFeedRows.filter((frame) => {
      // Search filter (prover or selector)
      if (frameFilters.searchQuery.trim()) {
        const query = frameFilters.searchQuery.trim().toLowerCase();
        const proverHex = base64ToHex(frame.prover)?.toLowerCase() ?? "";
        const selectorHex = base64ToHex(frame.selector)?.toLowerCase() ?? "";
        const proverBase64 = frame.prover.toLowerCase();
        const selectorBase64 = frame.selector.toLowerCase();
        if (
          !proverHex.includes(query) &&
          !selectorHex.includes(query) &&
          !proverBase64.includes(query) &&
          !selectorBase64.includes(query)
        ) {
          return false;
        }
      }

      // Frame number range
      if (frameFilters.minFrameNumber) {
        const min = Number(frameFilters.minFrameNumber);
        if (Number.isFinite(min) && frame.frameNumber < min) {
          return false;
        }
      }
      if (frameFilters.maxFrameNumber) {
        const max = Number(frameFilters.maxFrameNumber);
        if (Number.isFinite(max) && frame.frameNumber > max) {
          return false;
        }
      }

      // Requests range
      if (frameFilters.minRequests) {
        const min = Number(frameFilters.minRequests);
        if (Number.isFinite(min) && frame.requests < min) {
          return false;
        }
      }
      if (frameFilters.maxRequests) {
        const max = Number(frameFilters.maxRequests);
        if (Number.isFinite(max) && frame.requests > max) {
          return false;
        }
      }

      return true;
    });
  }, [frameFeedRows, frameFilters]);

  const peerRows = useMemo(() => formatPeerRows(peers), [peers]);
  const shardRows = useMemo(() => {
    return [...shardSummaries].sort((a, b) => a.filter.localeCompare(b.filter));
  }, [shardSummaries]);
  const shardCoverageStats = useMemo(() => {
    let risk = 0;
    let warn = 0;
    shardRows.forEach((summary) => {
      const activeCount = getShardStatusCount(summary, "active");
      const tone = getCoverageToneForActive(activeCount);
      if (tone === "risk") risk += 1;
      else if (tone === "warn") warn += 1;
    });
    return { risk, warn };
  }, [shardRows]);
  const proverRows = useMemo(() => formatProvers(provers), [provers]);

  // Use the peer filters hook
  const {
    filters,
    setFilters,
    filteredPeers: filteredPeerRows,
    uniqueVersions,
    versionCounts,
    uniqueCapabilityCounts,
    capabilityCountCounts,
    pubsubProtocolCounts,
    streamProtocolCounts,
  } = usePeerFilters(peerRows, peers);

  const totalPeerCount = peerRows.length;
  const filteredPeerCount = filteredPeerRows.length;
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.trim() !== "" ||
      filters.selectedVersions.size > 0 ||
      filters.selectedPubsubProtocols.size > 0 ||
      filters.selectedStreamProtocols.size > 0 ||
      filters.selectedCapabilityCounts.size > 0
    );
  }, [filters]);

  const formattedPeerCount = hasActiveFilters
    ? `${filteredPeerCount.toLocaleString()} / ${totalPeerCount.toLocaleString()}`
    : totalPeerCount.toLocaleString();

  async function handleFrameLookup(event: React.FormEvent) {
    event.preventDefault();
    setFrameLookup({});
    const value = Number(frameQuery);
    if (!Number.isFinite(value) || value < 0) {
      setFrameLookup({ error: "Enter a valid frame number" });
      return;
    }
    try {
      const frame = await explorerApi.getFrame(value);
      setFrameLookup({ frame });
    } catch (err) {
      setFrameLookup({ error: err instanceof Error ? err.message : "Frame lookup failed" });
    }
  }

  async function handleCertifiedLookup(event: React.FormEvent) {
    event.preventDefault();
    setCertifiedLookup({});
    const value = Number(certifiedQuery);
    if (!Number.isFinite(value) || value < 0) {
      setCertifiedLookup({ error: "Enter a valid rank" });
      return;
    }
    try {
      const proposal = await explorerApi.getCertified(value);
      setCertifiedLookup({ proposal });
    } catch (err) {
      setCertifiedLookup({ error: err instanceof Error ? err.message : "Certified lookup failed" });
    }
  }

  async function handleHypergraphLookup(event: React.FormEvent) {
    event.preventDefault();
    setHypergraphLookup({});
    if (!hypergraphQuery || hypergraphQuery.length !== 64 * 2) {
      setHypergraphLookup({ error: "ID must be 64-byte hex (128 chars)" });
      return;
    }
    try {
      const [vertex, hyperedge] = await Promise.all([
        explorerApi.getVertex(hypergraphQuery).catch(() => undefined),
        explorerApi.getHyperedge(hypergraphQuery).catch(() => undefined),
      ]);
      setHypergraphLookup({ vertex, hyperedge });
    } catch (err) {
      setHypergraphLookup({ error: err instanceof Error ? err.message : "Lookup failed" });
    }
  }

  return (
    <PageLayout title="Quilibrium Explorer">
        <div className="relative mx-auto max-w-6xl px-6">
          <section id="global-frame" className="section-glow-a relative overflow-hidden rounded-3xl border border-subtle bg-surface p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-label text-primary">
                    Global frame
                  </h2>
                  <span className="text-sm sm:text-xs font-semibold uppercase tracking-label text-secondary">
                    Rank #{latestHeader?.rank.toLocaleString() ?? "–"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-secondary">
                    {loading ? (
                      "Refreshing explorer data…"
                    ) : latestHeader?.timestamp ? (
                      <span className="text-sm sm:text-xs text-muted">
                        {formatTimestamp(latestHeader.timestamp)} ({formatRelative(latestHeader.timestamp)})
                      </span>
                    ) : null}
                  </div>
                  {latestFrame && (
                    <CopyFrameDataButton frame={latestFrame} />
                  )}
                </div>
              </div>

              {/* Add this new section */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-default bg-surface-raised p-6 dark:text-white">
                  <div className="label-text">Frame Number</div>
                  <div className="mt-2 text-3xl font-semibold text-primary">
                    {latestHeader?.frameNumber?.toLocaleString() ?? "–"}
                  </div>
                  <div className="text-sm text-secondary">
                    Difficulty {latestHeader?.difficulty ?? "–"}
                  </div>
                </div>
                <div className="rounded-2xl border border-default bg-surface-raised p-6 dark:text-white">
                  <div className="label-text">Prover</div>
                  {latestHeader?.prover && (() => {
                    const displayValue = formatBase64Bytes(latestHeader.prover);
                    const copyValue = base64ToHex(latestHeader.prover);
                    const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
                      ? `0x${copyValue}`
                      : copyValue ?? latestHeader.prover;
                    return (
                      <div className="mt-2 text-2xl font-semibold text-primary font-mono">
                        <HoverableCopyText text={finalCopyValue}>
                          {displayValue}
                        </HoverableCopyText>
                      </div>
                    );
                  })()}
                </div>
                <div className="rounded-2xl border border-default bg-surface-raised p-6 dark:text-white">
                  <div className="label-text">Peers</div>
                  <div className="mt-2 text-3xl font-semibold text-primary">
                    {formattedPeerCount}
                  </div>
                  <div className="text-sm text-secondary">
                    Active nodes reporting reachability
                  </div>
                </div>
              </div>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-2xl border border-default bg-white px-4 py-4 text-burgundy dark:bg-surface-raised dark:text-white">
                  <div className="label-text">Requests root</div>
                  {latestHeader?.requestsRoot && (() => {
                    const displayValue = formatBase64Bytes(latestHeader.requestsRoot);
                    const copyValue = base64ToHex(latestHeader.requestsRoot);
                    const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
                      ? `0x${copyValue}`
                      : copyValue ?? latestHeader.requestsRoot;
                    return (
                      <div className="text-lg font-semibold font-mono">
                        <HoverableCopyText text={finalCopyValue}>
                          {displayValue}
                        </HoverableCopyText>
                      </div>
                    );
                  })()}
                </div>
                <div className="rounded-2xl border border-default bg-white px-4 py-4 text-burgundy dark:bg-surface-raised dark:text-white">
                  <div className="label-text">Parent selector</div>
                  {latestHeader?.parentSelector && (() => {
                    const displayValue = formatBase64Bytes(latestHeader.parentSelector);
                    const copyValue = base64ToHex(latestHeader.parentSelector);
                    const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
                      ? `0x${copyValue}`
                      : copyValue ?? latestHeader.parentSelector;
                    return (
                      <div className="text-lg font-semibold font-mono">
                        <HoverableCopyText text={finalCopyValue}>
                          {displayValue}
                        </HoverableCopyText>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          <section id="frame-feed" className="section-glow-b mt-14 relative overflow-hidden rounded-3xl border border-subtle bg-surface p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-label text-primary">
                  Frame feed
                </h2>
                <Link
                  to="/frames-analytics"
                  className="text-sm sm:text-xs action-text flex items-center gap-2"
                >
                  <span>View Analytics</span>
                  <Arrow className="w-4 h-4" />
                </Link>
              </div>

              {/* Add this new section */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm sm:text-xs text-muted">
                    Showing statistics from the last
                  </span>
                  <Select
                    value={String(frameCount)}
                    onValueChange={(val) => {
                      const newCount = parseInt(val, 10);
                      if (VALID_FRAME_COUNTS.includes(newCount as any)) {
                        setFrameCount(newCount);
                      }
                    }}
                    options={[
                      { value: "10", label: "10" },
                      { value: "25", label: "25" },
                      { value: "50", label: "50" },
                    ]}
                  />
                  <span className="text-sm sm:text-xs text-muted">
                    frames
                  </span>
                </div>
              </div>

              <FrameFeedFilters
                filters={frameFilters}
                onFiltersChange={setFrameFilters}
              />

              <FrameFeedExport
                filteredFrames={filteredFrameRows}
                filters={frameFilters}
              />

              {/* Mobile/Tablet Card Layout */}
              <div className="space-y-4 md:hidden">
                {filteredFrameRows.map((row) => (
                  <FrameDataCard
                    key={row.frameNumber}
                    frameNumber={row.frameNumber}
                    requests={row.requests}
                    prover={row.prover}
                    selector={row.selector}
                    timestamp={row.timestamp}
                    onNavigate={() => navigate(`/frames/${row.frameNumber}`)}
                  />
                ))}
              </div>
              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <div className="max-h-[520px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
                    <thead className="sticky top-0 z-10 bg-surface label-text">
                      <tr>
                        <th className="py-3 pr-6">Frame</th>
                        <th className="py-3 pr-6">Requests</th>
                        <th className="py-3 pr-6">Prover</th>
                        <th className="py-3 pr-6">Selector</th>
                        <th className="py-3 pr-6">Timestamp</th>
                        <th className="py-3 pr-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {filteredFrameRows.map((row) => (
                        <FrameDataRow
                          key={row.frameNumber}
                          frameNumber={row.frameNumber}
                          requests={row.requests}
                          prover={row.prover}
                          selector={row.selector}
                          timestamp={row.timestamp}
                          onNavigate={() => navigate(`/frames/${row.frameNumber}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
{/*
          <section className="mt-14 space-y-6">
            <h2 className="text-3xl font-semibold text-primary">Recent frames</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {frameFeed.slice(0, 4).map((frame) => (
                <div
                  key={frame.header.frameNumber}
                  className="flex flex-col gap-5 rounded-3xl border border-subtle bg-surface p-6 shadow-xl backdrop-blur"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Tag label={`Frame ${frame.header.frameNumber.toLocaleString()}`} />
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                      <div className="label-text">
                        Prover
                      </div>
                      <div className="text-base font-semibold font-mono">{formatBase64Bytes(frame.header.prover)}</div>
                    </div>
                    <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                      <div className="label-text">
                        Selector
                      </div>
                      <div className="text-base font-semibold font-mono">{formatBase64Bytes(frame.header.parentSelector)}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-subtle bg-light-grey px-4 py-3 text-sm text-burgundy/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-surface-raised/60 dark:text-white/80">
                    <div className="label-text">
                      Requests recorded
                    </div>
                    <div className="font-mono text-sm sm:text-xs">{frame.requests.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </section> */}

          <section id="peer-directory" className="section-glow-c mt-14 relative overflow-hidden rounded-3xl border border-subtle bg-surface p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-label text-primary">
                    Peer directory
                  </h2>
                  <div className="text-sm sm:text-xs font-semibold uppercase tracking-label text-secondary">
                    {formattedPeerCount} peers
                  </div>
                  <CopyFilterLinkButton filters={filters} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    to="/peers"
                    className="text-sm sm:text-xs action-text"
                  >
                    View Peers →
                  </Link>
                </div>
              </div>

              <PeerDirectoryFilters
                filters={filters}
                onFiltersChange={setFilters}
                uniqueVersions={uniqueVersions}
                versionCounts={versionCounts}
                uniqueCapabilityCounts={uniqueCapabilityCounts}
                capabilityCountCounts={capabilityCountCounts}
                pubsubProtocolCounts={pubsubProtocolCounts}
                streamProtocolCounts={streamProtocolCounts}
              />

              <PeerDirectoryExport
                filteredPeers={filteredPeerRows}
                allPeerRecords={peers}
                filters={filters}
              />

              <PeerDirectory peers={filteredPeerRows} />
            </div>
          </section>

          <section id="prover-shards" className="section-glow-a mt-14 relative overflow-hidden rounded-3xl border border-subtle bg-surface p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-label text-primary">
                  Shard coverage
                </h2>
                <div className="text-sm sm:text-xs font-semibold uppercase tracking-label text-secondary">
                  {shardRows.length.toLocaleString()}/4096 Shards
                </div>
              </div>
              {shardRows.length > 0 && (
                <div className="flex flex-wrap gap-4 text-sm text-secondary">
                  <div>
                    Halt risk (&lt; 3 active):
                    <span className="ml-1 font-semibold text-danger">{shardCoverageStats.risk.toLocaleString()}</span>
                  </div>
                  <div>
                    Needs coverage (&lt; 6 active):
                    <span className="ml-1 font-semibold text-warning">{shardCoverageStats.warn.toLocaleString()}</span>
                  </div>
                  <div>
                    Healthy (≥ 6 active):
                    <span className="ml-1 font-semibold text-success">
                      {(shardRows.length - shardCoverageStats.risk - shardCoverageStats.warn).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {shardRows.length === 0 ? (
                <p className="text-sm text-secondary">
                  No shard filters reported yet.
                </p>
              ) : (
                <>
                  <div className="space-y-4 md:hidden">
                    {shardRows.map((summary) => (
                      <ShardSummaryCard key={summary.filter} summary={summary} />
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <div className="max-h-[420px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
                        <thead className="sticky top-0 z-10 bg-surface label-text">
                          <tr>
                            <th className="py-3 px-4">Filter</th>
                            <th className="py-3 px-4">Active</th>
                            {SHARD_STATUS_COLUMNS.filter((status) => status !== "active").map((status) => (
                              <th key={status} className="py-3 px-4">{status}</th>
                            ))}
                            <th className="py-3 px-4">Other</th>
                            <th className="py-3 px-4">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle">
                          {shardRows.map((summary) => {
                            const activeCount = getShardStatusCount(summary, "active");
                            const joiningCount = getShardStatusCount(summary, "joining");
                            const tone = getCoverageToneForActive(activeCount);
                            const statusCounts = SHARD_STATUS_COLUMNS.filter((status) => status !== "active").map((status) => ({
                              status,
                              value: getShardStatusCount(summary, status),
                            }));
                            const totalStatusCount = activeCount + statusCounts.reduce((sum, entry) => sum + entry.value, 0);
                            const total = getShardTotal(summary);
                            if (joiningCount < 3 && total - joiningCount <= 0) {
                              return null;
                            }
                            const otherCount = Math.max(0, total - totalStatusCount);
                            const rowToneClasses = {
                              risk: "bg-danger-subtle",
                              warn: "bg-warning-subtle",
                              safe: "",
                            } as const;
                            const rowClass = rowToneClasses[tone] ?? "";

                            return (
                              <tr
                                key={summary.filter}
                                className={`${rowClass} cursor-pointer hover:bg-hover-highlight`}
                                onClick={() => navigate(`/provers/shards/${summary.filter}`)}
                              >
                                <td className="py-3 px-4 font-mono text-sm sm:text-xs break-all align-top">
                                  <HoverableCopyText text={summary.filter}>{truncateFilter(summary.filter)}</HoverableCopyText>
                                </td>
                                <td className="py-3 px-4 text-sm sm:text-xs align-top font-semibold">{activeCount.toLocaleString()}</td>
                                {statusCounts.map(({ status, value }) => (
                                  <td key={status} className="py-3 px-4 text-sm sm:text-xs align-top">{value.toLocaleString()}</td>
                                ))}
                                <td className="py-3 px-4 text-sm sm:text-xs align-top">{otherCount.toLocaleString()}</td>
                                <td className="py-3 px-4 text-sm sm:text-xs align-top font-semibold">{total.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section id="consensus-gossip" className="section-glow-b mt-14 relative overflow-hidden rounded-3xl border border-subtle bg-surface p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
            <div className="relative space-y-6">
              <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-label text-primary">
                Consensus gossip
              </h2>
              <div className="space-y-4">
                {messages.map((message) => {
                  const isExpanded = expandedMessages.has(message.seqno);
                  return (
                    <CollapsibleMessage
                      key={message.seqno}
                      message={message}
                      isExpanded={isExpanded}
                      onToggle={() => {
                        setExpandedMessages((prev) => {
                          const next = new Set(prev);
                          if (isExpanded) {
                            next.delete(message.seqno);
                          } else {
                            next.add(message.seqno);
                          }
                          return next;
                        });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        </div>
    </PageLayout>
  );
}
