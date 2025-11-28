import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { explorerApi, type PeerRecord } from "@/lib/api";
import {
  formatPeerRows,
  type PeerRow,
} from "@/lib/peers";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import Arrow from "@/components/ui/Arrow";
import ChevronDown from "@/components/ui/ChevronDown";
import Spinner from "@/components/ui/Spinner";
import { useTheme } from "@/components/helpers/ThemeContext";
import { PeerDirectoryFiltersAndExport } from "@/components/PeerDirectoryFiltersAndExport";

function shortenPeerId(peerId: string): string {
  if (peerId.length <= 16) return peerId;
  return `${peerId.slice(0, 8)}....${peerId.slice(-8)}`;
}

interface PeerCardProps {
  peer: PeerRow;
}

function PeerCard({ peer, onNavigate }: PeerCardProps & { onNavigate: () => void }) {
  const shortenedId = shortenPeerId(peer.peerId);
  return (
    <div
      onClick={onNavigate}
      className="rounded-2xl border border-burgundy/10 bg-white/95 p-4 text-sm text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white cursor-pointer transition hover:bg-light-grey/60 dark:hover:bg-white/5"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Peer</div>
      <div className="mt-1 font-mono text-xs">
        <HoverableCopyText text={peer.peerId}>
          {shortenedId}
        </HoverableCopyText>
      </div>
      <div className="mt-2 text-xs text-burgundy/70 dark:text-white/70">Version {peer.version}</div>
      <div className="mt-4 text-xs">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-burgundy/50 dark:text-white/50">Pubsub</div>
        {peer.pubsub.length ? peer.pubsub.map((addr) => (
          <div key={addr} className="truncate text-[0.7rem]">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-3 text-xs">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-burgundy/50 dark:text-white/50">Stream</div>
        {peer.stream.length ? peer.stream.map((addr) => (
          <div key={addr} className="truncate text-[0.7rem]">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-4 pt-3 border-t border-burgundy/10 dark:border-white/10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
        >
          <span>View Peer Details</span>
          <Arrow className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Peers() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [peerRows, setPeerRows] = useState<PeerRow[]>([]);
  const [peerRecords, setPeerRecords] = useState<PeerRecord[]>([]);
  const [filteredPeers, setFilteredPeers] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load peers
  useEffect(() => {
    let mounted = true;
    async function loadPeers() {
      setLoading(true);
      setError(null);
      try {
        const records = await explorerApi.getPeers();
        if (mounted) {
          const rows = formatPeerRows(records);
          setPeerRecords(records);
          setPeerRows(rows);
          // Initialize filtered peers with all peers
          setFilteredPeers(rows);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load peers");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadPeers();
    return () => {
      mounted = false;
    };
  }, []);


  // Calculate version distribution with "Other" grouping for versions < 3%
  const { versionDistribution, otherVersions, otherVersionsDetails } = useMemo(() => {
    const versionMap = new Map<string, number>();
    filteredPeers.forEach((peer) => {
      versionMap.set(peer.version, (versionMap.get(peer.version) || 0) + 1);
    });
    const total = filteredPeers.length;
    const allVersions = Array.from(versionMap.entries())
      .map(([version, count]) => ({
        version,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    const threshold = 3; // 3%
    const mainVersions = allVersions.filter(v => v.percentage >= threshold);
    const otherVersionsList = allVersions.filter(v => v.percentage < threshold);

    const otherCount = otherVersionsList.reduce((sum, v) => sum + v.count, 0);
    const otherPercentage = (otherCount / total) * 100;

    const distribution = [...mainVersions];
    if (otherCount > 0) {
      distribution.push({
        version: "Other",
        count: otherCount,
        percentage: otherPercentage,
      });
    }

    return {
      versionDistribution: distribution,
      otherVersions: otherVersionsList.map(v => v.version),
      otherVersionsDetails: otherVersionsList, // Full details with counts for breakdown display
    };
  }, [filteredPeers]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPeers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeers = useMemo(() => {
    return filteredPeers.slice(startIndex, endIndex);
  }, [filteredPeers, startIndex, endIndex]);

  // Reset to page 1 when filters change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPeers.length, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Theme-aware colors
  const isDark = theme === "dark";
  const tooltipBg = isDark ? "rgba(26,15,39,0.98)" : "rgba(255,255,255,0.98)";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.3)" : "rgba(57,31,91,0.3)";
  const tooltipTextColor = isDark ? "#ffffff" : "#391F5B";

  // Get color for a version by index
  const getVersionColor = (index: number) => {
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="40" />
      </div>
    );
  }

  return (
    <PageLayout title="Peers • Quilibrium Explorer">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70"
          >
            ← Back
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
            {error}
          </div>
        )}

        {/* Total Peers Panel */}
        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Peers Overview</h2>
          <div className="rounded-2xl border border-burgundy/10 bg-white/90 p-6 dark:border-white/10 dark:bg-[#211430]">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
              Total Peers
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {peerRows.length.toLocaleString()}
            </div>
            {filteredPeers.length !== peerRows.length && (
              <div className="mt-2 text-sm text-burgundy/70 dark:text-white/70">
                {filteredPeers.length.toLocaleString()} match{filteredPeers.length !== 1 ? "es" : ""} your filters
              </div>
            )}
          </div>
        </section>

        {/* Version Distribution Pie Chart */}
        {versionDistribution.length > 0 && (
          <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
            <h2 className="mb-6 text-2xl font-semibold">Version Distribution</h2>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="md:w-1/2 flex items-center justify-center min-h-[400px]">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={versionDistribution}
                      dataKey="count"
                      nameKey="version"
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
                      {versionDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getVersionColor(index)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: "8px",
                        color: tooltipTextColor,
                        fontSize: "clamp(11px, 2.5vw, 12px)",
                        padding: "8px 12px",
                        boxShadow: isDark
                          ? "0 4px 6px rgba(0, 0, 0, 0.3)"
                          : "0 4px 6px rgba(57, 31, 91, 0.2)",
                      }}
                      itemStyle={{
                        color: tooltipTextColor,
                      }}
                      labelStyle={{
                        color: tooltipTextColor,
                        fontWeight: "600",
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const percentage = props.payload.percentage;
                        if (name === "Other" && otherVersionsDetails.length > 0) {
                          const breakdown = otherVersionsDetails
                            .map(v => `Version ${v.version}: ${v.count} (${v.percentage.toFixed(2)}%)`)
                            .join("\n");
                          return [`${value} peers (${percentage.toFixed(2)}%)`, `Other:\n${breakdown}`];
                        }
                        return [`${value} peers (${percentage.toFixed(2)}%)`, `Version ${name}`];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: isDark ? "#ffffff" : "#391F5B", fontSize: "clamp(11px, 2.5vw, 12px)" }}
                      verticalAlign="bottom"
                      formatter={(value: string) => {
                        if (value === "Other" && otherVersionsDetails.length > 0) {
                          return `Other: ${otherVersionsDetails.map(v => `v${v.version}`).join(", ")}`;
                        }
                        return `Version ${value}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="md:w-1/2 w-full">
                <div className="space-y-2">
                  {versionDistribution.map((entry, index) => (
                    <div
                      key={entry.version}
                      className="flex items-center justify-between p-3 rounded-lg border border-burgundy/10 dark:border-white/10"
                      style={{
                        borderColor: getVersionColor(index),
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded flex-shrink-0"
                          style={{ backgroundColor: getVersionColor(index) }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-burgundy dark:text-white">
                            {entry.version === "Other" ? (
                              <>
                                Other
                              </>
                            ) : (
                              `Version ${entry.version}`
                            )}
                          </div>
                          <div className="text-xs text-burgundy/60 dark:text-white/60">
                            {entry.percentage.toFixed(2)}% of peers
                          </div>
                          {entry.version === "Other" && otherVersionsDetails.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1 border-l-2 border-burgundy/20 dark:border-white/20 pl-3">
                              {otherVersionsDetails.map((v) => (
                                <div key={v.version} className="text-xs text-burgundy/70 dark:text-white/70">
                                  <span className="font-semibold">Version {v.version}:</span> {v.count.toLocaleString()} ({v.percentage.toFixed(2)}%)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-burgundy dark:text-white">
                        {entry.count.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Peer List */}
        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Peer Directory</h2>

          {/* Filters and Export */}
          <div className="mb-6 space-y-3">
            <PeerDirectoryFiltersAndExport
              peerRows={peerRows}
              peerRecords={peerRecords}
              onFilteredPeersChange={setFilteredPeers}
            />
          </div>

          {filteredPeers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-burgundy/70 dark:text-white/70">
                {peerRows.length > 0 ? "No peers match your filters." : "No peers available."}
              </p>
            </div>
          ) : (
            <>
              {/* Items per page selector */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                  Show
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                  per page
                </span>
              </div>

              {/* Mobile/Tablet Card Layout */}
              <div className="space-y-4 md:hidden">
                {paginatedPeers.map((peer) => (
                  <PeerCard
                    key={peer.peerId}
                    peer={peer}
                    onNavigate={() => navigate(`/peers/${peer.peerId}`)}
                  />
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-burgundy/10 text-left text-sm text-burgundy dark:divide-white/10 dark:text-white">
                  <thead className="sticky top-0 z-10 bg-white/95 dark:bg-[#1a0f27]/95 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                    <tr>
                      <th className="py-3 pr-6">Peer ID</th>
                      <th className="py-3 pr-6">Version</th>
                      <th className="py-3 pr-10 text-right">Pubsub addresses</th>
                      <th className="py-3 pr-10 text-right">Stream addresses</th>
                      <th className="py-3 pr-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-burgundy/10 dark:divide-white/10">
                    {paginatedPeers.map((peer) => (
                      <tr
                        key={peer.peerId}
                        onClick={() => navigate(`/peers/${peer.peerId}`)}
                        className="cursor-pointer transition hover:bg-light-grey/60 dark:hover:bg-white/5"
                      >
                        <td className="py-3 pr-6 font-mono text-xs whitespace-nowrap">
                          <HoverableCopyText text={peer.peerId}>{shortenPeerId(peer.peerId)}</HoverableCopyText>
                        </td>
                        <td className="py-3 pr-6 text-xs">{peer.version}</td>
                        <td className="py-3 pr-6 text-xs text-right">
                          {peer.pubsub.length
                            ? peer.pubsub.map((addr) => (
                                <div key={addr} className="break-all md:break-normal md:truncate max-w-xs md:max-w-md">
                                  <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                                </div>
                              ))
                            : "–"}
                        </td>
                        <td className="py-3 pr-6 text-xs text-right">
                          {peer.stream.length
                            ? peer.stream.map((addr) => (
                                <div key={addr} className="break-all md:break-normal md:truncate max-w-xs md:max-w-md">
                                  <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                                </div>
                              ))
                            : "–"}
                        </td>
                        <td className="py-3 pr-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/peers/${peer.peerId}`);
                            }}
                            className="flex items-center gap-2 text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
                          >
                            <span>View Peer Details</span>
                            <Arrow className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                  Showing {startIndex + 1}–{Math.min(endIndex, filteredPeers.length)} of {filteredPeers.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10"
                  >
                    <ChevronDown className="w-3 h-3 rotate-90" />
                    <span>Previous</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-xs text-burgundy/40 dark:text-white/40">
                            ...
                          </span>
                        );
                      }
                      const pageNum = page as number;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-burgundy/20 dark:bg-white/20 text-burgundy dark:text-white'
                              : 'text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white hover:bg-burgundy/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10"
                  >
                    <span>Next</span>
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

