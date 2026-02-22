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
import { formatRelativeTime, formatTimestamp } from "@/lib/format";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import Arrow from "@/components/ui/Arrow";
import { Button } from "@/components/ui/Button";
import ChevronDown from "@/components/ui/ChevronDown";
import Spinner from "@/components/ui/Spinner";
import { useTheme } from "@/components/helpers/ThemeContext";
import { PeerDirectoryFiltersAndExport } from "@/components/PeerDirectoryFiltersAndExport";
import { usePeerFavorites } from "@/components/helpers/PeerFavoritesContext";
import Icon from "@/components/ui/Icons";

function shortenPeerId(peerId: string): string {
  if (peerId.length <= 16) return peerId;
  return `${peerId.slice(0, 8)}....${peerId.slice(-8)}`;
}

interface PeerCardProps {
  peer: PeerRow;
}

function PeerCard({ peer, onNavigate, isFavorite }: PeerCardProps & { onNavigate: () => void; isFavorite: boolean }) {
  const shortenedId = shortenPeerId(peer.peerId);
  return (
    <div
      onClick={onNavigate}
      className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white cursor-pointer transition hover:bg-hover-highlight"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="label-text">Peer</div>
        {isFavorite && (
          <Icon name="starbadge" className="w-4 h-4 text-orange" />
        )}
      </div>
      <div className="mt-1 font-mono text-sm sm:text-xs">
        <HoverableCopyText text={peer.peerId}>
          {shortenedId}
        </HoverableCopyText>
      </div>
      <div className="mt-2 text-sm sm:text-xs text-secondary">Version {peer.version}</div>
      <div className="mt-4 text-sm sm:text-xs">
        <div className="sub-label-text">Pubsub</div>
        {peer.pubsub.length ? peer.pubsub.map((addr) => (
          <div key={addr} className="truncate text-xs">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-3 text-sm sm:text-xs">
        <div className="sub-label-text">Stream</div>
        {peer.stream.length ? peer.stream.map((addr) => (
          <div key={addr} className="truncate text-xs">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-4 pt-3 border-t border-subtle">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className="flex items-center gap-2 text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
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
  const { favorites, isFavorite } = usePeerFavorites();
  const [peerRows, setPeerRows] = useState<PeerRow[]>([]);
  const [peerRecords, setPeerRecords] = useState<PeerRecord[]>([]);
  const [filteredPeers, setFilteredPeers] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [favoritesItemsPerPage, setFavoritesItemsPerPage] = useState(10);

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
            className="text-sm action-text"
          >
            ← Back
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
            {error}
          </div>
        )}

        {/* Total Peers Overview */}
        <section className="mb-10 rounded-3xl border border-subtle bg-surface p-8 text-burgundy shadow-xl dark:text-white">
          <h2 className="mb-6 text-2xl font-semibold">Peers Overview</h2>
          <div className="rounded-2xl border border-subtle bg-white/90 p-6 dark:bg-surface-raised">
            <div className="label-text">
              Total Peers
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {peerRows.length.toLocaleString()}
            </div>
            {filteredPeers.length !== peerRows.length && (
              <div className="mt-2 text-sm text-secondary">
                {filteredPeers.length.toLocaleString()} match{filteredPeers.length !== 1 ? "es" : ""} your filters
              </div>
            )}
          </div>
        </section>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <section className="mb-10 rounded-3xl border border-subtle bg-surface p-8 text-burgundy shadow-xl dark:text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Favorites</h2>
              <Link
                to="/peer-favorites"
                className="text-sm sm:text-xs action-text"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {favorites
                .slice((favoritesPage - 1) * favoritesItemsPerPage, favoritesPage * favoritesItemsPerPage)
                .map((favorite) => {
                  const peerRow = peerRows.find((p) => p.peerId === favorite.peerId);
                  const peerRecord = peerRecords.find((p) => p.peer_id === favorite.peerId);
                  const lastSeenTimestamp = peerRecord?.last_seen
                    ? (peerRecord.last_seen > 1e12
                        ? new Date(peerRecord.last_seen).toISOString()
                        : new Date(peerRecord.last_seen * 1000).toISOString())
                    : null;
                  return (
                    <div
                      key={favorite.peerId}
                      onClick={() => navigate(`/peers/${favorite.peerId}`)}
                      className="flex items-center gap-2 p-2 rounded-lg border border-subtle hover:bg-burgundy/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm sm:text-xs truncate md:truncate-none md:break-words">
                          <HoverableCopyText text={favorite.peerId}>
                            <span className="md:hidden">{favorite.label || shortenPeerId(favorite.peerId)}</span>
                            <span className="hidden md:inline">{favorite.label || favorite.peerId}</span>
                          </HoverableCopyText>
                        </div>
                        {peerRecord ? (
                          <>
                            <div className="text-sm sm:text-xs text-muted">
                              Version {peerRow?.version || peerRecord.version}
                            </div>
                            {lastSeenTimestamp ? (
                              <div className="text-sm sm:text-xs text-muted mt-0.5">
                                Last seen {formatRelativeTime(lastSeenTimestamp)}
                              </div>
                            ) : (
                              <div className="text-sm sm:text-xs text-muted italic mt-0.5">
                                Peer reachability data not found.
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm sm:text-xs text-muted italic">
                            Peer not seen
                          </div>
                        )}
                      </div>
                      {peerRecord && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/peers/${favorite.peerId}`);
                          }}
                          className="flex-shrink-0 p-2.5 rounded-lg border border-default hover:bg-active-highlight transition-colors"
                          aria-label="View peer"
                        >
                          <Icon name="visible" className="w-5 h-5 text-secondary" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
            {favorites.length > favoritesItemsPerPage && (
              <div className="mt-3 flex items-center justify-between text-sm sm:text-xs">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setFavoritesPage(Math.max(1, favoritesPage - 1))}
                  disabled={favoritesPage === 1}
                >
                  ← Prev
                </Button>
                <span className="text-muted">
                  Page {favoritesPage} of {Math.ceil(favorites.length / favoritesItemsPerPage)}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setFavoritesPage(Math.min(Math.ceil(favorites.length / favoritesItemsPerPage), favoritesPage + 1))}
                  disabled={favoritesPage >= Math.ceil(favorites.length / favoritesItemsPerPage)}
                >
                  Next →
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Version Distribution Pie Chart */}
        {versionDistribution.length > 0 && (
          <section className="mb-10 rounded-3xl border border-subtle bg-surface p-8 shadow-xl dark:text-white">
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
                      className="flex items-center justify-between p-3 rounded-lg border border-subtle"
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
                          <div className="text-sm font-semibold text-primary">
                            {entry.version === "Other" ? (
                              <>
                                Other
                              </>
                            ) : (
                              `Version ${entry.version}`
                            )}
                          </div>
                          <div className="text-sm sm:text-xs text-muted">
                            {entry.percentage.toFixed(2)}% of peers
                          </div>
                          {entry.version === "Other" && otherVersionsDetails.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1 border-l-2 border-default pl-3">
                              {otherVersionsDetails.map((v) => (
                                <div key={v.version} className="text-sm sm:text-xs text-secondary">
                                  <span className="font-semibold">Version {v.version}:</span> {v.count.toLocaleString()} ({v.percentage.toFixed(2)}%)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-primary">
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
        <section className="mb-10 rounded-3xl border border-subtle bg-surface p-8 shadow-xl dark:text-white">
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
              <p className="text-sm text-secondary">
                {peerRows.length > 0 ? "No peers match your filters." : "No peers available."}
              </p>
            </div>
          ) : (
            <>
              {/* Items per page selector */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="label-text">
                  Show
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-default bg-white dark:bg-surface px-3 py-1.5 text-sm sm:text-xs font-semibold uppercase tracking-label text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="label-text">
                  per page
                </span>
              </div>

              {/* Mobile/Tablet Card Layout */}
              <div className="space-y-4 md:hidden">
                {paginatedPeers.map((peer) => (
                  <PeerCard
                    key={peer.peerId}
                    peer={peer}
                    isFavorite={isFavorite(peer.peerId)}
                    onNavigate={() => navigate(`/peers/${peer.peerId}`)}
                  />
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
                  <thead className="sticky top-0 z-10 bg-surface-raised label-text">
                    <tr>
                      <th className="py-3 pr-6">Peer ID</th>
                      <th className="py-3 pr-6">Version</th>
                      <th className="py-3 pr-10 text-right">Pubsub addresses</th>
                      <th className="py-3 pr-10 text-right">Stream addresses</th>
                      <th className="py-3 pr-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {paginatedPeers.map((peer) => (
                      <tr
                        key={peer.peerId}
                        onClick={() => navigate(`/peers/${peer.peerId}`)}
                        className="cursor-pointer transition hover:bg-hover-highlight"
                      >
                        <td className="py-3 pr-6 font-mono text-sm sm:text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <HoverableCopyText text={peer.peerId}>{shortenPeerId(peer.peerId)}</HoverableCopyText>
                            {isFavorite(peer.peerId) && (
                              <Icon name="starbadge" className="w-4 h-4 text-orange flex-shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-6 text-sm sm:text-xs">{peer.version}</td>
                        <td className="py-3 pr-6 text-sm sm:text-xs text-right">
                          {peer.pubsub.length
                            ? peer.pubsub.map((addr) => (
                                <div key={addr} className="break-all md:break-normal md:truncate max-w-xs md:max-w-md">
                                  <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                                </div>
                              ))
                            : "–"}
                        </td>
                        <td className="py-3 pr-6 text-sm sm:text-xs text-right">
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
                            className="flex items-center gap-2 text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
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
                <div className="label-text">
                  Showing {startIndex + 1}–{Math.min(endIndex, filteredPeers.length)} of {filteredPeers.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronDown className="w-3 h-3 rotate-90" />
                    <span>Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-sm sm:text-xs text-faint">
                            ...
                          </span>
                        );
                      }
                      const pageNum = page as number;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1.5 text-sm sm:text-xs font-semibold uppercase tracking-label rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-burgundy/20 dark:bg-white/20 text-primary'
                              : 'text-secondary hover:text-primary hover:bg-active-highlight'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    <span>Next</span>
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

