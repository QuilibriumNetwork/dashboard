import { useState } from "react";
import ChevronDown from "@/components/ui/ChevronDown";
import { type FrameFilterState } from "./FrameFeedFilters";
import { base64ToHex, base64ToIPFSCID } from "@/lib/format";

export interface FrameExportOptions {
  includeRequests: boolean;
  includeProver: boolean;
  includeSelector: boolean;
  includeTimestamp: boolean;
  includeShardsTouched: boolean;
}

interface FrameFeedExportProps {
  filteredFrames: Array<{
    frameNumber: number;
    requests: number;
    shardsTouched: number;
    prover: string;
    selector: string;
    timestamp: string;
    timestampNum: number;
  }>;
  filters: FrameFilterState;
}

export function FrameFeedExport({
  filteredFrames,
  filters,
}: FrameFeedExportProps) {
  const [exportExpanded, setExportExpanded] = useState(false);
  const [exportOptions, setExportOptions] = useState<FrameExportOptions>({
    includeRequests: false,
    includeProver: false,
    includeSelector: false,
    includeTimestamp: false,
    includeShardsTouched: false,
  });

  const updateExportOption = <K extends keyof FrameExportOptions>(
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

    // Frame number range
    if (filters.minFrameNumber) {
      parts.push(`filter_min_frame-${filters.minFrameNumber}`);
    }
    if (filters.maxFrameNumber) {
      parts.push(`filter_max_frame-${filters.maxFrameNumber}`);
    }

    // Requests range
    if (filters.minRequests) {
      parts.push(`filter_min_requests-${filters.minRequests}`);
    }
    if (filters.maxRequests) {
      parts.push(`filter_max_requests-${filters.maxRequests}`);
    }

    return parts.length > 0 ? `-${parts.join("-")}` : "";
  };

  const exportToCSV = async () => {
    const headers: string[] = ["Frame Number"];
    if (exportOptions.includeRequests) headers.push("Requests");
    if (exportOptions.includeShardsTouched) headers.push("Shards Touched");
    if (exportOptions.includeProver) {
      headers.push("Prover (Base64)");
      headers.push("Prover (Hex)");
      headers.push("Prover (IPFS CID)");
    }
    if (exportOptions.includeSelector) {
      headers.push("Selector (Base64)");
      headers.push("Selector (Hex)");
      headers.push("Selector (IPFS CID)");
    }
    if (exportOptions.includeTimestamp) headers.push("Timestamp");

    const rows: string[][] = [headers];

    // Pre-compute all CIDs
    const cidPromises = filteredFrames.map(async (frame) => {
      const proverCID = exportOptions.includeProver ? await base64ToIPFSCID(frame.prover) : null;
      const selectorCID = exportOptions.includeSelector ? await base64ToIPFSCID(frame.selector) : null;
      return { proverCID, selectorCID };
    });
    const cids = await Promise.all(cidPromises);

    filteredFrames.forEach((frame, index) => {
      const row: string[] = [frame.frameNumber.toString()];

      if (exportOptions.includeRequests) {
        row.push(frame.requests.toString());
      }
      if (exportOptions.includeShardsTouched) {
        row.push(frame.shardsTouched.toString());
      }
      if (exportOptions.includeProver) {
        row.push(frame.prover);
        const proverHex = base64ToHex(frame.prover);
        row.push(proverHex ? `0x${proverHex}` : "");
        row.push(cids[index].proverCID ?? "");
      }
      if (exportOptions.includeSelector) {
        row.push(frame.selector);
        const selectorHex = base64ToHex(frame.selector);
        row.push(selectorHex ? `0x${selectorHex}` : "");
        row.push(cids[index].selectorCID ?? "");
      }
      if (exportOptions.includeTimestamp) {
        row.push(new Date(frame.timestampNum * 1000).toISOString());
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
    link.setAttribute("download", `frame-feed-export-${dateStr}_${unixTs}${filterSuffix}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = async () => {
    // Pre-compute all CIDs
    const cidPromises = filteredFrames.map(async (frame) => {
      const proverCID = exportOptions.includeProver ? await base64ToIPFSCID(frame.prover) : null;
      const selectorCID = exportOptions.includeSelector ? await base64ToIPFSCID(frame.selector) : null;
      return { proverCID, selectorCID };
    });
    const cids = await Promise.all(cidPromises);

    const data = filteredFrames.map((frame, index) => {
      const exportData: Record<string, unknown> = {
        frameNumber: frame.frameNumber,
      };

      if (exportOptions.includeRequests) {
        exportData.requests = frame.requests;
      }
      if (exportOptions.includeShardsTouched) {
        exportData.shardsTouched = frame.shardsTouched;
      }
      if (exportOptions.includeProver) {
        exportData.prover = frame.prover;
        const proverHex = base64ToHex(frame.prover);
        exportData.proverHex = proverHex ? `0x${proverHex}` : null;
        exportData.proverIPFSCID = cids[index].proverCID;
      }
      if (exportOptions.includeSelector) {
        exportData.selector = frame.selector;
        const selectorHex = base64ToHex(frame.selector);
        exportData.selectorHex = selectorHex ? `0x${selectorHex}` : null;
        exportData.selectorIPFSCID = cids[index].selectorCID;
      }
      if (exportOptions.includeTimestamp) {
        exportData.timestamp = frame.timestamp;
        exportData.timestampNum = frame.timestampNum;
        exportData.timestampISO = new Date(frame.timestampNum * 1000).toISOString();
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
    link.setAttribute("download", `frame-feed-export-${dateStr}_${unixTs}${filterSuffix}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-burgundy/10 bg-white/95 shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95">
      <button
        onClick={() => setExportExpanded(!exportExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-light-grey/30 dark:hover:bg-white/5"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 dark:text-white/70">
          Export
        </span>
        <ChevronDown
          className={`w-4 h-4 text-burgundy/60 dark:text-white/60 transition-transform ${exportExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {exportExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-burgundy/10 dark:border-white/10">
          <div className="text-xs text-burgundy/60 dark:text-white/60">
            Export {filteredFrames.length} frame{filteredFrames.length !== 1 ? "s" : ""} (respects current filters)
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Include Properties
              </div>
              <button
                onClick={() => {
                  const allSelected = Object.values(exportOptions).every((v) => v === true);
                  setExportOptions({
                    includeRequests: !allSelected,
                    includeShardsTouched: !allSelected,
                    includeProver: !allSelected,
                    includeSelector: !allSelected,
                    includeTimestamp: !allSelected,
                  });
                }}
                className="text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
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
                  className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30 cursor-not-allowed"
                />
                <span className="text-sm text-burgundy dark:text-white">Frame Number</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeRequests}
                  onChange={(e) => updateExportOption("includeRequests", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                />
                <span className="text-sm text-burgundy dark:text-white">Requests</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeShardsTouched}
                  onChange={(e) => updateExportOption("includeShardsTouched", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                />
                <span className="text-sm text-burgundy dark:text-white">Shards Touched</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeProver}
                  onChange={(e) => updateExportOption("includeProver", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                />
                <span className="text-sm text-burgundy dark:text-white">Prover</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSelector}
                  onChange={(e) => updateExportOption("includeSelector", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                />
                <span className="text-sm text-burgundy dark:text-white">Selector</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTimestamp}
                  onChange={(e) => updateExportOption("includeTimestamp", e.target.checked)}
                  className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                />
                <span className="text-sm text-burgundy dark:text-white">Timestamp</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={exportToCSV}
              disabled={filteredFrames.length === 0}
              className="flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={filteredFrames.length === 0}
              className="flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

