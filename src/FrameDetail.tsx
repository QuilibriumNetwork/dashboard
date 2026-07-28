import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";

import { GlobalFrame, FrameRequest, RequestOutcome, explorerApi } from "@/lib/api";
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
import Callout from "@/components/ui/Callout";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import { IconCopy, IconCopyCheck } from "@tabler/icons-react";

function CopyFrameDataButton() {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative p-2.5 text-muted hover:text-pink transition-colors bg-transparent hover:bg-transparent"
    >
      {copied ? (
        <IconCopyCheck className="w-6 h-6" />
      ) : (
        <IconCopy className="w-6 h-6" />
      )}
      {hovered && (
        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 px-2 py-1 font-inter text-sm sm:text-xs tracking-normal rounded shadow-lg whitespace-nowrap pointer-events-none z-50 ${copied ? 'bg-green text-white' : 'bg-tooltip text-[var(--color-text-tooltip)]'}`}>
          {copied ? 'Copied!' : 'Copy data'}
          <span className={`absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent ${copied ? 'border-t-green' : 'border-t-[var(--color-bg-tooltip)]'}`} />
        </span>
      )}
    </button>
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
    <PageLayout title="Frame Detail • Quilibrium Explorer">
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
          <Link to="/" className="text-sm action-text">
            ← Back
          </Link>
        </div>

        {error && (
          <Callout type="error" radius="2xl" padding="lg" className="mt-6">
            {error}
          </Callout>
        )}

        <section className="section-glow-a mt-6 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 text-burgundy shadow-xl dark:text-white">
          <div className="-mt-2 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Frame #{header?.frameNumber.toLocaleString() ?? frameNumber}</h1>
              {header && (
                <div className="mt-2 text-sm sm:text-xs text-muted">
                  {formatTimestamp(header.timestamp)} {formatRelative(header.timestamp) && `(${formatRelative(header.timestamp)})`}
                </div>
              )}
            </div>
            {frame && <CopyFrameDataButton />}
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-subtle bg-white/90 p-5 dark:bg-surface-raised">
              <div className="label-text">Rank</div>
              <div className="mt-2 text-2xl font-semibold">{header?.rank.toLocaleString() ?? "–"}</div>
              <div className="text-sm text-secondary">Difficulty {header?.difficulty ?? "–"}</div>
            </div>
            <div className="rounded-2xl border border-subtle bg-white/90 p-5 dark:bg-surface-raised">
              <div className="label-text">Prover</div>
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

        <section className="section-glow-b mt-10 rounded-3xl border border-subtle bg-surface p-5 xs:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-primary">Request breakdown</h2>
            <div className="text-sm text-muted">
              {totalRequests} request{totalRequests === 1 ? "" : "s"}
            </div>
          </div>
          {frame?.requests && frame.requests.length > 0 ? (
            <div className="mt-6 space-y-5">
              {frame.requests.map((bundle, bundleIndex) => (
                <div key={bundleIndex} className="rounded-2xl border border-default bg-white/90 p-5 dark:bg-surface-raised/95">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="label-text">Bundle {bundleIndex + 1}</div>
                      <OutcomeBadge outcome={frame?.requestOutcomes?.[bundleIndex]} />
                    </div>
                    <div className="text-sm sm:text-xs text-muted">
                      {formatTimestamp(bundle.timestamp)}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-secondary">
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
            <div className="mt-6 text-sm text-muted">No requests recorded for this frame.</div>
          )}
        </section>
      </div>
    </PageLayout>
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
    <div className="rounded-2xl border border-default bg-surface-raised px-4 py-4 text-burgundy dark:text-white">
      <div className="label-text">{label}</div>
      {displayValue}
    </div>
  );
}

// Materialization outcome pill for a bundle: whether its op actually applied.
function OutcomeBadge({ outcome }: { outcome?: RequestOutcome }) {
  const map = {
    succeeded: { label: "Materialized", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Failed", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
    rejected: { label: "Rejected", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    skipped: { label: "Skipped", cls: "bg-slate-400/15 text-slate-500" },
  } as const;
  const m = outcome
    ? map[outcome.status] ?? map.skipped
    : { label: "Pending", cls: "bg-slate-400/15 text-slate-500" };
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${m.cls}`}
        title={outcome ? undefined : "Not yet materialized"}
      >
        {m.label}
      </span>
      {outcome?.error ? (
        <span className="max-w-[22rem] truncate font-mono text-[11px] text-muted" title={outcome.error}>
          {outcome.error}
        </span>
      ) : null}
    </span>
  );
}

