import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HoverableCopyText } from "./HoverableCopyText";
import { type PeerRow } from "@/lib/peers";
import Arrow from "@/components/ui/Arrow";
import { Button } from "@/components/ui/Button";
import ChevronDown from "@/components/ui/ChevronDown";

function shortenPeerId(peerId: string): string {
  if (peerId.length <= 16) return peerId;
  // Show first 8 chars and last 8 chars for a compact display
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
      className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white cursor-pointer transition hover:bg-hover-highlight"
    >
      <div className="label-text">Peer</div>
      <div className="mt-1 font-mono text-sm sm:text-xs">
        <HoverableCopyText text={peer.peerId}>
          {shortenedId}
        </HoverableCopyText>
      </div>
      <div className="mt-2 text-sm sm:text-xs text-secondary">Version {peer.version}</div>
      <div className="mt-4 text-sm sm:text-xs">
        <div className="text-sm sm:text-xs font-medium text-muted">Pubsub</div>
        {peer.pubsub.length ? peer.pubsub.map((addr) => (
          <div key={addr} className="break-all">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-3 text-sm sm:text-xs">
        <div className="text-sm sm:text-xs font-medium text-muted">Stream</div>
        {peer.stream.length ? peer.stream.map((addr) => (
          <div key={addr} className="break-all">
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

interface PeerDirectoryProps {
  peers: PeerRow[];
}

export function PeerDirectory({ peers }: PeerDirectoryProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.max(1, Math.ceil(peers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeers = useMemo(() => {
    return peers.slice(startIndex, endIndex);
  }, [peers, startIndex, endIndex]);

  // Reset to page 1 when filters change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [peers.length, itemsPerPage]);

  if (peers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-secondary">
          No peers match the current filters.
        </p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Items per page selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm sm:text-xs text-muted">
          Show
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-default bg-white dark:bg-overlay px-3 py-1.5 text-sm sm:text-xs font-semibold text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm sm:text-xs text-muted">
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
        <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
          <thead className="sticky top-0 z-10 bg-surface label-text">
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
                  <HoverableCopyText text={peer.peerId}>{shortenPeerId(peer.peerId)}</HoverableCopyText>
                </td>
                <td className="py-3 pr-6 text-sm sm:text-xs">{peer.version}</td>
                <td className="py-3 pr-6 text-sm sm:text-xs text-right">
                  {peer.pubsub.length
                    ? peer.pubsub.map((addr) => (
                        <div key={addr} className="break-all">
                          <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                        </div>
                      ))
                    : "–"}
                </td>
                <td className="py-3 pr-6 text-sm sm:text-xs text-right">
                  {peer.stream.length
                    ? peer.stream.map((addr) => (
                        <div key={addr} className="break-all">
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
        <div className="text-sm sm:text-xs text-muted">
          Showing {startIndex + 1}–{Math.min(endIndex, peers.length)} of {peers.length}
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
                  className={`px-3 py-1.5 text-sm sm:text-xs font-semibold rounded-lg transition-colors ${
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
    </div>
  );
}

