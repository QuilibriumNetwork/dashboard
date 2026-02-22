import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { usePeerFavorites } from "@/components/helpers/PeerFavoritesContext";
import { explorerApi, type PeerRecord } from "@/lib/api";
import { formatPeerRows, type PeerRow } from "@/lib/peers";
import { truncateMiddle, formatTimestamp, formatRelativeTime } from "@/lib/format";
import { HoverableCopyText } from "@/components/HoverableCopyText";
import Icon from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import Arrow from "@/components/ui/Arrow";
import { Button } from "@/components/ui/Button";
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
  onEdit: (peerId: string) => void;
}

function FavoritePeerItem({ favorite, peerRecord, peerRow, onDelete, onNavigate, onEdit }: FavoritePeerItemProps) {
  const isSeen = peerRecord !== null;
  const hasLabel = Boolean(favorite.label);

  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-5 text-sm text-burgundy dark:text-white">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {hasLabel ? (
            <>
              <div className="text-sm font-semibold mb-2 break-words">
                {favorite.label}
              </div>
              <div className="label-text mb-1">
                Peer ID
              </div>
              <div className="font-mono text-sm sm:text-xs break-all mb-2">
                <HoverableCopyText text={favorite.peerId}>
                  <span className="md:hidden">{truncateMiddle(favorite.peerId, 20)}</span>
                  <span className="hidden md:inline break-all">{favorite.peerId}</span>
                </HoverableCopyText>
              </div>
            </>
          ) : (
            <>
              <div className="label-text mb-2">
                Peer ID
              </div>
              <div className="font-mono text-sm sm:text-xs break-all mb-2">
                <HoverableCopyText text={favorite.peerId}>
                  <span className="md:hidden">{truncateMiddle(favorite.peerId, 20)}</span>
                  <span className="hidden md:inline">{favorite.peerId}</span>
                </HoverableCopyText>
              </div>
            </>
          )}
          {isSeen ? (
            <>
              {peerRow && (
                <>
                  <div className="mt-3 text-sm sm:text-xs">
                    <div className="sub-label-text mb-1">
                      Version
                    </div>
                    <div className="text-xs mb-2">{peerRow.version}</div>
                  </div>
                  {peerRecord && peerRecord.last_seen && (() => {
                    const timestamp = peerRecord.last_seen > 1e12 ? peerRecord.last_seen : peerRecord.last_seen * 1000;
                    const isoString = new Date(timestamp).toISOString();
                    return (
                      <div className="mt-2 text-sm sm:text-xs">
                        <div className="sub-label-text mb-1">
                          Last Seen
                        </div>
                        <div className="text-xs mb-2">
                          {formatTimestamp(isoString)} ({formatRelativeTime(isoString)})
                        </div>
                      </div>
                    );
                  })()}
                  <div className="mt-2 text-sm sm:text-xs">
                    <div className="sub-label-text mb-1">
                      Pubsub
                    </div>
                    {peerRow.pubsub.length > 0 ? (
                      peerRow.pubsub.slice(0, 2).map((addr) => (
                        <div key={addr} className="truncate text-xs mb-1">
                          <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted">–</div>
                    )}
                  </div>
                  <div className="mt-2 text-sm sm:text-xs">
                    <div className="sub-label-text mb-1">
                      Stream
                    </div>
                    {peerRow.stream.length > 0 ? (
                      peerRow.stream.slice(0, 2).map((addr) => (
                        <div key={addr} className="truncate text-xs mb-1">
                          <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted">–</div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="mt-3 text-sm sm:text-xs text-muted italic">
              Peer not seen.
            </div>
          )}
        </div>
        <div className="flex flex-row md:flex-col gap-2 flex-shrink-0 md:mt-0 mt-4 pt-4 md:pt-0 border-t md:border-t-0 border-subtle">
          {isSeen && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onNavigate(favorite.peerId)}
              className="flex-1 md:flex-none gap-1"
              aria-label="View peer"
            >
              <Icon name="visible" className="w-4 h-4 md:w-3 md:h-3" />
              <span className="hidden md:inline">View</span>
              <Arrow className="hidden md:inline w-3 h-3" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onEdit(favorite.peerId)}
            className="flex-1 md:flex-none gap-1"
            aria-label="Edit peer"
          >
            <Icon name="pen1" className="w-4 h-4 md:w-3 md:h-3" />
            <span className="hidden md:inline">Edit</span>
          </Button>
          <Button
            variant="danger"
            size="xs"
            onClick={() => onDelete(favorite.peerId)}
            className="flex-1 md:flex-none gap-1"
            aria-label="Delete peer"
          >
            <Icon name="recyclebin2" className="w-4 h-4 md:w-3 md:h-3" />
            <span className="hidden md:inline">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PeerFavorites() {
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite, updateFavorite } = usePeerFavorites();
  const [peerRecords, setPeerRecords] = useState<PeerRecord[]>([]);
  const [peerRows, setPeerRows] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPeerId, setNewPeerId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editPeerId, setEditPeerId] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [originalPeerId, setOriginalPeerId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmPeerId, setDeleteConfirmPeerId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [addValidationError, setAddValidationError] = useState<string | null>(null);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);
  const addPeerInputRef = useRef<HTMLInputElement>(null);
  const editPeerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when edit dialog opens
  useEffect(() => {
    if (showEditDialog && editPeerInputRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        editPeerInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showEditDialog]);

  const validatePeerId = (peerId: string): string | null => {
    const trimmed = peerId.trim();
    if (!trimmed) {
      return "Peer address is required";
    }
    // Check if it starts with Qm (IPFS CIDv0 format)
    if (!trimmed.startsWith("Qm")) {
      return "Peer address must start with 'Qm'";
    }
    // Check if it looks like a valid peer ID (Qm format)
    // Peer IDs are typically base58 encoded and start with Qm (IPFS CIDv0)
    // They should be at least 10 characters and contain only base58 characters
    const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (trimmed.length < 10) {
      return "Peer address is too short";
    }
    if (!base58Pattern.test(trimmed)) {
      return "Invalid peer address format";
    }
    return null;
  };

  const handleAdd = () => {
    const validationError = validatePeerId(newPeerId);
    if (validationError) {
      setAddValidationError(validationError);
      return;
    }

    setAddValidationError(null);
    const trimmed = newPeerId.trim();
    const trimmedLabel = newLabel.trim();
    addFavorite(trimmed, trimmedLabel || undefined);
    setNewPeerId("");
    setNewLabel("");
    setShowAddDialog(false);
  };

  const handleEdit = (peerId: string) => {
    const favorite = favorites.find((f) => f.peerId === peerId);
    if (favorite) {
      setOriginalPeerId(peerId);
      setEditPeerId(peerId);
      setEditLabel(favorite.label || "");
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = () => {
    const validationError = validatePeerId(editPeerId);
    if (validationError) {
      setEditValidationError(validationError);
      return;
    }

    setEditValidationError(null);
    const trimmedPeerId = editPeerId.trim();
    const trimmedLabel = editLabel.trim();

    if (trimmedPeerId !== originalPeerId) {
      // Peer ID changed - check if new peer ID already exists
      if (favorites.some((f) => f.peerId === trimmedPeerId)) {
        // Peer ID already exists, don't allow duplicate
        setEditValidationError("This peer address is already in your favorites");
        return;
      }
      // Remove old and add new
      removeFavorite(originalPeerId);
      addFavorite(trimmedPeerId, trimmedLabel || undefined);
    } else {
      // Only label changed (or no change)
      updateFavorite(originalPeerId, trimmedLabel || undefined);
    }

    setEditPeerId("");
    setEditLabel("");
    setOriginalPeerId("");
    setShowEditDialog(false);
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

  const handleExportCSV = () => {
    const headers = ["Peer ID", "Label"];
    const rows: string[][] = [headers];

    favorites.forEach((favorite) => {
      rows.push([favorite.peerId, favorite.label || ""]);
    });

    // Convert to CSV format with proper escaping
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const escaped = cell.replace(/"/g, '""');
            if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(",")
      )
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "_");
    const unixTs = Math.floor(now.getTime() / 1000);
    link.setAttribute("download", `peer-favorites-export-${dateStr}_${unixTs}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        setImportError("CSV file is empty");
        return;
      }

      // Parse CSV (simple parser - handles quoted fields)
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      // Skip header row if it exists
      const startIndex = lines[0].toLowerCase().includes("peer id") ? 1 : 0;
      let importedCount = 0;
      let skippedCount = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i]);
        const peerId = columns[0]?.trim();
        const label = columns[1]?.trim() || undefined;

        if (peerId) {
          // Check if already exists
          const exists = favorites.some((f) => f.peerId === peerId);
          if (!exists) {
            addFavorite(peerId, label);
            importedCount++;
          } else {
            skippedCount++;
          }
        }
      }

      if (importedCount === 0 && skippedCount === 0) {
        setImportError("No valid peer IDs found in CSV file");
      } else {
        setImportSuccess(importedCount);
        if (skippedCount > 0) {
          setImportError(`${skippedCount} peer(s) were skipped (already in favorites)`);
        }
      }

      // Auto-dismiss messages after 5 seconds
      setTimeout(() => {
        setImportSuccess(null);
        setImportError(null);
      }, 5000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to parse CSV file");
      setTimeout(() => {
        setImportError(null);
      }, 5000);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          <Link to="/" className="text-sm action-text">
            ← Back
          </Link>
          <div className="flex items-center gap-4">
            {/* Import/Export buttons - hidden on mobile, shown on desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="small"
                onClick={handleExportCSV}
                disabled={favorites.length === 0}
                className="gap-2"
                aria-label="Export favorites to CSV"
              >
                <Icon name="downloadsquare" className="w-4 h-4" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={handleImportClick}
                className="gap-2"
                aria-label="Import favorites from CSV"
              >
                <Icon name="arrowuplarge2" className="w-4 h-4" />
                <span>Import CSV</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import CSV file"
            />
            <Button
              variant="ghost"
              size="small"
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
            >
              <Icon name="applicationadd" className="w-4 h-4" />
              <span>Add Peer</span>
            </Button>
          </div>
        </div>

        {/* Import/Export Messages */}
        {(importError || importSuccess !== null) && (
          <div className="mb-4 rounded-lg border border-default bg-surface p-4 text-sm">
            {importSuccess !== null && (
              <div className="text-success font-semibold">
                Successfully imported {importSuccess} peer{importSuccess !== 1 ? "s" : ""}.
              </div>
            )}
            {importError && (
              <div className={`${importSuccess !== null ? "mt-2 text-warning" : "text-danger"}`}>
                {importError}
              </div>
            )}
          </div>
        )}

        <section className="mb-10 rounded-3xl border border-subtle bg-surface p-8 text-burgundy shadow-xl dark:text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Peer Favorites</h2>
            {/* Import/Export buttons - shown on mobile, hidden on desktop */}
            <div className="flex md:hidden items-center gap-4">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleExportCSV}
                disabled={favorites.length === 0}
                className="gap-1.5"
                aria-label="Export favorites to CSV"
              >
                <Icon name="downloadsquare" className="w-3.5 h-3.5" />
                <span>Export</span>
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleImportClick}
                className="gap-1.5"
                aria-label="Import favorites from CSV"
              >
                <Icon name="arrowuplarge2" className="w-3.5 h-3.5" />
                <span>Import</span>
              </Button>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-secondary">
                No favorites yet. Click "Add Peer" to add a peer to your favorites.
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
                  className="border border-default bg-white dark:bg-overlay px-3 py-1.5 text-sm sm:text-xs font-semibold uppercase tracking-label text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
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
                    onEdit={handleEdit}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div className="label-text">
                    Showing {startIndex + 1}–{Math.min(endIndex, favorites.length)} of {favorites.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm sm:text-xs font-semibold uppercase tracking-label rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-burgundy/20 dark:bg-white/20 text-primary"
                              : "text-secondary hover:text-primary hover:bg-active-highlight"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
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
            setNewLabel("");
            setAddValidationError(null);
          }}
          title="Add Peer"
          maxWidth="max-w-md"
          minHeight="min-h-0"
        >
          <div className="space-y-6">
            <div>
              <label className="block label-text mb-2">
                Peer Address
              </label>
              <input
                ref={addPeerInputRef}
                type="text"
                value={newPeerId}
                onChange={(e) => {
                  setNewPeerId(e.target.value);
                  setAddValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  } else if (e.key === "Escape") {
                    setShowAddDialog(false);
                    setNewPeerId("");
                    setNewLabel("");
                    setAddValidationError(null);
                  }
                }}
                placeholder="Enter peer ID (Qm...)"
                className={`w-full rounded-lg border border-default bg-white dark:bg-overlay px-3 py-2 text-sm text-burgundy placeholder:text-burgundy/40 focus:outline-none focus:border-strong focus:ring-2 focus:ring-brand/20 dark:text-white dark:placeholder:text-white/40 ${
                  addValidationError ? "outline outline-2 outline-danger outline-offset-0" : ""
                }`}
                autoFocus
              />
              {addValidationError && (
                <p className="mt-1 text-sm sm:text-xs text-danger">{addValidationError}</p>
              )}
            </div>
            <div>
              <label className="block label-text mb-2">
                Label <span className="text-faint font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  } else if (e.key === "Escape") {
                    setShowAddDialog(false);
                    setNewPeerId("");
                    setNewLabel("");
                    setAddValidationError(null);
                  }
                }}
                placeholder="Enter a label for this peer"
                className="w-full rounded-lg border border-default bg-white px-3 py-2 text-sm text-burgundy placeholder:text-burgundy/40 focus:border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 dark:bg-overlay dark:text-white dark:placeholder:text-white/40"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewPeerId("");
                  setNewLabel("");
                  setAddValidationError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="burgundy"
                size="small"
                onClick={handleAdd}
              >
                Add
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          show={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditPeerId("");
            setEditLabel("");
            setOriginalPeerId("");
            setEditValidationError(null);
          }}
          title="Edit Peer"
          maxWidth="max-w-md"
          minHeight="min-h-0"
        >
          <div className="space-y-6">
            <div>
              <label className="block label-text mb-2">
                Peer Address
              </label>
              <input
                ref={editPeerInputRef}
                type="text"
                value={editPeerId}
                onChange={(e) => {
                  setEditPeerId(e.target.value);
                  setEditValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    setShowEditDialog(false);
                    setEditPeerId("");
                    setEditLabel("");
                    setOriginalPeerId("");
                    setEditValidationError(null);
                  }
                }}
                placeholder="Enter peer ID (Qm...)"
                className={`w-full rounded-lg border border-default bg-white dark:bg-overlay px-3 py-2 text-sm text-burgundy placeholder:text-burgundy/40 focus:outline-none focus:border-strong focus:ring-2 focus:ring-brand/20 dark:text-white dark:placeholder:text-white/40 ${
                  editValidationError ? "outline outline-2 outline-danger outline-offset-0" : ""
                }`}
                autoFocus
              />
              {editValidationError && (
                <p className="mt-1 text-sm sm:text-xs text-danger">{editValidationError}</p>
              )}
            </div>
            <div>
              <label className="block label-text mb-2">
                Label <span className="text-faint font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    setShowEditDialog(false);
                    setEditPeerId("");
                    setEditLabel("");
                    setOriginalPeerId("");
                  }
                }}
                placeholder="Enter a label for this peer"
                className="w-full rounded-lg border border-default bg-white px-3 py-2 text-sm text-burgundy placeholder:text-burgundy/40 focus:border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 dark:bg-overlay dark:text-white dark:placeholder:text-white/40"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditPeerId("");
                  setEditLabel("");
                  setOriginalPeerId("");
                  setEditValidationError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="burgundy"
                size="small"
                onClick={handleSaveEdit}
              >
                Save
              </Button>
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

