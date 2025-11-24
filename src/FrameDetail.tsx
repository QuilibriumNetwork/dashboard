import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

import { GlobalFrame, FrameRequest, explorerApi } from "@/lib/api";
import {
  base64ToHex,
  formatBase64Bytes,
  formatTimestamp,
  formatRelative,
  convertBase64ToHex,
} from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import Icon from "@/components/ui/Icons";
import ChevronDown from "@/components/ui/ChevronDown";

function CopyFrameDataButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const frameDataElement = document.querySelector('[data-frame-info]');
      const frameData = frameDataElement?.getAttribute('data-frame-info');

      if (frameData) {
        await navigator.clipboard.writeText(frameData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-2 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-burgundy/70 hover:text-burgundy dark:text-white/70 transition-colors bg-transparent hover:bg-transparent"
    >
      <Icon name="emptyclipboard" className="w-4 h-4 flex-shrink-0" />
      <span>{copied ? 'Copied!' : 'Copy data'}</span>
    </button>
  );
}

function HoverableCopyText({ text, children }: { text: string; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
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
    <span
      className="relative inline-flex items-center gap-1.5 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCopy}
    >
      <span className={`group-hover:underline transition-colors ${copied ? 'text-green dark:text-light-green' : ''}`}>
        {children}
      </span>
      {isHovered && (
        <>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
            {copied ? 'Copied!' : 'Click to copy'}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </span>
          <Icon name="emptyclipboard" className="w-3 h-3 text-burgundy/60 dark:text-white/60 flex-shrink-0" />
        </>
      )}
    </span>
  );
}

