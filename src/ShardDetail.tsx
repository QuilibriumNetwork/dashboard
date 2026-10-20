import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  explorerApi,
  ProverRecord,
  type EvictionRiskPage,
  type ShardProductionResponse,
} from "@/lib/api";
import { formatProvers, type FormattedProver, prefixHex } from "@/lib/provers";
import { ProverCard } from "@/components/ProverCard";
import { ProverLink } from "@/components/HexLink";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ShardProductionPanel } from "@/components/ShardProduction";
import { EvictionRiskList } from "@/components/EvictionRiskList";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import Spinner from "@/components/ui/Spinner";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import Callout from "@/components/ui/Callout";
import { PageLayout } from "@/components/PageLayout";

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
  const [production, setProduction] = useState<ShardProductionResponse | null>(null);
  const [productionError, setProductionError] = useState<string | null>(null);
  const [evictionRisk, setEvictionRisk] = useState<EvictionRiskPage | null>(null);

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

  useEffect(() => {
    let mounted = true;
    setProduction(null);
    setProductionError(null);
    setEvictionRisk(null);
    if (!normalizedFilter) return;
    explorerApi
      .getShardProduction({ filter: normalizedFilter })
      .then((data) => {
        if (mounted) setProduction(data);
      })
      .catch((err) => {
        if (mounted) setProductionError(err instanceof Error ? err.message : "Failed to load shard production");
      });
    explorerApi
      .getEvictionRisk({ filter: normalizedFilter })
      .then((page) => {
        if (mounted) setEvictionRisk(page);
      })
      .catch(() => {
        if (mounted) setEvictionRisk({ entries: [], total: 0 });
      });
    return () => {
      mounted = false;
    };
  }, [normalizedFilter]);

  const shardProduction = production?.shards[0] ?? null;

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
    warn: "bg-warning-subtle text-warning",
    risk: "bg-danger-subtle text-danger",
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
    <PageLayout title="Shard Detail • Quilibrium Explorer">
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/" className="text-sm action-text">
            ← Back
          </Link>
        </div>

        <section className="section-glow-a relative overflow-hidden rounded-3xl border border-subtle bg-surface p-5 xs:p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
          <div className="relative space-y-6">
            <div>
              <p className="label-text">
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

            {coverage && (
              <div className={`inline-flex flex-col rounded-2xl px-4 py-3 ${coverageClass}`}>
                <span className="text-base sm:text-sm font-semibold">{coverage.label}</span>
                <span className="mt-1 text-xs normal-case tracking-normal text-secondary">
                  {coverage.description}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-secondary">
              <div>
                Total provers: <span className="font-semibold text-primary">{provers.length.toLocaleString()}</span>
              </div>
              <div>
                Active provers: <span className="font-semibold text-primary">{activeCount.toLocaleString()}</span>
              </div>
            </div>

            <Callout type="beige" radius="2xl" padding="lg">
              <strong>Seniority note:</strong> provers with existing seniority that have not confirmed a join yet will report a seniority of 0 until a confirmation occurs.
            </Callout>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="40" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-danger/20 bg-danger-subtle p-6 text-sm text-danger">
                {error}
              </div>
            ) : provers.length === 0 ? (
              <div className="rounded-2xl border border-subtle bg-white/60 p-6 text-sm text-secondary dark:bg-surface-raised/70">
                No provers have been reported for this shard filter.
              </div>
            ) : (
              <div className="space-y-4">
                {groupedProvers.map(({ status, entries }) => (
                  <CollapsiblePanel
                    key={status}
                    label={`${status} (${entries.length})`}
                    expanded={expandedStatuses.has(status)}
                    onToggle={() => toggleStatus(status)}
                  >
                    <div className="overflow-x-auto md:hidden">
                      <div className="max-h-[500px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
                          <thead className="sticky top-0 z-10 bg-surface-raised label-text">
                            <tr>
                              <th className="py-3 px-4">Address</th>
                              <th className="py-3 px-4">Public key</th>
                              <th className="py-3 px-4">Seniority</th>
                              <th className="py-3 px-4">Storage</th>
                              <th className="py-3 px-4">Delegate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-subtle">
                            {entries.map((prover) => (
                              <tr key={prover.id}>
                                <td className="py-3 px-4 text-sm sm:text-xs align-top">
                                  <ProverLink address={prover.address} />
                                </td>
                                <td className="py-3 px-4 font-mono text-sm sm:text-xs break-all align-top">
                                  {prover.publicKey ? (
                                    <HoverableCopyText text={prover.publicKey}>{prover.publicKey}</HoverableCopyText>
                                  ) : (
                                    "–"
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm sm:text-xs align-top">{prover.seniorityLabel}</td>
                                <td className="py-3 px-4 text-sm sm:text-xs align-top">{prover.storageLabel}</td>
                                <td className="py-3 px-4 text-sm sm:text-xs break-all align-top">
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
                    <div className="hidden md:grid p-6 gap-4 md:grid-cols-2">
                      {entries.map((prover) => (
                        <ProverCard key={prover.id} prover={prover} />
                      ))}
                    </div>
                  </CollapsiblePanel>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section-glow-b mt-14 relative overflow-hidden rounded-3xl border border-subtle bg-surface p-5 xs:p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
          <div className="relative space-y-6">
            <SectionTitle icon="layers1">Production</SectionTitle>
            {productionError ? (
              <p className="text-sm text-secondary">Shard production unavailable: {productionError}</p>
            ) : !production ? (
              <div className="flex justify-center py-8">
                <Spinner size="30" />
              </div>
            ) : shardProduction ? (
              <ShardProductionPanel shard={shardProduction} window={production} />
            ) : (
              <p className="text-sm text-secondary">This filter is not in the live shard set.</p>
            )}
          </div>
        </section>

        <section className="section-glow-c mt-14 relative overflow-hidden rounded-3xl border border-subtle bg-surface p-5 xs:p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionTitle icon="warningshield">Eviction risk</SectionTitle>
              {evictionRisk && (
                <div className="text-sm sm:text-xs font-semibold uppercase tracking-label text-secondary">
                  {evictionRisk.total.toLocaleString()} accruing
                </div>
              )}
            </div>
            {!evictionRisk ? (
              <div className="flex justify-center py-8">
                <Spinner size="30" />
              </div>
            ) : evictionRisk.entries.length === 0 ? (
              <p className="text-sm text-secondary">No allocations on this shard are accruing inactivity.</p>
            ) : (
              <EvictionRiskList entries={evictionRisk.entries} showFilter={false} />
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
