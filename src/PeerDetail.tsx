import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";

import { PeerRecord, explorerApi, base58ToHex, KeyRegistry } from "@/lib/api";
import { formatTimestamp, formatRelative, formatRelativeTime } from "@/lib/format";
import { formatPeerVersion } from "@/lib/peers";
import { getCapabilityLabel, formatCapability, getAllCapabilityIdentifiers } from "@/lib/capabilities";
import Spinner from "@/components/ui/Spinner";
import Icon from "@/components/ui/Icons";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import { usePeerFavorites } from "@/components/helpers/PeerFavoritesContext";

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
    <div className="rounded-2xl border border-default bg-surface-raised px-4 py-4 text-burgundy dark:text-white">
      <div className="label-text">{label}</div>
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
      className="flex items-center gap-2 px-2 py-1 text-sm action-text bg-transparent hover:bg-transparent"
    >
      <span>{copied ? 'Copied!' : 'Copy data'}</span>
    </button>
  );
}

function CopyKeyRegistryButton({ keyRegistry }: { keyRegistry: KeyRegistry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const registryData = JSON.stringify(keyRegistry, null, 2);
      await navigator.clipboard.writeText(registryData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-2 py-1 text-sm action-text bg-transparent hover:bg-transparent"
    >
      <span>{copied ? 'Copied!' : 'Copy data'}</span>
    </button>
  );
}

function LastSeenCard({ label, relativeTime, timestamp }: { label: string; relativeTime: string; timestamp: string | null }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="rounded-2xl border border-default bg-surface-raised px-4 py-4 text-burgundy dark:text-white">
      <div className="label-text">{label}</div>
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
              className="w-4 h-4 text-muted cursor-help"
            />
            {isHovered && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-sm sm:text-xs text-white bg-burgundy dark:bg-surface-raised rounded whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {formatTimestamp(timestamp)}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-burgundy dark:border-t-surface-raised" />
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
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm sm:text-xs font-medium transition-all ${
          hasCapability
            ? 'border-strong bg-brand-subtle text-primary'
            : 'border-subtle bg-transparent text-faint opacity-50'
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm sm:text-xs text-white bg-burgundy dark:bg-surface-raised rounded whitespace-pre-line pointer-events-none z-50 shadow-lg max-w-xs">
          {tooltipText}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-burgundy dark:border-t-surface-raised" />
        </div>
      )}
    </div>
  );
}