export default function FrameDetail() {
  const { frameNumber } = useParams<{ frameNumber: string }>();
  const [frame, setFrame] = useState<GlobalFrame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!frameNumber) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const numeric = Number(frameNumber);
        if (!Number.isFinite(numeric)) {
          throw new Error("Invalid frame number");
        }
        const data = await explorerApi.getFrame(numeric);
        if (mounted) {
          setFrame(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load frame");
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
  }, [frameNumber]);

  const header = frame?.header;
  const totalRequests = useMemo(() => (
    frame?.requests?.reduce((sum, bundle) => sum + (bundle.requests?.length ?? 0), 0) ?? 0
  ), [frame]);

  const frameDataJson = useMemo(() => {
    if (!frame) return '';
    const convertedFrame = convertBase64ToHex(frame) as GlobalFrame;
    return JSON.stringify(convertedFrame, null, 2);
  }, [frame]);

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
        <title>Frame {header?.frameNumber.toLocaleString() ?? ""} • Quilibrium Explorer</title>
      </Helmet>

      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
      <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40 overflow-hidden" />
      <div className="pointer-events-none absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Hidden element with frame data for copying */}
        {frame && (
          <div
            data-frame-info={frameDataJson}
            className="hidden"
            aria-hidden="true"
          />
        )}

        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70">
            ← Back
          </Link>
          {header && (
            <div className="text-xs uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
              {formatTimestamp(header.timestamp)} {formatRelative(header.timestamp) && `(${formatRelative(header.timestamp)})`}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
            {error}
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-burgundy/10 bg-white/95 p-8 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <div className="flex items-start justify-between gap-4 -mt-2">
            <h1 className="text-3xl font-semibold">Frame #{header?.frameNumber.toLocaleString() ?? frameNumber}</h1>
            {frame && (
              <div className="-mt-2 -mr-4">
                <CopyFrameDataButton />
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Rank</div>
              <div className="mt-2 text-2xl font-semibold">{header?.rank.toLocaleString() ?? "–"}</div>
              <div className="text-sm text-burgundy/70 dark:text-white/70">Difficulty {header?.difficulty ?? "–"}</div>
            </div>
            <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 dark:border-white/10 dark:bg-[#211430]">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Prover</div>
              {header?.prover && (() => {
                const displayValue = formatBase64Bytes(header.prover);
                const copyValue = base64ToHex(header.prover);
                const finalCopyValue = displayValue.startsWith("0x") && copyValue && !copyValue.startsWith("0x")
                  ? `0x${copyValue}`
                  : copyValue;
                return (
                  <div className="mt-2 font-mono text-lg">
                    <HoverableCopyText text={finalCopyValue ?? ""}>
                      {displayValue}
                    </HoverableCopyText>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DetailCard label="Output" value={formatBase64Bytes(header?.output)} copyValue={base64ToHex(header?.output ?? "") ?? undefined} />
            <DetailCard label="Parent selector" value={formatBase64Bytes(header?.parentSelector)} copyValue={base64ToHex(header?.parentSelector ?? "") ?? undefined} />
            <DetailCard label="Requests root" value={formatBase64Bytes(header?.requestsRoot)} copyValue={base64ToHex(header?.requestsRoot ?? "") ?? undefined} />
            <DetailCard label="Prover tree commitment" value={formatBase64Bytes(header?.proverTreeCommitment)} copyValue={base64ToHex(header?.proverTreeCommitment ?? "") ?? undefined} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DetailCard label="Global commitments" value={`${header?.globalCommitments?.length ?? 0} entries`} mono={false} />
            <DetailCard label="Requests recorded" value={`${frame?.requests?.length ?? 0} bundles`} mono={false} />
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_34px_80px_-55px_rgba(57,31,91,0.4)] dark:border-white/10 dark:bg-[#1a0f27]/95">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-burgundy dark:text-white">Request breakdown</h2>
            <div className="text-sm text-burgundy/60 dark:text-white/60">
              {totalRequests} request{totalRequests === 1 ? "" : "s"}
            </div>
          </div>
          {frame?.requests && frame.requests.length > 0 ? (
            <div className="mt-6 space-y-5">
              {frame.requests.map((bundle, bundleIndex) => (
                <div key={bundleIndex} className="rounded-2xl border border-burgundy/10 bg-white/90 p-5 shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold uppercase tracking-[0.25em] text-burgundy/60 dark:text-white/60">
                      Bundle {bundleIndex + 1}
                    </div>
                    <div className="text-xs text-burgundy/60 dark:text-white/60">
                      {formatTimestamp(bundle.timestamp)}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-burgundy/70 dark:text-white/70">
                    {bundle.requests?.length ?? 0} request{(bundle.requests?.length ?? 0) === 1 ? "" : "s"}
                  </div>
                  {bundle.requests && bundle.requests.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {bundle.requests.map((req, requestIndex) => (
                        <RequestCard
                          key={`${bundleIndex}-${requestIndex}`}
                          index={requestIndex}
                          request={req}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-sm text-burgundy/60 dark:text-white/60">No requests recorded for this frame.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
  mono = true,
  copyValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
}) {
  // Format copyValue: if displayed value has 0x prefix, ensure copyValue also has it
  const finalCopyValue = copyValue
    ? (value.startsWith("0x") && !copyValue.startsWith("0x")
        ? `0x${copyValue}`
        : copyValue)
    : undefined;

  const displayValue = (
    <div className={`mt-2 text-base font-semibold ${mono ? "font-mono" : ""}`}>
      {finalCopyValue ? (
        <HoverableCopyText text={finalCopyValue}>
          {value}
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

function RequestCard({ index, request }: { index: number; request: FrameRequest }) {
  const typeKey = getRequestType(request);
  const payload = typeKey ? (request as Record<string, unknown>)[typeKey] : undefined;
  const timestamp = request.timestamp ? formatTimestamp(request.timestamp) : null;
  const displayPayload = typeof payload === "object" && payload !== null ? payload : request;

  return (
    <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-4 text-sm text-burgundy shadow-[0_18px_40px_-35px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#1f142b] dark:text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold">Request {index + 1}: {formatTypeName(typeKey)}</div>
        {timestamp && (
          <div className="text-xs text-burgundy/60 dark:text-white/60">{timestamp}</div>
        )}
      </div>
      <div className="mt-3 rounded-xl bg-[#120918] p-4 text-xs text-white/80">
        <ValueTree value={displayPayload} />
      </div>
    </div>
  );
}

function getRequestType(request: FrameRequest) {
  return Object.keys(request).find((key) => key !== "timestamp");
}

function formatTypeName(typeKey?: string) {
  if (!typeKey) return "Unknown";
  return typeKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function CollapsibleValue({
  label,
  value
}: {
  label: string;
  value: unknown;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div>
      <button
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 text-left text-[0.7rem] uppercase tracking-[0.2em] text-white/50 hover:text-white/70 transition-colors"
      >
        <ChevronDown
          className={`size-3 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span>{label}</span>
      </button>
      <div className="mt-1 border-l border-white/20 pl-3 relative">
        <div className={isExpanded ? '' : 'max-h-[4.5rem] overflow-hidden'}>
          <ValueTree value={value} />
        </div>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#120918] via-[#120918]/70 to-transparent">
            <button
              onClick={toggleExpanded}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all border border-white/20 hover:border-white/30"
            >
              <ChevronDown className="size-3 transition-transform" />
              <span>Expand</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsibleList({
  label,
  items
}: {
  label: string;
  items: unknown[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const displayItems = isExpanded ? items : items.slice(0, 3);

  return (
    <div>
      <button
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 text-left text-[0.7rem] uppercase tracking-[0.2em] text-white/50 hover:text-white/70 transition-colors"
      >
        <ChevronDown
          className={`size-3 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span>{label}</span>
      </button>
      <div className="mt-1 border-l border-white/20 pl-3 relative">
        <ol className="space-y-2">
          {displayItems.map((item, idx) => (
            <li key={idx}>
              <div className="text-[0.7rem] uppercase tracking-[0.2em] text-white/50">Item {idx + 1}</div>
              <div className="mt-1 border-l border-white/20 pl-3">
                <ValueTree value={item} parentKey={label} />
              </div>
            </li>
          ))}
        </ol>
        {!isExpanded && items.length > 3 && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#120918] via-[#120918]/70 to-transparent pointer-events-none" />
            <button
              onClick={toggleExpanded}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all border border-white/20 hover:border-white/30 z-10"
            >
              <ChevronDown className="size-3 transition-transform" />
              <span>Expand</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ValueTree({ value, parentKey }: { value: unknown; parentKey?: string }) {
  if (value == null) {
    return <div className="break-all font-mono text-white/60">–</div>;
  }
  if (typeof value === "string") {
    return <div className="break-all font-mono">{formatMaybeBytes(value)}</div>;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <div className="break-all font-mono">{String(value)}</div>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div className="break-all font-mono text-white/60">Empty array</div>;
    }
    const isFiltersArray = parentKey && (
      parentKey.toLowerCase() === "filters" ||
      parentKey.toLowerCase() === "filter"
    );

    if (isFiltersArray && value.length > 3) {
      return <CollapsibleList label={`${parentKey} (${value.length})`} items={value} />;
    }

    return (
      <ol className="space-y-2">
        {value.map((item, idx) => (
          <li key={idx}>
            <div className="text-[0.7rem] uppercase tracking-[0.2em] text-white/50">Item {idx + 1}</div>
            <div className="mt-1 border-l border-white/20 pl-3">
              <ValueTree value={item} parentKey={parentKey} />
            </div>
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) {
      return <div className="break-all font-mono text-white/60">Empty object</div>;
    }
    return (
      <dl className="space-y-2">
        {entries.map(([key, entryValue]) => {
          const formattedKey = formatTypeName(key);
          const isCollapsibleField = formattedKey === "Key Value" ||
                                     formattedKey === "Proof" ||
                                     key.toLowerCase() === "keyvalue" ||
                                     key.toLowerCase() === "key_value" ||
                                     key.toLowerCase() === "proof";

          const isFiltersField = formattedKey === "Filters" ||
                                 key.toLowerCase() === "filters" ||
                                 key.toLowerCase() === "filter";

          return (
            <div key={key}>
              {isCollapsibleField ? (
                <CollapsibleValue label={formattedKey} value={entryValue} />
              ) : isFiltersField && Array.isArray(entryValue) && entryValue.length > 0 ? (
                <CollapsibleList label={`${formattedKey} (${entryValue.length})`} items={entryValue} />
              ) : (
                <>
                  <dt className="text-[0.7rem] uppercase tracking-[0.2em] text-white/50">{formattedKey}</dt>
                  <dd className="mt-1 border-l border-white/20 pl-3">
                    <ValueTree value={entryValue} parentKey={key} />
                  </dd>
                </>
              )}
            </div>
          );
        })}
      </dl>
    );
  }
  return <div className="break-all font-mono">{String(value)}</div>;
}

function formatMaybeBytes(value: string) {
  if (/^[A-Za-z0-9+/=_-]+$/.test(value) && value.length > 16) {
    const hex = base64ToHex(value);
    if (hex) {
      return `0x${hex}`;
    }
    return formatBase64Bytes(value);
  }
  return value;
}
