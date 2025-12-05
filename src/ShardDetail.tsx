import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { explorerApi, ProverRecord } from "@/lib/api";
import { formatProvers, type FormattedProver, prefixHex } from "@/lib/provers";
import { ProverCard } from "@/components/ProverCard";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import Spinner from "@/components/ui/Spinner";

interface CoverageState {
  label: string;
  description: string;
  tone: "safe" | "warn" | "risk";
}

function getCoverageState(activeCount: number): CoverageState {
  if (activeCount >= 6) {
    return {
      label: "Sufficient coverage",
      description: "At least six active provers are online for this shard filter.",
      tone: "safe",
    };
  }
  if (activeCount >= 3) {
    return {
      label: "Warning",
      description: "Fewer than six but at least three active provers are available.",
      tone: "warn",
    };
  }
  return {
    label: "Halt risk",
    description: "Less than three active provers are online. The shard is at risk of halting.",
    tone: "risk",
  };
}

const STATUS_ORDER = [
  "active",
  "joining",
  "paused",
  "leaving",
  "rejected",
  "kicked",
  "unknown",
];

export default function ShardDetail() {
  const params = useParams<{ filter: string }>();
  const rawFilter = params.filter ?? "";
  const normalizedFilter = rawFilter.startsWith("0x") ? rawFilter.slice(2) : rawFilter;
  const [provers, setProvers] = useState<FormattedProver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!normalizedFilter) {
        setError("Missing shard filter");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const records: ProverRecord[] = await explorerApi.getShardProvers(normalizedFilter);
        if (!mounted) return;
        setProvers(formatProvers(records));
        setExpandedStatuses(new Set());
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load shard data");
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
  }, [normalizedFilter]);

  const activeCount = useMemo(() => {
    return provers.filter((prover) => prover.status.toLowerCase() === "active").length;
  }, [provers]);

  const showCoverage = !loading && !error && provers.length > 0;
  const coverage = showCoverage ? getCoverageState(activeCount) : null;

  const groupedProvers = useMemo(() => {
    const map = new Map<string, FormattedProver[]>();
    provers.forEach((prover) => {
      const key = prover.status?.toLowerCase() || "unknown";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(prover);
    });

    const orderedStatuses = Array.from(map.keys()).sort((a, b) => {
      const idxA = STATUS_ORDER.indexOf(a);
      const idxB = STATUS_ORDER.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return orderedStatuses.map((status) => ({ status, entries: map.get(status) ?? [] }));
  }, [provers]);

  const badgeStyles = {
    safe: "bg-green/10 text-green dark:bg-green/20 dark:text-light-green",
    warn: "bg-yellow-200/40 text-amber-800 dark:bg-yellow-100/20 dark:text-yellow-100",
    risk: "bg-red/20 text-red-900 dark:bg-red/30 dark:text-red-200",
  };

  const coverageClass = coverage ? badgeStyles[coverage.tone] : "";
  const filterSource = normalizedFilter || rawFilter;
  const hasFilter = Boolean(filterSource);
  const displayFilter = hasFilter ? prefixHex(filterSource) : "–";

  const toggleStatus = (status: string) => {
    setExpandedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-screen bg-beige pb-24 pt-16 dark:bg-[#100418]">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
      <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40 overflow-hidden" />
      <div className="pointer-events-none absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />

      <div className="relative mx-auto max-w-5xl px-6">
        <section className="relative overflow-hidden rounded-3xl border border-burgundy/10 bg-white/95 p-10 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white dark:shadow-[0_40px_90px_-55px_rgba(8,4,20,0.7)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl dark:bg-pink/30" />
          <div className="pointer-events-none absolute left-6 top-8 h-24 w-24 rounded-full bg-light-purple/80 blur-2xl dark:bg-purple/40" />

          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">
                  Shard filter
                </p>
                <div className="mt-1 font-mono text-sm break-all">
                  {hasFilter ? (
                    displayFilter
                  ) : (
                    "–"
                  )}
                </div>
              </div>
              <Link to="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors">
                ← Back to explorer
              </Link>
            </div>

            {coverage && (
              <div className={`inline-flex flex-col rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] ${coverageClass}`}>
                <span>{coverage.label}</span>
                <span className="mt-1 text-[0.6rem] normal-case tracking-normal text-burgundy/80 dark:text-white/80">
                  {coverage.description}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-burgundy/70 dark:text-white/70">
              <div>
                Total provers: <span className="font-semibold text-burgundy dark:text-white">{provers.length.toLocaleString()}</span>
              </div>
              <div>
                Active provers: <span className="font-semibold text-burgundy dark:text-white">{activeCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-burgundy/10 bg-white/70 px-4 py-3 text-xs text-burgundy/80 shadow-[0_10px_35px_-30px_rgba(64,0,27,0.7)] dark:border-white/10 dark:bg-[#211430]/80 dark:text-white/70">
              <strong>Seniority note:</strong> provers with existing seniority that have not confirmed a join yet will report a seniority of 0 until a confirmation occurs.
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="40" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-sm text-red-900 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">
                {error}
              </div>
            ) : provers.length === 0 ? (
              <div className="rounded-2xl border border-burgundy/10 bg-white/60 p-6 text-sm text-burgundy/70 dark:border-white/10 dark:bg-[#211430]/70 dark:text-white/70">
                No provers have been reported for this shard filter.
              </div>
            ) : (
              <div className="space-y-10">
                {groupedProvers.map(({ status, entries }) => (
                  <div key={status}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-burgundy dark:text-white">
                        {status} ({entries.length})
                      </h3>
                      <button
                        onClick={() => toggleStatus(status)}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
                      >
                        {expandedStatuses.has(status) ? "Collapse" : "Expand"}
                      </button>
                    </div>
                    {expandedStatuses.has(status) && (
                      <>
                        <div className="mt-4 overflow-x-auto md:hidden">
                          <div className="max-h-[500px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-burgundy/10 text-left text-sm text-burgundy dark:divide-white/10 dark:text-white">
                              <thead className="sticky top-0 z-10 bg-white/95 dark:bg-[#1a0f27]/95 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                                <tr>
                                  <th className="py-3 px-4">Address</th>
                                  <th className="py-3 px-4">Public key</th>
                                  <th className="py-3 px-4">Seniority</th>
                                  <th className="py-3 px-4">Storage</th>
                                  <th className="py-3 px-4">Delegate</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-burgundy/10 dark:divide-white/10">
                                {entries.map((prover) => (
                                  <tr key={prover.id}>
                                    <td className="py-3 px-4 font-mono text-xs break-all align-top">
                                      <HoverableCopyText text={prover.address}>{prover.address}</HoverableCopyText>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs break-all align-top">
                                      {prover.publicKey ? (
                                        <HoverableCopyText text={prover.publicKey}>{prover.publicKey}</HoverableCopyText>
                                      ) : (
                                        "–"
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-xs align-top">{prover.seniorityLabel}</td>
                                    <td className="py-3 px-4 text-xs align-top">{prover.storageLabel}</td>
                                    <td className="py-3 px-4 text-xs break-all align-top">
                                      {prover.delegate ? (
                                        <HoverableCopyText text={prover.delegate}>{prover.delegate}</HoverableCopyText>
                                      ) : (
                                        "–"
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="hidden md:grid mt-4 gap-4 md:grid-cols-2">
                          {entries.map((prover) => (
                            <ProverCard key={prover.id} prover={prover} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
