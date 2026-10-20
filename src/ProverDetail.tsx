import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Spinner from "@/components/ui/Spinner";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import { ProverLink, ShardLink } from "@/components/HexLink";
import { EvictionRiskList } from "@/components/EvictionRiskList";
import {
  EvictionRiskPage,
  KeyRegistry,
  ProverAllocation,
  ProverRecord,
  explorerApi,
  isNotFound,
} from "@/lib/api";
import { isHex32, normalizeHex, truncateHex } from "@/lib/format";
import { formatByteSize } from "@/lib/provers";
import { toneBadgeClasses, type Tone } from "@/lib/production";

interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initial<T>(): Loadable<T> {
  return { data: null, loading: true, error: null };
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

const STATUS_ORDER = ["active", "joining", "paused", "leaving", "rejected", "kicked", "historic"];

const statusTones: Record<string, Tone> = {
  active: "safe",
  joining: "safe",
  paused: "warn",
  leaving: "warn",
  rejected: "risk",
  kicked: "risk",
};

function StatusBadge({ status }: { status: string }) {
  const tone = statusTones[status.toLowerCase()] ?? "default";
  return (
    <span className={`inline-flex text-xs font-semibold uppercase tracking-label rounded-full px-3 py-1 ${toneBadgeClasses[tone]}`}>
      {status}
    </span>
  );
}

function statusRank(status: string) {
  const idx = STATUS_ORDER.indexOf(status.toLowerCase());
  return idx === -1 ? STATUS_ORDER.length : idx;
}

/** Lifecycle frame numbers of an allocation that are set. */
function allocationEvents(alloc: ProverAllocation): Array<{ label: string; frame: number }> {
  const events: Array<[string, number | undefined]> = [
    ["Joined", alloc.join_frame_number],
    ["Join confirmed", alloc.join_confirm_frame_number],
    ["Join rejected", alloc.join_reject_frame_number],
    ["Paused", alloc.pause_frame_number],
    ["Resumed", alloc.resume_frame_number],
    ["Leave requested", alloc.leave_frame_number],
    ["Leave confirmed", alloc.leave_confirm_frame_number],
    ["Leave rejected", alloc.leave_reject_frame_number],
    ["Kicked", alloc.kick_frame_number],
  ];
  return events
    .filter((event): event is [string, number] => typeof event[1] === "number" && event[1] > 0)
    .map(([label, frame]) => ({ label, frame }));
}

function DetailTile({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-default bg-surface-raised px-4 py-4 text-burgundy dark:text-white">
      <div className="label-text">{label}</div>
      <div className="mt-2 text-base font-semibold break-all">{children}</div>
      {hint && <div className="mt-1 text-sm sm:text-xs text-muted">{hint}</div>}
    </div>
  );
}

function AddressValue({ value }: { value?: string | null }) {
  if (!value) return <>–</>;
  if (isHex32(value)) return <ProverLink address={value} />;
  return (
    <span className="font-mono">
      <HoverableCopyText text={value}>{truncateHex(value)}</HoverableCopyText>
    </span>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger-subtle p-4 text-sm text-danger">{message}</div>
  );
}

function AllocationEvents({ alloc }: { alloc: ProverAllocation }) {
  const events = allocationEvents(alloc);
  if (events.length === 0) return <>–</>;
  return (
    <div className="space-y-0.5">
      {events.map((event) => (
        <div key={event.label}>
          <span className="text-muted">{event.label}</span> {event.frame.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

function AllocationFilters({ alloc }: { alloc: ProverAllocation }) {
  return (
    <div className="space-y-1">
      {alloc.confirmation_filter ? <ShardLink filter={alloc.confirmation_filter} /> : "–"}
      {alloc.rejection_filter && (
        <div>
          <span className="text-muted">Reject:</span> <ShardLink filter={alloc.rejection_filter} />
        </div>
      )}
    </div>
  );
}

function AllocationList({ allocations }: { allocations: ProverAllocation[] }) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {allocations.map((alloc, idx) => (
          <div
            key={`${alloc.confirmation_filter ?? "none"}-${idx}`}
            className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="label-text">Shard filter</div>
              <StatusBadge status={alloc.status} />
            </div>
            <div className="mt-1 text-sm sm:text-xs">
              <AllocationFilters alloc={alloc} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm sm:text-xs text-secondary">
              <span>Last active</span>
              <span className="text-right font-semibold text-primary">
                {alloc.last_active_frame_number ? alloc.last_active_frame_number.toLocaleString() : "–"}
              </span>
              {allocationEvents(alloc).map((event) => (
                <Fragment key={event.label}>
                  <span>{event.label}</span>
                  <span className="text-right font-semibold text-primary">{event.frame.toLocaleString()}</span>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
            <thead className="sticky top-0 z-10 bg-surface label-text">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Shard filter</th>
                <th className="py-3 px-4">Last active</th>
                <th className="py-3 px-4">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {allocations.map((alloc, idx) => (
                <tr key={`${alloc.confirmation_filter ?? "none"}-${idx}`}>
                  <td className="py-3 px-4 align-top">
                    <StatusBadge status={alloc.status} />
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top">
                    <AllocationFilters alloc={alloc} />
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top font-semibold">
                    {alloc.last_active_frame_number ? alloc.last_active_frame_number.toLocaleString() : "–"}
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top">
                    <AllocationEvents alloc={alloc} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KeyValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-default bg-surface-raised px-3 py-2">
      <div className="label-text">{label}</div>
      <div className="mt-0.5 font-mono text-sm sm:text-xs text-primary">
        {value ? <HoverableCopyText text={value}>{truncateHex(value)}</HoverableCopyText> : "–"}
      </div>
    </div>
  );
}

const sectionClass =
  "relative overflow-hidden rounded-3xl border border-subtle bg-surface p-5 xs:p-8 text-burgundy shadow-xl backdrop-blur-lg dark:text-white";

export default function ProverDetail() {
  const params = useParams<{ address: string }>();
  const navigate = useNavigate();
  const address = normalizeHex(params.address ?? "");
  const validAddress = isHex32(address);

  const [prover, setProver] = useState<Loadable<ProverRecord>>(initial);
  const [risk, setRisk] = useState<Loadable<EvictionRiskPage>>(initial);
  const [keys, setKeys] = useState<Loadable<KeyRegistry> & { notRecorded: boolean }>({
    ...initial<KeyRegistry>(),
    notRecorded: false,
  });
  const [showHistoric, setShowHistoric] = useState(false);

  useEffect(() => {
    if (!validAddress) return;
    let mounted = true;
    setProver(initial());
    setRisk(initial());
    setKeys({ ...initial<KeyRegistry>(), notRecorded: false });
    setShowHistoric(false);

    explorerApi
      .getProvers({ address })
      .then((records) => {
        if (!mounted) return;
        const match = records.find((record) => normalizeHex(record.address ?? "") === address) ?? null;
        setProver({ data: match, loading: false, error: match ? null : "Prover not found" });
      })
      .catch((err) => {
        if (mounted) setProver({ data: null, loading: false, error: errorMessage(err, "Failed to load prover") });
      });

    explorerApi
      .getEvictionRisk({ address })
      .then((data) => {
        if (mounted) setRisk({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (mounted) setRisk({ data: null, loading: false, error: errorMessage(err, "Failed to load eviction risk") });
      });

    explorerApi
      .getKeyRegistryByProver(address)
      .then((data) => {
        if (mounted) setKeys({ data, loading: false, error: null, notRecorded: false });
      })
      .catch((err) => {
        if (!mounted) return;
        if (isNotFound(err)) {
          setKeys({ data: null, loading: false, error: null, notRecorded: true });
        } else {
          setKeys({ data: null, loading: false, error: errorMessage(err, "Failed to load key registry"), notRecorded: false });
        }
      });

    return () => {
      mounted = false;
    };
  }, [address, validAddress]);

  const allocations = useMemo(() => {
    const list = [...(prover.data?.allocations ?? [])];
    list.sort((a, b) => {
      const byStatus = statusRank(a.status) - statusRank(b.status);
      if (byStatus !== 0) return byStatus;
      return (b.last_active_frame_number ?? 0) - (a.last_active_frame_number ?? 0);
    });
    return list;
  }, [prover.data]);
  const historicCount = allocations.filter((alloc) => alloc.status.toLowerCase() === "historic").length;
  const shownAllocations = showHistoric
    ? allocations
    : allocations.filter((alloc) => alloc.status.toLowerCase() !== "historic");
  const activeCount = allocations.filter((alloc) => alloc.status.toLowerCase() === "active").length;

  const keyPurposeCount = keys.data
    ? Object.values(keys.data.keysByPurpose ?? {}).reduce(
        (sum, purpose) => sum + (purpose.x448Keys?.length ?? 0) + (purpose.decaf448Keys?.length ?? 0),
        0
      )
    : 0;

  return (
    <PageLayout title="Prover Detail • Quilibrium Explorer">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm action-text bg-transparent hover:bg-transparent"
          >
            ← Back
          </button>
        </div>

        {!validAddress ? (
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger-subtle p-6 text-sm text-danger">
            Invalid prover address. Expected 32 bytes of hex.
          </div>
        ) : (
          <>
            <section className={`section-glow-a mt-6 ${sectionClass}`}>
              <div className="relative space-y-6">
                <div>
                  <p className="label-text">Prover</p>
                  <h1 className="mt-1 text-lg md:text-xl font-mono font-semibold break-all text-primary">
                    <HoverableCopyText text={address}>{address}</HoverableCopyText>
                  </h1>
                </div>

                {prover.loading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="40" />
                  </div>
                ) : prover.error || !prover.data ? (
                  <SectionError message={prover.error ?? "Prover not found"} />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailTile label="Status">
                      <StatusBadge status={prover.data.status} />
                    </DetailTile>
                    <DetailTile label="Seniority">
                      {typeof prover.data.seniority === "number" ? prover.data.seniority.toLocaleString() : "–"}
                    </DetailTile>
                    <DetailTile label="Active allocations" hint={`${allocations.length.toLocaleString()} total`}>
                      {activeCount.toLocaleString()}
                    </DetailTile>
                    <DetailTile label="Available storage">{formatByteSize(prover.data.available_storage)}</DetailTile>
                    <DetailTile label="Delegate">
                      <span className="text-sm">
                        <AddressValue value={prover.data.delegate_address} />
                      </span>
                    </DetailTile>
                    <DetailTile label="Public key">
                      <span className="font-mono text-sm">
                        {prover.data.public_key ? (
                          <HoverableCopyText text={prover.data.public_key}>
                            {truncateHex(prover.data.public_key)}
                          </HoverableCopyText>
                        ) : (
                          "–"
                        )}
                      </span>
                    </DetailTile>
                    {typeof prover.data.kick_frame_number === "number" && prover.data.kick_frame_number > 0 && (
                      <DetailTile label="Kicked at frame">{prover.data.kick_frame_number.toLocaleString()}</DetailTile>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={`section-glow-c mt-10 ${sectionClass}`}>
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionTitle icon="warningshield">Eviction risk</SectionTitle>
                  {risk.data && (
                    <div className="text-sm sm:text-xs font-semibold uppercase tracking-label text-secondary">
                      {risk.data.total.toLocaleString()} allocation{risk.data.total === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
                {risk.loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="30" />
                  </div>
                ) : risk.error || !risk.data ? (
                  <SectionError message={risk.error ?? "Eviction risk unavailable"} />
                ) : risk.data.entries.length === 0 ? (
                  <p className="text-sm text-secondary">No allocations accruing inactivity.</p>
                ) : (
                  <EvictionRiskList entries={risk.data.entries} showProver={false} />
                )}
              </div>
            </section>

            <section className={`section-glow-a mt-10 ${sectionClass}`}>
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionTitle icon="modulepuzzle2">Allocations</SectionTitle>
                  {historicCount > 0 && (
                    <button
                      onClick={() => setShowHistoric((prev) => !prev)}
                      className="text-sm sm:text-xs action-text bg-transparent hover:bg-transparent"
                    >
                      {showHistoric ? "Hide" : "Show"} {historicCount.toLocaleString()} historic
                    </button>
                  )}
                </div>
                {prover.loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="30" />
                  </div>
                ) : !prover.data ? (
                  <p className="text-sm text-secondary">Allocations unavailable.</p>
                ) : shownAllocations.length === 0 ? (
                  <p className="text-sm text-secondary">
                    {allocations.length === 0 ? "No allocations." : "No current allocations."}
                  </p>
                ) : (
                  <AllocationList allocations={shownAllocations} />
                )}
              </div>
            </section>

            <section className={`section-glow-b mt-10 ${sectionClass}`}>
              <div className="relative space-y-6">
                <SectionTitle icon="visible">Key registry</SectionTitle>
                {keys.loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="30" />
                  </div>
                ) : keys.notRecorded ? (
                  <p className="text-sm text-muted">No key registry recorded for this prover.</p>
                ) : keys.error || !keys.data ? (
                  <SectionError message={keys.error ?? "Key registry unavailable"} />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <KeyValue label="Identity key" value={keys.data.identityKey?.keyValue} />
                    <KeyValue label="Prover key" value={keys.data.proverKey?.keyValue} />
                    <div className="rounded-xl border border-default bg-surface-raised px-3 py-2">
                      <div className="label-text">Keys by purpose</div>
                      <div className="mt-0.5 text-sm font-semibold text-primary">
                        {keyPurposeCount.toLocaleString()} across{" "}
                        {Object.keys(keys.data.keysByPurpose ?? {}).length.toLocaleString()} purposes
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}
