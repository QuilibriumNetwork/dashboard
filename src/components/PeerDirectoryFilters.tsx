import { useState } from "react";
import ChevronDown from "@/components/ui/ChevronDown";

export interface PeerFilterState {
  searchQuery: string;
  selectedVersions: Set<string>;
  selectedPubsubProtocols: Set<"tcp" | "udp">;
  selectedStreamProtocols: Set<"tcp" | "udp">;
  selectedCapabilityCounts: Set<number>;
}

interface PeerDirectoryFiltersProps {
  filters: PeerFilterState;
  onFiltersChange: (filters: PeerFilterState) => void;
  uniqueVersions: string[];
  versionCounts: Map<string, number>;
  uniqueCapabilityCounts: number[];
  capabilityCountCounts: Map<number, number>;
  pubsubProtocolCounts: Map<"tcp" | "udp", number>;
  streamProtocolCounts: Map<"tcp" | "udp", number>;
}

export function PeerDirectoryFilters({
  filters,
  onFiltersChange,
  uniqueVersions,
  versionCounts,
  uniqueCapabilityCounts,
  capabilityCountCounts,
  pubsubProtocolCounts,
  streamProtocolCounts,
}: PeerDirectoryFiltersProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const updateFilter = <K extends keyof PeerFilterState>(
    key: K,
    value: PeerFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: "",
      selectedVersions: new Set(),
      selectedPubsubProtocols: new Set(),
      selectedStreamProtocols: new Set(),
      selectedCapabilityCounts: new Set(),
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedVersions.size > 0 ||
    filters.selectedPubsubProtocols.size > 0 ||
    filters.selectedStreamProtocols.size > 0 ||
    filters.selectedCapabilityCounts.size > 0;

  return (
    <div className="rounded-2xl border border-burgundy/10 bg-white/95 shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95">
      <button
        onClick={() => setFiltersExpanded(!filtersExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-light-grey/30 dark:hover:bg-white/5"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-burgundy/70 dark:text-white/70">
          Filters
        </span>
        <ChevronDown
          className={`w-4 h-4 text-burgundy/60 dark:text-white/60 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {filtersExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-burgundy/10 dark:border-white/10">
          {/* Search by Peer ID or IP */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
              Search by Peer ID or IP Address
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => updateFilter("searchQuery", e.target.value)}
              placeholder="Enter peer ID, IPv4, or IPv6 address..."
              className="w-full border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-4 py-2 text-sm text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
            />
          </div>

          {/* Version Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Version
              </label>
              {uniqueVersions.length > 0 && (
                <button
                  onClick={() => {
                    if (filters.selectedVersions.size === uniqueVersions.length) {
                      updateFilter("selectedVersions", new Set());
                    } else {
                      updateFilter("selectedVersions", new Set(uniqueVersions));
                    }
                  }}
                  className="text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
                >
                  {filters.selectedVersions.size === uniqueVersions.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] rounded-lg p-2">
              {uniqueVersions.length === 0 ? (
                <div className="text-xs text-burgundy/60 dark:text-white/60 py-2 px-2">
                  No versions available
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {uniqueVersions.map((version) => (
                    <label
                      key={version}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.selectedVersions.has(version)}
                        onChange={(e) => {
                          const newSelected = new Set(filters.selectedVersions);
                          if (e.target.checked) {
                            newSelected.add(version);
                          } else {
                            newSelected.delete(version);
                          }
                          updateFilter("selectedVersions", newSelected);
                        }}
                        className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30 flex-shrink-0"
                      />
                      <span className="text-sm text-burgundy dark:text-white whitespace-nowrap">
                        {version} ({versionCounts.get(version) || 0})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Protocol Filters */}
          <div className="space-y-4">
            {/* Pubsub Protocol Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Pubsub Protocol
              </label>
              <div className="flex gap-3">
                {(["tcp", "udp"] as const).map((protocol) => (
                  <label
                    key={protocol}
                    className="flex items-center gap-2 px-3 py-2 rounded border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedPubsubProtocols.has(protocol)}
                      onChange={(e) => {
                        const newSelected = new Set(filters.selectedPubsubProtocols);
                        if (e.target.checked) {
                          newSelected.add(protocol);
                        } else {
                          newSelected.delete(protocol);
                        }
                        updateFilter("selectedPubsubProtocols", newSelected);
                      }}
                      className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                    />
                    <span className="text-sm text-burgundy dark:text-white uppercase">
                      {protocol} ({pubsubProtocolCounts.get(protocol) || 0})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stream Protocol Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Stream Protocol
              </label>
              <div className="flex gap-3">
                {(["tcp", "udp"] as const).map((protocol) => (
                  <label
                    key={protocol}
                    className="flex items-center gap-2 px-3 py-2 rounded border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedStreamProtocols.has(protocol)}
                      onChange={(e) => {
                        const newSelected = new Set(filters.selectedStreamProtocols);
                        if (e.target.checked) {
                          newSelected.add(protocol);
                        } else {
                          newSelected.delete(protocol);
                        }
                        updateFilter("selectedStreamProtocols", newSelected);
                      }}
                      className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                    />
                    <span className="text-sm text-burgundy dark:text-white uppercase">
                      {protocol} ({streamProtocolCounts.get(protocol) || 0})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Capability Count Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                Capability Count
              </label>
              {uniqueCapabilityCounts.length > 0 && (
                <button
                  onClick={() => {
                    if (filters.selectedCapabilityCounts.size === uniqueCapabilityCounts.length) {
                      updateFilter("selectedCapabilityCounts", new Set());
                    } else {
                      updateFilter("selectedCapabilityCounts", new Set(uniqueCapabilityCounts));
                    }
                  }}
                  className="text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
                >
                  {filters.selectedCapabilityCounts.size === uniqueCapabilityCounts.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] rounded-lg p-2 space-y-2">
              {uniqueCapabilityCounts.length === 0 ? (
                <div className="text-xs text-burgundy/60 dark:text-white/60 py-2 px-2">
                  No capability counts available
                </div>
              ) : (
                uniqueCapabilityCounts.map((count) => (
                  <label
                    key={count}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedCapabilityCounts.has(count)}
                      onChange={(e) => {
                        const newSelected = new Set(filters.selectedCapabilityCounts);
                        if (e.target.checked) {
                          newSelected.add(count);
                        } else {
                          newSelected.delete(count);
                        }
                        updateFilter("selectedCapabilityCounts", newSelected);
                      }}
                      className="w-4 h-4 text-burgundy border-burgundy/30 rounded focus:ring-burgundy/30 dark:border-white/30 dark:focus:ring-white/30"
                    />
                    <span className="text-sm text-burgundy dark:text-white">
                      {count} {count === 1 ? "capability" : "capabilities"} ({capabilityCountCounts.get(count) || 0})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