// ---- Per-type decoded request rendering -----------------------------------
//
// Each of the 29 `MessageRequest` oneof variants gets a friendly title, an
// optional one-line summary, and a set of highlighted key fields with semantic
// formatting (bytes → 0x hex, ints → decimal, repeated → count/list). The full
// raw field tree stays available in a collapsible section below.

type FieldKind = "bytes" | "int" | "filters" | "count" | "text";

interface FieldSpec {
  key: string; // camelCase protojson key
  label: string;
  kind: FieldKind;
}

interface RequestTypeSpec {
  title: string;
  summary?: (p: Record<string, any>) => string | null;
  fields: FieldSpec[];
}

// terse field builders
const B = (key: string, label: string): FieldSpec => ({ key, label, kind: "bytes" });
const I = (key: string, label: string): FieldSpec => ({ key, label, kind: "int" });
const FS = (key: string, label: string): FieldSpec => ({ key, label, kind: "filters" });
const C = (key: string, label: string): FieldSpec => ({ key, label, kind: "count" });

const io = (p: Record<string, any>) =>
  `${p.inputs?.length ?? 0} in → ${p.outputs?.length ?? 0} out`;

const REQUEST_TYPES: Record<string, RequestTypeSpec> = {
  join: { title: "Prover Join", summary: (p) => `${p.filters?.length ?? 0} shard(s) @ frame ${p.frameNumber ?? "?"}`, fields: [FS("filters", "Shard filters"), I("frameNumber", "Frame"), B("delegateAddress", "Delegate"), C("mergeTargets", "Merge targets"), B("proof", "Proof")] },
  leave: { title: "Prover Leave", fields: [FS("filters", "Shard filters"), I("frameNumber", "Frame")] },
  pause: { title: "Prover Pause", fields: [B("filter", "Shard filter"), I("frameNumber", "Frame")] },
  resume: { title: "Prover Resume", fields: [B("filter", "Shard filter"), I("frameNumber", "Frame")] },
  confirm: { title: "Prover Confirm", fields: [FS("filters", "Shard filters"), I("frameNumber", "Frame"), C("leafRoots", "Leaf roots")] },
  reject: { title: "Prover Reject", fields: [FS("filters", "Shard filters"), I("frameNumber", "Frame")] },
  kick: { title: "Prover Kick", fields: [I("frameNumber", "Frame"), B("kickedProverPublicKey", "Kicked prover"), B("commitment", "Commitment")] },
  update: { title: "Prover Update", fields: [B("delegateAddress", "Delegate")] },
  seniorityMerge: { title: "Seniority Merge", fields: [I("frameNumber", "Frame"), C("mergeTargets", "Merge targets")] },
  tokenDeploy: { title: "Token Deploy", fields: [B("rdfSchema", "RDF schema")] },
  tokenUpdate: { title: "Token Update", fields: [B("rdfSchema", "RDF schema")] },
  transaction: { title: "Token Transaction", summary: io, fields: [B("domain", "Domain"), C("inputs", "Inputs"), C("outputs", "Outputs"), C("fees", "Fees")] },
  pendingTransaction: { title: "Pending Transaction", summary: io, fields: [B("domain", "Domain"), C("inputs", "Inputs"), C("outputs", "Outputs")] },
  mintTransaction: { title: "Mint Transaction", summary: io, fields: [B("domain", "Domain"), C("inputs", "Inputs"), C("outputs", "Outputs")] },
  hypergraphDeploy: { title: "Hypergraph Deploy", fields: [B("rdfSchema", "RDF schema")] },
  hypergraphUpdate: { title: "Hypergraph Update", fields: [B("rdfSchema", "RDF schema")] },
  vertexAdd: { title: "Vertex Add", fields: [B("domain", "Domain"), B("dataAddress", "Data address"), B("data", "Data")] },
  vertexRemove: { title: "Vertex Remove", fields: [B("domain", "Domain"), B("dataAddress", "Data address")] },
  hyperedgeAdd: { title: "Hyperedge Add", fields: [B("domain", "Domain"), B("value", "Value")] },
  hyperedgeRemove: { title: "Hyperedge Remove", fields: [B("domain", "Domain"), B("value", "Value")] },
  computeDeploy: { title: "Compute Deploy", fields: [B("rdfSchema", "RDF schema")] },
  computeUpdate: { title: "Compute Update", fields: [B("rdfSchema", "RDF schema")] },
  codeDeploy: { title: "Code Deploy", fields: [B("domain", "Domain"), B("circuit", "Circuit"), C("inputTypes", "Input types"), C("outputTypes", "Output types")] },
  codeExecute: { title: "Code Execute", fields: [B("domain", "Domain"), B("rendezvous", "Rendezvous"), C("executeOperations", "Operations")] },
  codeFinalize: { title: "Code Finalize", fields: [B("rendezvous", "Rendezvous"), C("results", "Results"), C("stateChanges", "State changes")] },
  shard: { title: "Shard Frame", summary: (p) => `shard frame ${p.frameNumber ?? "?"} (global ${p.globalFrameNumber ?? "?"})`, fields: [B("address", "Shard address"), I("frameNumber", "Frame"), I("globalFrameNumber", "Global frame"), I("rank", "Rank"), B("prover", "Prover"), B("requestsRoot", "Requests root"), C("stateRoots", "State roots"), B("storageAttestationRoot", "Storage attest. root")] },
  altShardUpdate: { title: "Alt Shard Update", summary: (p) => `alt shard @ frame ${p.frameNumber ?? "?"}`, fields: [B("publicKey", "Public key"), I("frameNumber", "Frame"), B("vertexAddsRoot", "Vertex adds"), B("vertexRemovesRoot", "Vertex removes"), B("hyperedgeAddsRoot", "Hyperedge adds"), B("hyperedgeRemovesRoot", "Hyperedge removes")] },
  shardSplit: { title: "Shard Split", summary: (p) => `split into ${p.proposedShards?.length ?? 0}`, fields: [B("shardAddress", "Shard address"), FS("proposedShards", "Proposed shards"), I("frameNumber", "Frame")] },
  shardMerge: { title: "Shard Merge", summary: (p) => `merge ${p.shardAddresses?.length ?? 0} → parent`, fields: [C("shardAddresses", "Shard addresses"), B("parentAddress", "Parent"), I("frameNumber", "Frame")] },
};

