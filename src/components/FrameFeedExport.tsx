import { useState } from "react";
import { Button } from "@/components/ui/Button";
import ChevronDown from "@/components/ui/ChevronDown";
import { Checkbox } from "@/components/ui/Checkbox";
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
    <div className="rounded-2xl border border-default bg-surface-raised overflow-hidden">
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
            Export {filteredFrames.length} frame{filteredFrames.length !== 1 ? "s" : ""} (respects current filters)
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="form-label">
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
                className="text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
              >
                {Object.values(exportOptions).every((v) => v === true) ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors opacity-60 cursor-not-allowed">
                <Checkbox checked={true} onCheckedChange={() => {}} disabled />
                <span className="text-sm text-primary">Frame Number</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportOptions.includeRequests}
                  onCheckedChange={(checked) => updateExportOption("includeRequests", checked)}
                />
                <span className="text-sm text-primary">Requests</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportOptions.includeShardsTouched}
                  onCheckedChange={(checked) => updateExportOption("includeShardsTouched", checked)}
                />
                <span className="text-sm text-primary">Shards Touched</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportOptions.includeProver}
                  onCheckedChange={(checked) => updateExportOption("includeProver", checked)}
                />
                <span className="text-sm text-primary">Prover</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportOptions.includeSelector}
                  onCheckedChange={(checked) => updateExportOption("includeSelector", checked)}
                />
                <span className="text-sm text-primary">Selector</span>
              </label>

              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportOptions.includeTimestamp}
                  onCheckedChange={(checked) => updateExportOption("includeTimestamp", checked)}
                />
                <span className="text-sm text-primary">Timestamp</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="subtle"
              size="small"
              onClick={exportToCSV}
              disabled={filteredFrames.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="subtle"
              size="small"
              onClick={exportToJSON}
              disabled={filteredFrames.length === 0}
            >
              Export JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

