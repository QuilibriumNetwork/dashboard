import { useState } from "react";
import ChevronDown from "@/components/ui/ChevronDown";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { IconX } from "@tabler/icons-react";

export interface PeerFilterState {
  searchQuery: string;
  selectedVersions: Set<string>;
  selectedPubsubProtocols: Set<"tcp" | "udp" | "other">;
  selectedStreamProtocols: Set<"tcp" | "udp" | "other">;
  selectedCapabilityCounts: Set<number>;
}

interface PeerDirectoryFiltersProps {
  filters: PeerFilterState;
  onFiltersChange: (filters: PeerFilterState) => void;
  uniqueVersions: string[];
  versionCounts: Map<string, number>;
  uniqueCapabilityCounts: number[];
  capabilityCountCounts: Map<number, number>;
  pubsubProtocolCounts: Map<"tcp" | "udp" | "other", number>;
  streamProtocolCounts: Map<"tcp" | "udp" | "other", number>;
  headerAction?: React.ReactNode;
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
  headerAction,
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
    <div className="rounded-2xl border border-default bg-surface-raised overflow-hidden">
      <button
        onClick={() => setFiltersExpanded(!filtersExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-light-grey/30 dark:hover:bg-white/5"
      >
        <span className="text-sm font-semibold uppercase tracking-label text-secondary">
          Filters
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {filtersExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-subtle">
          {/* Search by Peer ID or IP */}
          <div>
            <label className="block form-label mb-2">
              Search by Peer ID or IP Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
                placeholder="Enter peer ID, IPv4, or IPv6 address..."
                className="w-full border border-default bg-white dark:bg-overlay px-4 py-2 pr-10 text-sm text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => updateFilter("searchQuery", "")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-burgundy/60 hover:text-primary/60 dark:hover:text-white transition-colors rounded hover:bg-active-highlight"
                  aria-label="Clear search"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Version Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block form-label">
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
                  className="text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
                >
                  {filters.selectedVersions.size === uniqueVersions.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto border border-default bg-white dark:bg-overlay rounded-lg p-2">
              {uniqueVersions.length === 0 ? (
                <div className="text-sm sm:text-xs text-muted py-2 px-2">
                  No versions available
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {uniqueVersions.map((version) => (
                    <label
                      key={version}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={filters.selectedVersions.has(version)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(filters.selectedVersions);
                          if (checked) {
                            newSelected.add(version);
                          } else {
                            newSelected.delete(version);
                          }
                          updateFilter("selectedVersions", newSelected);
                        }}
                      />
                      <span className="text-sm text-primary whitespace-nowrap">
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
              <label className="block form-label mb-2">
                Pubsub Protocol
              </label>
              <div className="flex gap-3">
                {(["tcp", "udp", "other"] as const).map((protocol) => (
                  <label
                    key={protocol}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-default bg-white dark:bg-overlay hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedPubsubProtocols.has(protocol)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(filters.selectedPubsubProtocols);
                        if (checked) {
                          newSelected.add(protocol);
                        } else {
                          newSelected.delete(protocol);
                        }
                        updateFilter("selectedPubsubProtocols", newSelected);
                      }}
                    />
                    <span className={`text-sm text-primary ${protocol === "other" ? "" : "uppercase"}`}>
                      {protocol === "other" ? "No Address" : protocol.toUpperCase()} ({pubsubProtocolCounts.get(protocol) || 0})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stream Protocol Filter */}
            <div>
              <label className="block form-label mb-2">
                Stream Protocol
              </label>
              <div className="flex gap-3">
                {(["tcp", "udp", "other"] as const).map((protocol) => (
                  <label
                    key={protocol}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-default bg-white dark:bg-overlay hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedStreamProtocols.has(protocol)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(filters.selectedStreamProtocols);
                        if (checked) {
                          newSelected.add(protocol);
                        } else {
                          newSelected.delete(protocol);
                        }
                        updateFilter("selectedStreamProtocols", newSelected);
                      }}
                    />
                    <span className={`text-sm text-primary ${protocol === "other" ? "" : "uppercase"}`}>
                      {protocol === "other" ? "No Address" : protocol.toUpperCase()} ({streamProtocolCounts.get(protocol) || 0})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Capability Count Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block form-label">
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
                  className="text-sm sm:text-xs font-semibold text-secondary hover:text-primary transition-colors"
                >
                  {filters.selectedCapabilityCounts.size === uniqueCapabilityCounts.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto border border-default bg-white dark:bg-overlay rounded-lg p-2 space-y-2">
              {uniqueCapabilityCounts.length === 0 ? (
                <div className="text-sm sm:text-xs text-muted py-2 px-2">
                  No capability counts available
                </div>
              ) : (
                uniqueCapabilityCounts.map((count) => (
                  <label
                    key={count}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-light-grey/30 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedCapabilityCounts.has(count)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(filters.selectedCapabilityCounts);
                        if (checked) {
                          newSelected.add(count);
                        } else {
                          newSelected.delete(count);
                        }
                        updateFilter("selectedCapabilityCounts", newSelected);
                      }}
                    />
                    <span className="text-sm text-primary">
                      {count} {count === 1 ? "capability" : "capabilities"} ({capabilityCountCounts.get(count) || 0})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Filter Actions */}
          {hasActiveFilters && (
            <div className="pt-2 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
              {headerAction}
              <Button
                onClick={clearAllFilters}
                variant="danger"
                size="small"
                rounded="lg"
                className="gap-1.5"
              >
                <IconX className="w-3.5 h-3.5" />
                <span>Clear all filters</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

