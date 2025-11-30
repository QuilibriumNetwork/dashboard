import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { usePeerFavorites } from "@/components/helpers/PeerFavoritesContext";
import { explorerApi, type PeerRecord } from "@/lib/api";
import { formatPeerRows, type PeerRow } from "@/lib/peers";
import { truncateMiddle } from "@/lib/format";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import Icon from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import Arrow from "@/components/ui/Arrow";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";

function shortenPeerId(peerId: string): string {
  if (peerId.length <= 16) return peerId;
  return `${peerId.slice(0, 8)}....${peerId.slice(-8)}`;
}

interface FavoritePeerItemProps {
  favorite: { peerId: string; label?: string };
  peerRecord: PeerRecord | null;
  peerRow: PeerRow | null;
  onDelete: (peerId: string) => void;
  onNavigate: (peerId: string) => void;
}

function FavoritePeerItem({ favorite, peerRecord, peerRow, onDelete, onNavigate }: FavoritePeerItemProps) {
  const isSeen = peerRecord !== null;
  const displayLabel = favorite.label || truncateMiddle(favorite.peerId, 20);

  return (
    <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-5 text-sm text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
            {favorite.label ? "Label" : "Peer ID"}
          </div>
          <div className="font-mono text-xs break-all mb-2">
            <HoverableCopyText text={favorite.peerId}>
              <span className="md:hidden">{displayLabel}</span>
              <span className="hidden md:inline">{favorite.peerId}</span>
            </HoverableCopyText>
          </div>
          {favorite.label && (
            <div className="text-xs text-burgundy/60 dark:text-white/60 mb-2">
              <span className="font-semibold uppercase tracking-[0.2em]">Peer ID:</span>{" "}
              <span className="font-mono">
                <span className="md:hidden">{truncateMiddle(favorite.peerId, 20)}</span>
                <span className="hidden md:inline break-all">{favorite.peerId}</span>
              </span>
            </div>
          )}
          {isSeen ? (
            <>
              {peerRow && (
                <>
                  <div className="mt-3 text-xs">
                    <div className="text-[0.65rem] uppercase tracking-[0.3em] text-burgundy/50 dark:text-white/50 mb-1">
                      Pubsub
                    </div>
                    {peerRow.pubsub.length > 0 ? (
                      peerRow.pubsub.slice(0, 2).map((addr) => (
                        <div key={addr} className="truncate text-[0.7rem] mb-1">
                          <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                        </div>
                      ))
                    ) : (
                      <div className="text-[0.7rem] text-burgundy/60 dark:text-white/60">–</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs">
                    <div className="text-[0.65rem] uppercase tracking-[0.3em] text-burgundy/50 dark:text-white/50 mb-1">
                      Stream
                    </div>
                    {peerRow.stream.length > 0 ? (
                      peerRow.stream.slice(0, 2).map((addr) => (
                        <div key={addr} className="truncate text-[0.7rem] mb-1">
                          <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                        </div>
                      ))
                    ) : (
                      <div className="text-[0.7rem] text-burgundy/60 dark:text-white/60">–</div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="mt-3 text-xs text-burgundy/60 dark:text-white/60 italic">
              Peer not seen.
            </div>
          )}
        </div>
        <div className="flex flex-row md:flex-col gap-2 flex-shrink-0 md:mt-0 mt-4 pt-4 md:pt-0 border-t md:border-t-0 border-burgundy/10 dark:border-white/10">
          <button
            onClick={() => onNavigate(favorite.peerId)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10 flex-1 md:flex-none"
            aria-label="View peer"
          >
            <Icon name="visible" className="w-4 h-4 md:w-3 md:h-3" />
            <span className="hidden md:inline">View</span>
            <Arrow className="hidden md:inline w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(favorite.peerId)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors border border-red-600/20 dark:border-red-400/20 rounded-lg hover:bg-red-600/10 dark:hover:bg-red-400/10 flex-1 md:flex-none"
            aria-label="Delete peer"
          >
            <Icon name="recyclebin2" className="w-4 h-4 md:w-3 md:h-3" />
            <span className="hidden md:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PeerFavorites() {
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite } = usePeerFavorites();
  const [peerRecords, setPeerRecords] = useState<PeerRecord[]>([]);
  const [peerRows, setPeerRows] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPeerId, setNewPeerId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmPeerId, setDeleteConfirmPeerId] = useState<string | null>(null);
  const addPeerInputRef = useRef<HTMLInputElement>(null);

  // Load peers
  useEffect(() => {
    let mounted = true;
    async function loadPeers() {
      setLoading(true);
      try {
        const records = await explorerApi.getPeers();
        if (mounted) {
          setPeerRecords(records);
          const rows = formatPeerRows(records);
          setPeerRows(rows);
        }
      } catch (err) {
        console.error("Failed to load peers:", err);
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

  // Create a map of peerId -> PeerRecord and PeerRow for quick lookup
  const peerMap = useMemo(() => {
    const recordMap = new Map<string, PeerRecord>();
    const rowMap = new Map<string, PeerRow>();
    peerRecords.forEach((record) => recordMap.set(record.peer_id, record));
    peerRows.forEach((row) => rowMap.set(row.peerId, row));
    return { records: recordMap, rows: rowMap };
  }, [peerRecords, peerRows]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(favorites.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFavorites = useMemo(() => {
    return favorites.slice(startIndex, endIndex);
  }, [favorites, startIndex, endIndex]);

  // Reset to page 1 when favorites change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [favorites.length, itemsPerPage]);

  // Focus input when add dialog opens
  useEffect(() => {
    if (showAddDialog && addPeerInputRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        addPeerInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showAddDialog]);

  const handleAdd = () => {
    const trimmed = newPeerId.trim();
    if (trimmed) {
      addFavorite(trimmed);
      setNewPeerId("");
      setShowAddDialog(false);
    }
  };

  const handleDelete = (peerId: string) => {
    setDeleteConfirmPeerId(peerId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmPeerId) {
      removeFavorite(deleteConfirmPeerId);
      setDeleteConfirmPeerId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="40" />
      </div>
    );
  }

  return (
    <PageLayout title="Peer Favorites • Quilibrium Explorer">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70">
            ← Back
          </Link>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors bg-transparent hover:bg-transparent"
          >
            <Icon name="applicationadd" className="w-4 h-4" />
            <span>Add Peer</span>
          </button>
        </div>

        <section className="mb-10 rounded-3xl border border-burgundy/10 bg-white/95 p-8 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white">
          <h2 className="text-2xl font-semibold mb-6">Peer Favorites</h2>

          {favorites.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-burgundy/70 dark:text-white/70">
                No favorites yet. Click "Add Peer" to add a peer to your favorites.
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

              {/* Favorites List */}
              <div className="space-y-4">
                {paginatedFavorites.map((favorite) => (
                  <FavoritePeerItem
                    key={favorite.peerId}
                    favorite={favorite}
                    peerRecord={peerMap.records.get(favorite.peerId) || null}
                    peerRow={peerMap.rows.get(favorite.peerId) || null}
                    onDelete={handleDelete}
                    onNavigate={(peerId) => navigate(`/peers/${peerId}`)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                    Showing {startIndex + 1}–{Math.min(endIndex, favorites.length)} of {favorites.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-burgundy/20 dark:bg-white/20 text-burgundy dark:text-white"
                              : "text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white hover:bg-burgundy/10 dark:hover:bg-white/10"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <Modal
          show={showAddDialog}
          onClose={() => {
            setShowAddDialog(false);
            setNewPeerId("");
          }}
          title="Add Peer"
          maxWidth="max-w-md"
          minHeight="min-h-0"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Peer Address
              </label>
              <input
                ref={addPeerInputRef}
                type="text"
                value={newPeerId}
                onChange={(e) => setNewPeerId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  } else if (e.key === "Escape") {
                    setShowAddDialog(false);
                    setNewPeerId("");
                  }
                }}
                placeholder="Enter peer ID (Qm...)"
                className="w-full rounded-lg border border-burgundy/20 bg-white px-3 py-2 text-sm text-burgundy placeholder:text-burgundy/40 focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/20 dark:border-white/20 dark:bg-[#1a0f27] dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/40 dark:focus:ring-white/20"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewPeerId("");
                }}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10"
              >
                Add
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          show={deleteConfirmPeerId !== null}
          onClose={() => setDeleteConfirmPeerId(null)}
          onConfirm={handleConfirmDelete}
          title="Remove Favorite"
          message="Are you sure you want to remove this peer from favorites?"
          confirmText="Remove"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      </div>
    </PageLayout>
  );
}