export default function PeerDetail() {
  const { peerId } = useParams<{ peerId: string }>();
  const navigate = useNavigate();
  const [peer, setPeer] = useState<PeerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyRegistry, setKeyRegistry] = useState<KeyRegistry | null>(null);
  const [keyRegistryLoading, setKeyRegistryLoading] = useState(false);
  const [keyRegistryError, setKeyRegistryError] = useState<string | null>(null);
  const { isFavorite, addFavorite, removeFavorite } = usePeerFavorites();

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

  useEffect(() => {
    let mounted = true;
    async function loadKeyRegistry() {
      if (!peer?.peer_id) {
        return;
      }
      setKeyRegistryLoading(true);
      setKeyRegistryError(null);
      try {
        const hexIdentity = await base58ToHex(peer.peer_id);
        const registry = await explorerApi.getKeyRegistry(hexIdentity);
        if (mounted) {
          setKeyRegistry(registry);
        }
      } catch (err) {
        if (mounted) {
          setKeyRegistryError(err instanceof Error ? err.message : "Failed to load key registry");
        }
      } finally {
        if (mounted) {
          setKeyRegistryLoading(false);
        }
      }
    }
    loadKeyRegistry();
    return () => {
      mounted = false;
    };
  }, [peer?.peer_id]);

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
    <PageLayout title={`Peer ${peer?.peer_id.slice(0, 16)}… • Quilibrium Explorer`}>
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm action-text bg-transparent hover:bg-transparent"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4">
            {peer && (
              <>
                <button
                  onClick={() => {
                    if (isFavorite(peer.peer_id)) {
                      removeFavorite(peer.peer_id);
                    } else {
                      addFavorite(peer.peer_id);
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 text-secondary hover:text-primary transition-colors"
                  aria-label={isFavorite(peer.peer_id) ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite(peer.peer_id) ? (
                    <Icon name="starfilled" className="w-5 h-5 text-orange" />
                  ) : (
                    <Icon name="staroutline" className="w-5 h-5" />
                  )}
                </button>
                <CopyPeerDataButton peer={peer} />
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
            {error}
          </div>
        )}

        {peer && (
          <>
            <section className="section-glow-a mt-6 rounded-3xl border border-subtle bg-surface p-8 text-burgundy shadow-xl dark:text-white">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-mono font-semibold break-all text-primary">
                  <HoverableCopyText text={peer.peer_id}>
                    {peer.peer_id}
                  </HoverableCopyText>
                </h1>
                {lastSeenTimestamp && (
                  <div className="mt-1 text-sm sm:text-xs uppercase tracking-label text-muted">
                    {formatTimestamp(lastSeenTimestamp)} {formatRelative(lastSeenTimestamp) && `(${formatRelative(lastSeenTimestamp)})`}
                  </div>
                )}
                <h2 className="mt-3 text-lg font-semibold text-secondary">Peer Details</h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-subtle bg-white/90 p-5 dark:bg-surface-raised">
                  <div className="label-text">Version</div>
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

            <section className="section-glow-b mt-10 rounded-3xl border border-subtle bg-surface p-8 shadow-xl">
              <h2 className="text-2xl font-semibold text-primary">
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
              <section className="section-glow-c mt-10 rounded-3xl border border-subtle bg-surface p-8 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-primary">Reachability</h2>
                  <div className="text-sm text-muted">
                    {peer.reachability.length} reachability record{peer.reachability.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  {peer.reachability.map((reach, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised"
                    >
                      <div className="label-text">
                        Record {index + 1}
                      </div>
                      <div className="mt-4 grid gap-4">
                        <div>
                          <div className="label-text mb-2">
                            Filter
                          </div>
                          <div className="font-mono text-sm sm:text-xs md:text-sm break-all md:break-normal md:truncate text-primary">
                            <HoverableCopyText text={reach.filter}>
                              {reach.filter}
                            </HoverableCopyText>
                          </div>
                        </div>
                        <div>
                          <div className="label-text mb-2">
                            Pubsub Multiaddrs ({reach.pubsub_multiaddrs?.length ?? 0})
                          </div>
                          {reach.pubsub_multiaddrs && reach.pubsub_multiaddrs.length > 0 ? (
                            <div className="space-y-2">
                              {reach.pubsub_multiaddrs.map((addr, addrIndex) => (
                                <div key={addrIndex} className="font-mono text-sm sm:text-xs md:text-sm break-all md:break-normal md:truncate text-primary">
                                  <HoverableCopyText text={addr}>
                                    {addr}
                                  </HoverableCopyText>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted">–</div>
                          )}
                        </div>
                        <div>
                          <div className="label-text mb-2">
                            Stream Multiaddrs ({reach.stream_multiaddrs?.length ?? 0})
                          </div>
                          {reach.stream_multiaddrs && reach.stream_multiaddrs.length > 0 ? (
                            <div className="space-y-2">
                              {reach.stream_multiaddrs.map((addr, addrIndex) => (
                                <div key={addrIndex} className="font-mono text-sm sm:text-xs md:text-sm break-all md:break-normal md:truncate text-primary">
                                  <HoverableCopyText text={addr}>
                                    {addr}
                                  </HoverableCopyText>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted">–</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="section-glow-a mt-10 rounded-3xl border border-subtle bg-surface p-8 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-primary">Key Registry</h2>
                {keyRegistry && (
                  <CopyKeyRegistryButton keyRegistry={keyRegistry} />
                )}
              </div>
              {keyRegistryLoading && (
                <div className="mt-6 flex items-center justify-center py-8">
                  <Spinner size="40" />
                </div>
              )}
              {keyRegistryError && (
                <div className="mt-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
                  {keyRegistryError}
                </div>
              )}
              {keyRegistry && !keyRegistryLoading && (
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised">
                    <div className="label-text mb-4">
                      Identity Key
                    </div>
                    <div className="font-mono text-sm sm:text-xs md:text-sm break-all text-primary">
                      <HoverableCopyText text={keyRegistry.identityKey.keyValue}>
                        {keyRegistry.identityKey.keyValue}
                      </HoverableCopyText>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised">
                    <div className="label-text mb-4">
                      Prover Key
                    </div>
                    <div className="font-mono text-sm sm:text-xs md:text-sm break-all text-primary">
                      <HoverableCopyText text={keyRegistry.proverKey.keyValue}>
                        {keyRegistry.proverKey.keyValue}
                      </HoverableCopyText>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised">
                      <div className="label-text mb-4">
                        Identity to Prover Signature
                      </div>
                      <div className="font-mono text-sm sm:text-xs md:text-sm break-all text-primary">
                        <HoverableCopyText text={keyRegistry.identityToProver.signature}>
                          {keyRegistry.identityToProver.signature}
                        </HoverableCopyText>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised">
                      <div className="label-text mb-4">
                        Prover to Identity Signature
                      </div>
                      <div className="font-mono text-sm sm:text-xs md:text-sm break-all text-primary">
                        <HoverableCopyText text={keyRegistry.proverToIdentity.signature}>
                          {keyRegistry.proverToIdentity.signature}
                        </HoverableCopyText>
                      </div>
                    </div>
                  </div>

                  {Object.keys(keyRegistry.keysByPurpose).length > 0 && (
                    <div className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised">
                      <div className="label-text mb-4">
                        Keys by Purpose ({Object.keys(keyRegistry.keysByPurpose).length})
                      </div>
                      <div className="space-y-4">
                        {Object.entries(keyRegistry.keysByPurpose).map(([purpose, keys]) => (
                          <div key={purpose} className="border-t border-subtle pt-4 first:border-t-0 first:pt-0">
                            <div className="label-text mb-3">
                              Purpose: {purpose || "(empty)"}
                            </div>
                            {keys.x448Keys.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm sm:text-xs font-semibold text-secondary mb-2">
                                  X448 Keys ({keys.x448Keys.length})
                                </div>
                                <div className="space-y-2">
                                  {keys.x448Keys.map((key, idx) => (
                                    <div key={idx} className="pl-4 border-l-2 border-default">
                                      <div className="text-xs font-semibold uppercase tracking-label text-muted mb-1">
                                        Key Value
                                      </div>
                                      <div className="font-mono text-sm sm:text-xs break-all text-primary mb-2">
                                        <HoverableCopyText text={key.key.keyValue}>
                                          {key.key.keyValue}
                                        </HoverableCopyText>
                                      </div>
                                      <div className="text-xs font-semibold uppercase tracking-label text-muted mb-1">
                                        Parent Key Address
                                      </div>
                                      <div className="font-mono text-sm sm:text-xs break-all text-primary mb-2">
                                        <HoverableCopyText text={key.parentKeyAddress}>
                                          {key.parentKeyAddress}
                                        </HoverableCopyText>
                                      </div>
                                      <div className="text-xs font-semibold uppercase tracking-label text-muted mb-1">
                                        Signature
                                      </div>
                                      <div className="font-mono text-sm sm:text-xs break-all text-primary">
                                        <HoverableCopyText text={key.ed448Signature.signature}>
                                          {key.ed448Signature.signature}
                                        </HoverableCopyText>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {keys.decaf448Keys.length > 0 && (
                              <div>
                                <div className="text-sm sm:text-xs font-semibold text-secondary mb-2">
                                  Decaf448 Keys ({keys.decaf448Keys.length})
                                </div>
                                <div className="space-y-2">
                                  {keys.decaf448Keys.map((key, idx) => (
                                    <div key={idx} className="pl-4 border-l-2 border-default">
                                      <div className="text-xs font-semibold uppercase tracking-label text-muted mb-1">
                                        Key Value
                                      </div>
                                      <div className="font-mono text-sm sm:text-xs break-all text-primary mb-2">
                                        <HoverableCopyText text={key.key.keyValue}>
                                          {key.key.keyValue}
                                        </HoverableCopyText>
                                      </div>
                                      <div className="text-xs font-semibold uppercase tracking-label text-muted mb-1">
                                        Parent Key Address
                                      </div>
                                      <div className="font-mono text-sm sm:text-xs break-all text-primary mb-2">
                                        <HoverableCopyText text={key.parentKeyAddress}>
                                          {key.parentKeyAddress}
                                        </HoverableCopyText>
                                      </div>
                                      <div className="text-xs font-semibold uppercase tracking-label text-muted mb-1">
                                        Signature
                                      </div>
                                      <div className="font-mono text-sm sm:text-xs break-all text-primary">
                                        <HoverableCopyText text={key.ed448Signature.signature}>
                                          {key.ed448Signature.signature}
                                        </HoverableCopyText>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {keyRegistry.lastUpdated && keyRegistry.lastUpdated !== "0" && (
                    <div className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised">
                      <div className="label-text mb-2">
                        Last Updated
                      </div>
                      <div className="text-base font-semibold text-primary">
                        {formatTimestamp(keyRegistry.lastUpdated)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}