function truncHex(hex: string): string {
  const h = hex.startsWith("0x") ? hex : `0x${hex}`;
  return h.length <= 20 ? h : `${h.slice(0, 12)}…${h.slice(-6)}`;
}

function BytesField({ value }: { value: unknown }) {
  const s = typeof value === "string" ? value : "";
  if (!s) return <span className="text-muted">—</span>;
  const hex = base64ToHex(s);
  const full = hex ? `0x${hex}` : s;
  return (
    <HoverableCopyText text={full}>
      <span className="font-mono text-xs">{hex ? truncHex(hex) : formatBase64Bytes(s)}</span>
    </HoverableCopyText>
  );
}

function FieldValue({ kind, value }: { kind: FieldKind; value: unknown }) {
  switch (kind) {
    case "bytes":
      return <BytesField value={value} />;
    case "int": {
      const s = typeof value === "string" || typeof value === "number" ? String(value) : "";
      return <span className="font-mono text-xs">{s === "" ? "—" : s}</span>;
    }
    case "count":
      return <span className="font-mono text-xs">{Array.isArray(value) ? value.length : 0}</span>;
    case "filters": {
      const arr = Array.isArray(value) ? value : [];
      if (!arr.length) return <span className="text-muted">—</span>;
      return (
        <div className="space-y-0.5">
          <span className="text-xs text-secondary">{arr.length} filter{arr.length === 1 ? "" : "s"}</span>
          {arr.slice(0, 3).map((v, idx) => (
            <div key={idx}><BytesField value={v} /></div>
          ))}
          {arr.length > 3 && <div className="text-xs text-muted">+{arr.length - 3} more</div>}
        </div>
      );
    }
    case "text":
      return <span className="font-mono text-xs break-all">{typeof value === "string" ? value : "—"}</span>;
    default:
      return <span className="text-muted">—</span>;
  }
}

