import { useEffect, useMemo, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import {
  CertifiedProposal,
  GlobalFrame,
  GossipMessage,
  HypergraphRecord,
  PeerRecord,
  explorerApi,
} from "@/lib/api";
import {
  base64ToHex,
  formatBase64Bytes,
  formatTimestamp,
  formatRelative,
  coerceTimestamp,
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
import { PeerDirectoryFilters, type PeerFilterState } from "@/components/PeerDirectoryFilters";
import { PeerDirectory } from "@/components/PeerDirectory";
import { PeerDirectoryExport } from "@/components/PeerDirectoryExport";
import { FrameFeedFilters, type FrameFilterState } from "@/components/FrameFeedFilters";
import { FrameFeedExport } from "@/components/FrameFeedExport";

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-burgundy/20 bg-light-grey px-4 py-1.5 text-sm md:px-3 md:py-1 md:text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 dark:border-white/15 dark:bg-[#261732] dark:text-white/70">
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
      className={`inline-flex items-center gap-1.5 ml-2 px-2 py-1 rounded transition-colors hover:bg-burgundy/10 dark:hover:bg-white/10 ${showText ? '' : 'border border-burgundy/20 dark:border-white/20'} ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <span className="text-xs text-green dark:text-light-green">Copied</span>
      ) : (
        <>
          {showText && <span className="text-xs text-burgundy/70 dark:text-white/70">Copy to Clipboard</span>}
          <Icon name="emptyclipboard" className="w-4 h-4 text-burgundy/60 dark:text-white/60" />
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
      className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-sm text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white cursor-pointer transition hover:bg-light-grey/60 dark:hover:bg-white/5"
    >
      <div className="mb-3 font-semibold text-base text-burgundy dark:text-white">
        Frame #{frameNumber.toLocaleString()}
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <span className="text-burgundy/60 dark:text-white/60">Prover: </span>
          <span className="font-mono break-all">
            <HoverableCopyText text={base64ToHex(prover) ?? prover}>
              {formatBase64Bytes(prover)}
            </HoverableCopyText>
          </span>
        </div>
        <div>
          <span className="text-burgundy/60 dark:text-white/60">Selector: </span>
          <span className="font-mono break-all">
            <HoverableCopyText text={base64ToHex(selector) ?? selector}>
              {formatBase64Bytes(selector)}
            </HoverableCopyText>
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-burgundy/60 dark:text-white/60">Requests: </span>
            <span>{requests}</span>
          </div>
          <div className="text-burgundy/60 dark:text-white/60 text-right">
            {formatTimestamp(timestamp)}
          </div>
        </div>
        <div className="pt-3 border-t border-burgundy/10 dark:border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="flex items-center gap-2 text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
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
      className="text-sm cursor-pointer transition hover:bg-light-grey/60 dark:hover:bg-white/5"
      onClick={onNavigate}
    >
      <td className="py-4 pr-6 font-semibold text-burgundy dark:text-white">
        #{frameNumber.toLocaleString()}
      </td>
      <td className="py-4 pr-6">{requests}</td>
      <td className="py-4 pr-6 font-mono">
        <HoverableCopyText text={base64ToHex(prover) ?? prover}>
          {formatBase64Bytes(prover)}
        </HoverableCopyText>
      </td>
      <td className="py-4 pr-6 font-mono">
        <HoverableCopyText text={base64ToHex(selector) ?? selector}>
          {formatBase64Bytes(selector)}
        </HoverableCopyText>
      </td>
      <td className="py-4 pr-6">{formatTimestamp(timestamp)}</td>
      <td className="py-4 pr-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
        >
          <span>View frame details</span>
          <Arrow className="w-4 h-4" />
        </button>
      </td>
    </tr>
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
    <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-sm text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
        {formatTimestamp(message.timestamp)}
      </div>
      <div className="mt-1 font-mono text-xs text-burgundy/70 dark:text-white/70 break-words">
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
        className="mt-2 font-mono text-xs text-burgundy dark:text-white break-all whitespace-pre-wrap absolute left-[-9999px] top-[-9999px]"
        aria-hidden="true"
      >
        {message.data}
      </div>
      <div className="relative mt-2">
        <div className="flex items-start justify-between mb-1">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">Data</div>
          <CopyButton text={message.data} showText={true} className="mb-1" />
        </div>
        <div
          ref={contentRef}
          className={`font-mono text-xs text-burgundy dark:text-white break-all whitespace-pre-wrap transition-all ${
            !isExpanded ? 'overflow-hidden' : ''
          }`}
          style={{
            maxHeight: !isExpanded && lineHeight > 0 ? `${lineHeight * 5}px` : 'none',
          }}
        >
          {message.data}
        </div>
        {!isExpanded && hasOverflow && (
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#211430]" />
        )}
      </div>
      {hasOverflow && (
        <button
          onClick={onToggle}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          <ChevronDown
            className={`size-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}

export default function Explorer() {
  const navigate = useNavigate();
  const [latestFrame, setLatestFrame] = useState<GlobalFrame | null>(null);
  const [frameFeed, setFrameFeed] = useState<GlobalFrame[]>([]);
  const [certified, setCertified] = useState<CertifiedProposal | null>(null);
  const [messages, setMessages] = useState<GossipMessage[]>([]);
  const [peers, setPeers] = useState<PeerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [frameCount, setFrameCount] = useState<number>(10); // Add this line

  const [frameQuery, setFrameQuery] = useState("");
  const [frameLookup, setFrameLookup] = useState<FrameSearchState>({});

  const [certifiedQuery, setCertifiedQuery] = useState("");
  const [certifiedLookup, setCertifiedLookup] = useState<CertifiedSearchState>({});

  const [hypergraphQuery, setHypergraphQuery] = useState("");
  const [hypergraphLookup, setHypergraphLookup] = useState<HypergraphSearchState>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [frame, proposal, gossip, peerList] = await Promise.all([
          explorerApi.getLatestFrame(),
          explorerApi.getLatestCertified().catch(() => null),
          explorerApi.getMessages(20).catch(() => []),
          explorerApi.getPeers().catch(() => []),
        ]);
        if (!mounted) {
          return;
        }
        setLatestFrame(frame);
        setCertified(proposal);
        setMessages(gossip);
        setPeers(peerList);
        await hydrateFrameFeed(frame, frameCount); // Update this line
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

    async function hydrateFrameFeed(baseFrame: GlobalFrame, count: number) { // Update this line
      const latestNumber = baseFrame.header.frameNumber;
      const counts = Array.from({ length: count }, (_, idx) => latestNumber - idx).filter((n) => n > 0); // Update this line
      const frames: GlobalFrame[] = [];
      for (const num of counts) {
        try {
          if (num === latestNumber) {
            frames.push(baseFrame);
          } else {
            const f = await explorerApi.getFrame(num);
            frames.push(f);
          }
        } catch (err) {
          console.warn("Failed to load frame", num, err);
        }
      }
      setFrameFeed(frames);
    }

    load();
    const interval = window.setInterval(load, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [frameCount]); // Add frameCount to dependencies

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

  // Frame filter state
  const [frameFilters, setFrameFilters] = useState<FrameFilterState>({
    searchQuery: "",
    minFrameNumber: "",
    maxFrameNumber: "",
    minRequests: "",
    maxRequests: "",
  });

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

  // Filter state
  const [filters, setFilters] = useState<PeerFilterState>({
    searchQuery: "",
    selectedVersions: new Set(),
    selectedPubsubProtocols: new Set<"tcp" | "udp" | "other">(),
    selectedStreamProtocols: new Set<"tcp" | "udp" | "other">(),
    selectedCapabilityCounts: new Set(),
  });

  // Filter peers excluding version, capability count, and protocol filters (for count calculations)
  const peersForVersionCounts = useMemo(() => {
    return peerRows.filter((peer) => {
      // Search filter
      if (!matchesSearch(peer, filters.searchQuery)) {
        return false;
      }

      return true;
    });
  }, [peerRows, filters.searchQuery]);

  // Extract unique versions from filtered peers (excluding version filter)
  const uniqueVersions = useMemo(() => {
    const versions = new Set<string>();
    peersForVersionCounts.forEach((peer) => {
      versions.add(peer.version);
    });
    return Array.from(versions).sort(compareVersions);
  }, [peersForVersionCounts]);

  // Count peers per version (based on filtered peers, excluding version filter)
  const versionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    peersForVersionCounts.forEach((peer) => {
      counts.set(peer.version, (counts.get(peer.version) || 0) + 1);
    });
    return counts;
  }, [peersForVersionCounts]);

  // Extract unique capability counts from filtered peers (excluding capability count filter)
  const uniqueCapabilityCounts = useMemo(() => {
    const counts = new Set<number>();
    peersForVersionCounts.forEach((peer) => {
      counts.add(peer.capabilityCount);
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [peersForVersionCounts]);

  // Count peers per capability count (based on filtered peers, excluding capability count filter)
  const capabilityCountCounts = useMemo(() => {
    const counts = new Map<number, number>();
    peersForVersionCounts.forEach((peer) => {
      counts.set(peer.capabilityCount, (counts.get(peer.capabilityCount) || 0) + 1);
    });
    return counts;
  }, [peersForVersionCounts]);

  // Count peers per pubsub protocol (based on filtered peers, excluding protocol filters)
  const pubsubProtocolCounts = useMemo(() => {
    const counts = new Map<"tcp" | "udp" | "other", number>();
    peersForVersionCounts.forEach((peer) => {
      const protocols = getProtocolsFromAddresses(peer.pubsub);
      protocols.forEach((protocol) => {
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
      });
    });
    return counts;
  }, [peersForVersionCounts]);

  // Count peers per stream protocol (based on filtered peers, excluding protocol filters)
  const streamProtocolCounts = useMemo(() => {
    const counts = new Map<"tcp" | "udp" | "other", number>();
    peersForVersionCounts.forEach((peer) => {
      const protocols = getProtocolsFromAddresses(peer.stream);
      protocols.forEach((protocol) => {
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
      });
    });
    return counts;
  }, [peersForVersionCounts]);

  // Filter peers based on search, version, and protocol
  const filteredPeerRows = useMemo(() => {
    return peerRows.filter((peer) => {
      // Search filter
      if (!matchesSearch(peer, filters.searchQuery)) {
        return false;
      }

      // Version filter
      if (filters.selectedVersions.size > 0 && !filters.selectedVersions.has(peer.version)) {
        return false;
      }

      // Pubsub protocol filter
      if (filters.selectedPubsubProtocols.size > 0) {
        if (peer.pubsub.length === 0) {
          // If filtering for pubsub protocol but peer has no pubsub addresses, exclude it
          return false;
        }
        const pubsubProtocols = getProtocolsFromAddresses(peer.pubsub);
        const hasSelectedProtocol = Array.from(filters.selectedPubsubProtocols).some((protocol) =>
          pubsubProtocols.has(protocol)
        );
        if (!hasSelectedProtocol) {
          return false;
        }
      }

      // Stream protocol filter
      if (filters.selectedStreamProtocols.size > 0) {
        if (peer.stream.length === 0) {
          // If filtering for stream protocol but peer has no stream addresses, exclude it
          return false;
        }
        const streamProtocols = getProtocolsFromAddresses(peer.stream);
        const hasSelectedProtocol = Array.from(filters.selectedStreamProtocols).some((protocol) =>
          streamProtocols.has(protocol)
        );
        if (!hasSelectedProtocol) {
          return false;
        }
      }

      // Capability count filter
      if (filters.selectedCapabilityCounts.size > 0 && !filters.selectedCapabilityCounts.has(peer.capabilityCount)) {
        return false;
      }

      return true;
    });
  }, [peerRows, filters]);

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
    <>
      <Helmet>
        <title>Quilibrium Explorer</title>
      </Helmet>

      <div className="relative min-h-screen bg-beige pb-24 pt-16 dark:bg-[#100418]">
        <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
        <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40 overflow-hidden" />
        <div className="pointer-events-none absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />

        <div className="relative mx-auto max-w-6xl px-6">
          <section className="relative overflow-hidden rounded-3xl border border-burgundy/10 bg-white/95 p-10 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white dark:shadow-[0_40px_90px_-55px_rgba(8,4,20,0.7)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl dark:bg-pink/30" />
            <div className="pointer-events-none absolute left-6 top-8 h-24 w-24 rounded-full bg-light-purple/80 blur-2xl dark:bg-purple/40" />

            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-[0.35em] text-burgundy dark:text-white">
                    Global frame
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-burgundy/70 dark:text-white/70">
                    Rank #{latestHeader?.rank.toLocaleString() ?? "–"}
                  </span>
                </div>
                <div className="text-sm text-burgundy/70 dark:text-white/70">
                  {loading ? (
                    "Refreshing explorer data…"
                  ) : latestHeader?.timestamp ? (
                    <span className="text-[0.7rem] tracking-[0.2em] text-burgundy/60 dark:text-white/60">
                      {formatTimestamp(latestHeader.timestamp)} ({formatRelative(latestHeader.timestamp)})
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Add this new section */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_26px_70px_-55px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Frame Number</div>
                  <div className="mt-2 text-3xl font-semibold text-burgundy dark:text-white">
                    {latestHeader?.frameNumber?.toLocaleString() ?? "–"}
                  </div>
                  <div className="text-sm text-burgundy/70 dark:text-white/70">
                    Difficulty {latestHeader?.difficulty ?? "–"}
                  </div>
                </div>
                <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_26px_70px_-55px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Prover</div>
                  {latestHeader?.prover && (
                    <div className="mt-2 text-2xl font-semibold text-burgundy dark:text-white font-mono">
                      <HoverableCopyText text={base64ToHex(latestHeader.prover) ?? latestHeader.prover}>
                        {formatBase64Bytes(latestHeader.prover)}
                      </HoverableCopyText>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_26px_70px_-55px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Peers</div>
                  <div className="mt-2 text-3xl font-semibold text-burgundy dark:text-white">
                    {formattedPeerCount}
                  </div>
                  <div className="text-sm text-burgundy/70 dark:text-white/70">
                    Active nodes reporting reachability
                  </div>
                </div>
              </div>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">Requests root</div>
                  {latestHeader?.requestsRoot && (
                    <div className="text-lg font-semibold font-mono">
                      <HoverableCopyText text={base64ToHex(latestHeader.requestsRoot) ?? latestHeader.requestsRoot}>
                        {formatBase64Bytes(latestHeader.requestsRoot)}
                      </HoverableCopyText>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">Parent selector</div>
                  {latestHeader?.parentSelector && (
                    <div className="text-lg font-semibold font-mono">
                      <HoverableCopyText text={base64ToHex(latestHeader.parentSelector) ?? latestHeader.parentSelector}>
                        {formatBase64Bytes(latestHeader.parentSelector)}
                      </HoverableCopyText>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 relative overflow-hidden rounded-3xl border border-burgundy/10 bg-white/95 p-10 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white dark:shadow-[0_40px_90px_-55px_rgba(8,4,20,0.7)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl dark:bg-pink/30" />
            <div className="pointer-events-none absolute left-6 top-8 h-24 w-24 rounded-full bg-light-purple/80 blur-2xl dark:bg-purple/40" />

            <div className="relative space-y-6">
              <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-[0.35em] text-burgundy dark:text-white">
                Frame feed
              </h2>

              {/* Add this new section */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                  Showing statistics from the last
                </span>
                <select
                  value={frameCount}
                  onChange={(e) => setFrameCount(Number(e.target.value))}
                  className="border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                  frames
                </span>
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
                  <table className="min-w-full divide-y divide-burgundy/10 text-left text-sm text-burgundy dark:divide-white/10 dark:text-white">
                    <thead className="sticky top-0 z-10 bg-white/95 dark:bg-[#1a0f27]/95 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                      <tr>
                        <th className="py-3 pr-6">Frame</th>
                        <th className="py-3 pr-6">Requests</th>
                        <th className="py-3 pr-6">Prover</th>
                        <th className="py-3 pr-6">Selector</th>
                        <th className="py-3 pr-6">Timestamp</th>
                        <th className="py-3 pr-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-burgundy/10 dark:divide-white/10">
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
            <h2 className="text-3xl font-semibold text-burgundy dark:text-white">Recent frames</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {frameFeed.slice(0, 4).map((frame) => (
                <div
                  key={frame.header.frameNumber}
                  className="flex flex-col gap-5 rounded-3xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_34px_80px_-55px_rgba(57,31,91,0.4)] backdrop-blur dark:border-white/10 dark:bg-[#1a0f27]/95 dark:shadow-[0_40px_90px_-55px_rgba(0,0,0,0.65)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Tag label={`Frame ${frame.header.frameNumber.toLocaleString()}`} />
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-3 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">
                        Prover
                      </div>
                      <div className="text-base font-semibold font-mono">{formatBase64Bytes(frame.header.prover)}</div>
                    </div>
                    <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-3 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">
                        Selector
                      </div>
                      <div className="text-base font-semibold font-mono">{formatBase64Bytes(frame.header.parentSelector)}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-burgundy/10 bg-light-grey px-4 py-3 text-sm text-burgundy/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[#211430]/60 dark:text-white/80">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                      Requests recorded
                    </div>
                    <div className="font-mono text-xs">{frame.requests.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </section> */}

          <section className="mt-14 relative overflow-hidden rounded-3xl border border-burgundy/10 bg-white/95 p-10 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white dark:shadow-[0_40px_90px_-55px_rgba(8,4,20,0.7)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl dark:bg-pink/30" />
            <div className="pointer-events-none absolute left-6 top-8 h-24 w-24 rounded-full bg-light-purple/80 blur-2xl dark:bg-purple/40" />

            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-[0.35em] text-burgundy dark:text-white">
                  Peer directory
                </h2>
                <div className="text-xs font-semibold uppercase tracking-[0.35em] text-burgundy/70 dark:text-white/70">
                  {formattedPeerCount} peers
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

          <section className="mt-14 relative overflow-hidden rounded-3xl border border-burgundy/10 bg-white/95 p-10 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white dark:shadow-[0_40px_90px_-55px_rgba(8,4,20,0.7)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl dark:bg-pink/30" />
            <div className="pointer-events-none absolute left-6 top-8 h-24 w-24 rounded-full bg-light-purple/80 blur-2xl dark:bg-purple/40" />

            <div className="relative space-y-6">
              <h2 className="text-lg md:text-3xl font-semibold uppercase tracking-[0.35em] text-burgundy dark:text-white">
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
      </div>
    </>
  );
}

