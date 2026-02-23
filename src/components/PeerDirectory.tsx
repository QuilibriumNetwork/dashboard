import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HoverableCopyText } from "./HoverableCopyText";
import { type PeerRow } from "@/lib/peers";
import Arrow from "@/components/ui/Arrow";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";

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


  return (
    <div className="space-y-6">
      {/* Items per page selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm sm:text-xs text-muted">
          Show
        </span>
        <Select
          value={String(itemsPerPage)}
          onValueChange={(val) => {
            setItemsPerPage(Number(val));
            setCurrentPage(1);
          }}
          options={[
            { value: "10", label: "10" },
            { value: "25", label: "25" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
        />
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