function RequestCard({ index, request }: { index: number; request: FrameRequest }) {
  const typeKey = getRequestType(request);
  const payload = (typeKey ? (request as Record<string, unknown>)[typeKey] : undefined) as
    | Record<string, any>
    | undefined;
  const timestamp = request.timestamp ? formatTimestamp(request.timestamp) : null;
  const spec = typeKey ? REQUEST_TYPES[typeKey] : undefined;
  const title = spec?.title ?? formatTypeName(typeKey);
  const summary = spec?.summary && payload ? spec.summary(payload) : null;
  const rawPayload = typeof payload === "object" && payload !== null ? payload : request;

  return (
    <div className="rounded-2xl border border-default bg-white/90 p-4 text-sm text-burgundy dark:bg-surface dark:text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold">Request {index + 1}: {title}</div>
        {timestamp && (
          <div className="text-sm sm:text-xs text-muted">{timestamp}</div>
        )}
      </div>
      {summary && <div className="mt-1 text-sm text-secondary">{summary}</div>}
      {spec && payload ? (
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {spec.fields.map((f) => (
            <div key={f.key} className="min-w-0">
              <dt className="text-xs font-medium text-muted">{f.label}</dt>
              <dd className="mt-0.5 break-all">
                <FieldValue kind={f.kind} value={payload[f.key]} />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        // Unknown/unspecified type → fall back to the full generic tree inline.
        <div className="mt-3 rounded-xl bg-surface-inset p-4 text-sm sm:text-xs text-secondary">
          <ValueTree value={rawPayload} />
        </div>
      )}
      {spec && (
        <div className="mt-3 rounded-xl bg-surface-inset p-4 text-sm sm:text-xs text-secondary">
          <CollapsibleValue label="All fields (raw)" value={rawPayload} />
        </div>
      )}
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
        className="flex w-full items-center gap-2 text-left text-sm sm:text-xs font-medium text-muted hover:text-secondary transition-colors"
      >
        <ChevronDown
          className={`size-3 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span>{label}</span>
      </button>
      <div className="mt-1 border-l border-default pl-3 relative">
        <div className={isExpanded ? '' : 'max-h-[4.5rem] overflow-hidden'}>
          <ValueTree value={value} />
        </div>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-beige/60 via-beige/30 to-transparent dark:from-[#120918] dark:via-[#120918]/70">
            <button
              onClick={toggleExpanded}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 text-sm sm:text-xs font-medium text-secondary hover:text-burgundy bg-burgundy/10 hover:bg-burgundy/20 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 rounded-full backdrop-blur-sm transition-all border border-default hover:border-strong"
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
        className="flex w-full items-center gap-2 text-left text-sm sm:text-xs font-medium text-muted hover:text-secondary transition-colors"
      >
        <ChevronDown
          className={`size-3 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span>{label}</span>
      </button>
      <div className="mt-1 border-l border-default pl-3 relative">
        <ol className="space-y-2">
          {displayItems.map((item, idx) => (
            <li key={idx}>
              <div className="text-sm sm:text-xs font-medium text-muted">Item {idx + 1}</div>
              <div className="mt-1 border-l border-default pl-3">
                <ValueTree value={item} parentKey={label} />
              </div>
            </li>
          ))}
        </ol>
        {!isExpanded && items.length > 3 && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-beige/60 via-beige/30 to-transparent dark:from-[#120918] dark:via-[#120918]/70 pointer-events-none" />
            <button
              onClick={toggleExpanded}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 text-sm sm:text-xs font-medium text-secondary hover:text-burgundy bg-burgundy/10 hover:bg-burgundy/20 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 rounded-full backdrop-blur-sm transition-all border border-default hover:border-strong z-10"
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
    return <div className="break-all font-mono text-muted">–</div>;
  }
  if (typeof value === "string") {
    return <div className="break-all font-mono text-primary">{formatMaybeBytes(value)}</div>;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <div className="break-all font-mono text-primary">{String(value)}</div>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div className="break-all font-mono text-muted">Empty array</div>;
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
            <div className="text-sm sm:text-xs font-medium text-muted">Item {idx + 1}</div>
            <div className="mt-1 border-l border-default pl-3">
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
      return <div className="break-all font-mono text-muted">Empty object</div>;
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
                  <dt className="text-sm sm:text-xs font-medium text-muted">{formattedKey}</dt>
                  <dd className="mt-1 border-l border-default pl-3">
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
  return <div className="break-all font-mono text-primary">{String(value)}</div>;
}

function formatMaybeBytes(value: string) {
  // protojson serializes 64/128-bit integers (amounts, sizes, frame numbers,
  // etc.) as DECIMAL STRINGS. A pure run of digits is such an integer — leave
  // it as a number instead of mistaking it for base64 bytes and rendering it
  // as hex garbage (which broke every token/shard/hypergraph amount field).
  if (/^\d+$/.test(value)) {
    return value;
  }
  if (/^[A-Za-z0-9+/=_-]+$/.test(value) && value.length > 16) {
    const hex = base64ToHex(value);
    if (hex) {
      return `0x${hex}`;
    }
    return formatBase64Bytes(value);
  }
  return value;
}
