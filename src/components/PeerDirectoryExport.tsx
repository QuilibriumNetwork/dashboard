import { useState } from "react";
import ChevronDown from "@/components/ui/ChevronDown";
import { type PeerRow } from "@/lib/peers";
import { type PeerRecord } from "@/lib/api";
import { formatCapability, getCapabilityLabel } from "@/lib/capabilities";
import { type PeerFilterState } from "./PeerDirectoryFilters";

export interface ExportOptions {
  includeVersion: boolean;
  includePubsubAddress: boolean;
  includeStreamAddress: boolean;
  includeCapabilities: boolean;
  includeReachabilityRecord: boolean;
}

interface PeerDirectoryExportProps {
  filteredPeers: PeerRow[];
  allPeerRecords: PeerRecord[];
  filters: PeerFilterState;
}

export function PeerDirectoryExport({
  filteredPeers,
  allPeerRecords,
  filters,
}: PeerDirectoryExportProps) {
  const [exportExpanded, setExportExpanded] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeVersion: false,
    includePubsubAddress: false,
    includeStreamAddress: false,
    includeCapabilities: false,
    includeReachabilityRecord: false,
  });

  // Create a map of peer_id to PeerRecord for quick lookup
  const peerRecordMap = new Map<string, PeerRecord>();
  allPeerRecords.forEach((record) => {
    peerRecordMap.set(record.peer_id, record);
  });

  const updateExportOption = <K extends keyof ExportOptions>(
    key: K,
    value: boolean
  ) => {
    setExportOptions({ ...exportOptions, [key]: value });
  };

  const generateFilterSuffix = (): string => {
    const parts: string[] = [];

    // Search query
    if (filters.searchQuery.trim()) {
      const sanitized = filters.searchQuery
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .substring(0, 20);
      if (sanitized) {
        parts.push(`filter_search-${sanitized}`);
      }
    }

    // Versions
    if (filters.selectedVersions.size > 0) {
      const versions = Array.from(filters.selectedVersions)
        .map(v => v.replace(/[^a-zA-Z0-9.]/g, "-"))
        .join("-");
      parts.push(`filter_v-${versions}`);
    }

    // Pubsub protocols
    if (filters.selectedPubsubProtocols.size > 0) {
      const protocols = Array.from(filters.selectedPubsubProtocols).sort().join("-");
      parts.push(`filter_pubsub-${protocols}`);
    }

    // Stream protocols
    if (filters.selectedStreamProtocols.size > 0) {
      const protocols = Array.from(filters.selectedStreamProtocols).sort().join("-");
      parts.push(`filter_stream-${protocols}`);
    }

    // Capability counts
    if (filters.selectedCapabilityCounts.size > 0) {
      const counts = Array.from(filters.selectedCapabilityCounts)
        .sort((a, b) => a - b)
        .join("-");
      parts.push(`filter_cap-${counts}`);
    }

    return parts.length > 0 ? `-${parts.join("-")}` : "";
  };

  const exportToCSV = () => {
    const headers: string[] = ["Peer ID"];
    if (exportOptions.includeVersion) headers.push("Version");
    if (exportOptions.includePubsubAddress) headers.push("Pubsub Addresses");
    if (exportOptions.includeStreamAddress) headers.push("Stream Addresses");
    if (exportOptions.includeCapabilities) headers.push("Capabilities");
    if (exportOptions.includeReachabilityRecord) headers.push("Reachability Record");

    const rows: string[][] = [headers];

    filteredPeers.forEach((peer) => {
      const record = peerRecordMap.get(peer.peerId);
      const row: string[] = [peer.peerId];

      if (exportOptions.includeVersion) {
        row.push(peer.version);
      }
      if (exportOptions.includePubsubAddress) {
        row.push(peer.pubsub.join("; "));
      }
      if (exportOptions.includeStreamAddress) {
        row.push(peer.stream.join("; "));
      }
      if (exportOptions.includeCapabilities) {
        if (record?.capabilities && record.capabilities.length > 0) {
          const caps = record.capabilities.map(
            (cap) => formatCapability(cap.protocol_identifier, cap.additional_metadata)
          );
          row.push(caps.join(" | "));
        } else {
          row.push("");
        }
      }
      if (exportOptions.includeReachabilityRecord) {
        if (record?.reachability && record.reachability.length > 0) {
          const reach = record.reachability[0];
          const reachStr = `Filter: ${reach.filter}, Pubsub: ${reach.pubsub_multiaddrs.join("; ")}, Stream: ${reach.stream_multiaddrs.join("; ")}`;
          row.push(reachStr);
        } else {
          row.push("");
        }
      }

      rows.push(row);
    });

    // Convert to CSV format
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
    const filterSuffix = generateFilterSuffix();
    link.setAttribute("download", `peer-directory-export-${dateStr}_${unixTs}${filterSuffix}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const data = filteredPeers.map((peer) => {
      const record = peerRecordMap.get(peer.peerId);
      const exportData: Record<string, unknown> = {
        peerId: peer.peerId,
      };

      if (exportOptions.includeVersion) {
        exportData.version = peer.version;
      }
      if (exportOptions.includePubsubAddress) {
        exportData.pubsubAddresses = peer.pubsub;
      }
      if (exportOptions.includeStreamAddress) {
        exportData.streamAddresses = peer.stream;
      }
      if (exportOptions.includeCapabilities && record?.capabilities) {
        exportData.capabilities = record.capabilities.map((cap) => ({
          ...cap,
          label: getCapabilityLabel(cap.protocol_identifier),
        }));
      }
      if (exportOptions.includeReachabilityRecord && record?.reachability) {
        exportData.reachabilityRecord = record.reachability;
      }

      return exportData;
    });

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "_");
    const unixTs = Math.floor(now.getTime() / 1000);
    const filterSuffix = generateFilterSuffix();
    link.setAttribute("download", `peer-directory-export-${dateStr}_${unixTs}${filterSuffix}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAnyOptionSelected = Object.values(exportOptions).some((v) => v === true);

  return (
    <div className="rounded-2xl border border-subtle bg-surface-raised shadow-sm">
      <button
        onClick={() => setExportExpanded(!exportExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-light-grey/30 dark:hover:bg-white/5"
      >
        <span className="text-sm font-semibold uppercase tracking-label text-secondary">
          Export
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform ${exportExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {exportExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-subtle">
          <div className="text-sm sm:text-xs text-muted">
            Export {filteredPeers.length} peer{filteredPeers.length !== 1 ? "s" : ""} (respects current filters)
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="label-text">
                Include Properties
              </div>
              <button
                onClick={() => {
                  const allSelected = Object.values(exportOptions).every((v) => v === true);
                  setExportOptions({
                    includeVersion: !allSelected,
                    includePubsubAddress: !allSelected,
                    includeStreamAddress: !allSelected,
                    includeCapabilities: !allSelected,
                    includeReachabilityRecord: !allSelected,
                  });
                }}
                className="text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
              >
                {Object.values(exportOptions).every((v) => v === true) ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors opacity-60 cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="w-4 h-4 text-burgundy border-strong rounded focus:ring-brand/30 cursor-not-allowed"
                />
                <span className="text-sm text-primary">Peer ID</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeVersion}
                  onChange={(e) => updateExportOption("includeVersion", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-strong rounded focus:ring-brand/30"
                />
                <span className="text-sm text-primary">Version</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includePubsubAddress}
                  onChange={(e) => updateExportOption("includePubsubAddress", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-strong rounded focus:ring-brand/30"
                />
                <span className="text-sm text-primary">Pubsub Address</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeStreamAddress}
                  onChange={(e) => updateExportOption("includeStreamAddress", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-strong rounded focus:ring-brand/30"
                />
                <span className="text-sm text-primary">Stream Address</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCapabilities}
                  onChange={(e) => updateExportOption("includeCapabilities", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-strong rounded focus:ring-brand/30"
                />
                <span className="text-sm text-primary">Capabilities</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeReachabilityRecord}
                  onChange={(e) => updateExportOption("includeReachabilityRecord", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-strong rounded focus:ring-brand/30"
                />
                <span className="text-sm text-primary">Reachability Record</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={exportToCSV}
              disabled={filteredPeers.length === 0}
              className="flex-1 px-4 py-2 text-sm sm:text-xs action-text border border-default rounded-lg hover:bg-active-highlight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={filteredPeers.length === 0}
              className="flex-1 px-4 py-2 text-sm sm:text-xs action-text border border-default rounded-lg hover:bg-active-highlight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

