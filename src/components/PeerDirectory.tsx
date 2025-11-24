import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HoverableCopyText } from "./HoverableCopyText";
import { type PeerRow } from "@/lib/peers";
import Arrow from "@/components/ui/Arrow";
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
          <div key={addr} className="break-all">
            <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
          </div>
        )) : "–"}
      </div>
      <div className="mt-3 text-xs">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-burgundy/50 dark:text-white/50">Stream</div>
        {peer.stream.length ? peer.stream.map((addr) => (
          <div key={addr} className="break-all">
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
        <p className="text-sm text-burgundy/70 dark:text-white/70">
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
                        <div key={addr} className="break-all">
                          <HoverableCopyText text={addr}>{addr}</HoverableCopyText>
                        </div>
                      ))
                    : "–"}
                </td>
                <td className="py-3 pr-6 text-xs text-right">
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
          Showing {startIndex + 1}–{Math.min(endIndex, peers.length)} of {peers.length}
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
    </div>
  );
}

