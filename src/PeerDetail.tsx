import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

import { PeerRecord, explorerApi } from "@/lib/api";
import { formatTimestamp, formatRelative, formatRelativeTime } from "@/lib/format";
import { formatPeerVersion } from "@/lib/peers";
import { getCapabilityLabel, formatCapability, getAllCapabilityIdentifiers } from "@/lib/capabilities";
import Spinner from "@/components/ui/Spinner";
import Icon from "@/components/ui/Icons";
import { HoverableCopyText } from "@/components/HoverableCopyText";

function DetailCard({
  label,
  value,
  mono = false,
  copyValue,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  copyValue?: string;
}) {
  const displayValue = (
    <div className={`mt-2 text-base font-semibold ${mono ? "font-mono" : ""}`}>
      {copyValue ? (
        <HoverableCopyText text={copyValue}>
          {String(value)}
        </HoverableCopyText>
      ) : (
        value
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-burgundy/10 bg-light-grey px-4 py-4 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/70 dark:text-white">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">{label}</div>
      {displayValue}
    </div>
  );
}

function CopyPeerDataButton({ peer }: { peer: PeerRecord }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const peerData = JSON.stringify(peer, null, 2);
      await navigator.clipboard.writeText(peerData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-2 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-burgundy/70 hover:text-burgundy dark:text-white/70 transition-colors bg-transparent hover:bg-transparent"
    >
      <span>{copied ? 'Copied!' : 'Copy data'}</span>
    </button>
  );
}

function LastSeenCard({ label, relativeTime, timestamp }: { label: string; relativeTime: string; timestamp: string | null }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="rounded-2xl border border-burgundy/10 bg-light-grey px-4 py-4 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/70 dark:text-white">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">{label}</div>
      <div className="mt-2 text-base font-semibold flex items-center gap-2">
        <span>{relativeTime}</span>
        {timestamp && (
          <span
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Icon
              name="resetclock"
              className="w-4 h-4 text-burgundy/60 dark:text-white/60 cursor-help"
            />
            {isHovered && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {formatTimestamp(timestamp)}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function CapabilityBadge({
  label,
  protocolId,
  hasCapability,
  additionalMetadata,
}: {
  label: string;
  protocolId: number;
  hasCapability: boolean;
  additionalMetadata?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const tooltipText = `Protocol ID: ${protocolId}${additionalMetadata ? `\nMetadata: ${additionalMetadata}` : ''}`;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
          hasCapability
            ? 'border-burgundy/30 bg-burgundy/5 text-burgundy dark:border-white/30 dark:bg-white/5 dark:text-white'
            : 'border-burgundy/10 bg-transparent text-burgundy/30 dark:border-white/10 dark:text-white/20 opacity-50'
        }`}
      >
        <span>{label}</span>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
          hasCapability ? 'bg-[#008000] dark:bg-[#008000]' : 'bg-[#FF2C2C] dark:bg-[#FF2C2C]'
        }`}>
          {hasCapability ? (
            <Icon name="check" className="w-3 h-3 text-white" />
          ) : (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      </div>
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-pre-line pointer-events-none z-50 shadow-lg max-w-xs">
          {tooltipText}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
}

export default function PeerDetail() {
  const { peerId } = useParams<{ peerId: string }>();
  const [peer, setPeer] = useState<PeerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!peerId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const peers = await explorerApi.getPeers();
        if (mounted) {
          const foundPeer = peers.find((p) => p.peer_id === peerId);
          if (foundPeer) {
            setPeer(foundPeer);
          } else {
            setError("Peer not found");
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load peer");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [peerId]);

  const formattedVersion = useMemo(() => {
    if (!peer) return "–";
    return formatPeerVersion(peer);
  }, [peer]);

  const lastSeenTimestamp = useMemo(() => {
    if (!peer?.last_seen) return null;
    // last_seen is a number (Unix timestamp in seconds or milliseconds)
    // Convert to string for formatTimestamp
    const timestamp = peer.last_seen > 1e12 ? peer.last_seen : peer.last_seen * 1000;
    return new Date(timestamp).toISOString();
  }, [peer]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="40" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-beige pb-24 pt-16 dark:bg-[#100418]">
      <Helmet>
        <title>Peer {peer?.peer_id.slice(0, 16)}… • Quilibrium Explorer</title>
      </Helmet>

      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
      <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40 overflow-hidden" />
      <div className="pointer-events-none absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70">
            ← Back
          </Link>
          {lastSeenTimestamp && (
            <div className="text-xs uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
              {formatTimestamp(lastSeenTimestamp)} {formatRelative(lastSeenTimestamp) && `(${formatRelative(lastSeenTimestamp)})`}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
            {error}
          </div>
        )}

        {peer && (
          <>
            <section className="mt-6 rounded-3xl border border-burgundy/10 bg-white/95 p-8 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
              <div className="flex items-start justify-between gap-4 -mt-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-mono font-semibold break-all text-burgundy dark:text-white">
                    <HoverableCopyText text={peer.peer_id}>
                      {peer.peer_id}
                    </HoverableCopyText>
                  </h1>
                  <h2 className="mt-2 text-lg font-semibold text-burgundy/80 dark:text-white/80">Peer Details</h2>
                </div>
                <div className="-mt-2 -mr-4">
                  <CopyPeerDataButton peer={peer} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Version</div>
                  <div className="mt-2 text-2xl font-semibold">{formattedVersion}</div>
                </div>
                <LastSeenCard
                  label="Last Seen"
                  relativeTime={lastSeenTimestamp ? formatRelativeTime(lastSeenTimestamp) : "–"}
                  timestamp={lastSeenTimestamp}
                />
                <DetailCard
                  label="Capabilities"
                  value={
                    (peer.capabilities?.length ?? 0) === 0
                      ? "No capabilities found."
                      : (peer.capabilities?.length ?? 0) === 1
                      ? "1 capability"
                      : `${peer.capabilities?.length ?? 0} capabilities`
                  }
                />
              </div>
            </section>

            <section className="mt-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_34px_80px_-55px_rgba(57,31,91,0.4)] dark:border-white/10 dark:bg-[#1a0f27]/95">
              <h2 className="text-2xl font-semibold text-burgundy dark:text-white">
                Capabilities ({peer.capabilities?.length ?? 0} / {getAllCapabilityIdentifiers().length})
              </h2>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {getAllCapabilityIdentifiers().map((protocolId) => {
                  const capability = peer.capabilities?.find(c => c.protocol_identifier === protocolId);
                  const hasCapability = !!capability;
                  const label = getCapabilityLabel(protocolId);

                  return (
                    <CapabilityBadge
                      key={protocolId}
                      label={label}
                      protocolId={protocolId}
                      hasCapability={hasCapability}
                      additionalMetadata={capability?.additional_metadata}
                    />
                  );
                })}
              </div>
            </section>

            {peer.reachability && peer.reachability.length > 0 && (
              <section className="mt-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_34px_80px_-55px_rgba(57,31,91,0.4)] dark:border-white/10 dark:bg-[#1a0f27]/95">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-burgundy dark:text-white">Reachability</h2>
                  <div className="text-sm text-burgundy/60 dark:text-white/60">
                    {peer.reachability.length} reachability record{peer.reachability.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  {peer.reachability.map((reach, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95"
                    >
                      <div className="text-sm font-semibold uppercase tracking-[0.25em] text-burgundy/60 dark:text-white/60">
                        Record {index + 1}
                      </div>
                      <div className="mt-4 grid gap-4">
                        <div>
                          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                            Filter
                          </div>
                          <div className="font-mono text-sm break-all">
                            <HoverableCopyText text={reach.filter}>
                              {reach.filter}
                            </HoverableCopyText>
                          </div>
                        </div>
                        <div>
                          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                            Pubsub Multiaddrs ({reach.pubsub_multiaddrs?.length ?? 0})
                          </div>
                          {reach.pubsub_multiaddrs && reach.pubsub_multiaddrs.length > 0 ? (
                            <div className="space-y-2">
                              {reach.pubsub_multiaddrs.map((addr, addrIndex) => (
                                <div key={addrIndex} className="font-mono text-sm break-all">
                                  <HoverableCopyText text={addr}>
                                    {addr}
                                  </HoverableCopyText>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-burgundy/60 dark:text-white/60">–</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                            Stream Multiaddrs ({reach.stream_multiaddrs?.length ?? 0})
                          </div>
                          {reach.stream_multiaddrs && reach.stream_multiaddrs.length > 0 ? (
                            <div className="space-y-2">
                              {reach.stream_multiaddrs.map((addr, addrIndex) => (
                                <div key={addrIndex} className="font-mono text-sm break-all">
                                  <HoverableCopyText text={addr}>
                                    {addr}
                                  </HoverableCopyText>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-burgundy/60 dark:text-white/60">–</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

