import { Button } from "@/components/ui/Button";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { IconX } from "@tabler/icons-react";

export interface FrameFilterState {
  searchQuery: string;
  minFrameNumber: string;
  maxFrameNumber: string;
  minRequests: string;
  maxRequests: string;
}

interface FrameFeedFiltersProps {
  filters: FrameFilterState;
  onFiltersChange: (filters: FrameFilterState) => void;
}

export function FrameFeedFilters({
  filters,
  onFiltersChange,
}: FrameFeedFiltersProps) {
  const updateFilter = <K extends keyof FrameFilterState>(
    key: K,
    value: FrameFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: "",
      minFrameNumber: "",
      maxFrameNumber: "",
      minRequests: "",
      maxRequests: "",
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.minFrameNumber ||
    filters.maxFrameNumber ||
    filters.minRequests ||
    filters.maxRequests;

  return (
    <CollapsiblePanel label="Filters">
      <div className="px-6 pb-6 pt-2 space-y-4">
          {/* Search by Prover or Selector */}
          <div>
            <label className="block form-label mb-2">
              Search by Prover or Selector
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
                placeholder="Enter prover or selector hex..."
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

          {/* Frame Number Range */}
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <label className="block form-label mb-2">
                Min Frame Number
              </label>
              <input
                type="number"
                value={filters.minFrameNumber}
                onChange={(e) => updateFilter("minFrameNumber", e.target.value)}
                placeholder="Min"
                className="w-full border border-default bg-white dark:bg-overlay px-3 py-2 text-sm text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block form-label mb-2">
                Max Frame Number
              </label>
              <input
                type="number"
                value={filters.maxFrameNumber}
                onChange={(e) => updateFilter("maxFrameNumber", e.target.value)}
                placeholder="Max"
                className="w-full border border-default bg-white dark:bg-overlay px-3 py-2 text-sm text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              />
            </div>
          </div>

          {/* Requests Count Range */}
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <label className="block form-label mb-2">
                Min Requests
              </label>
              <input
                type="number"
                value={filters.minRequests}
                onChange={(e) => updateFilter("minRequests", e.target.value)}
                placeholder="Min"
                className="w-full border border-default bg-white dark:bg-overlay px-3 py-2 text-sm text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block form-label mb-2">
                Max Requests
              </label>
              <input
                type="number"
                value={filters.maxRequests}
                onChange={(e) => updateFilter("maxRequests", e.target.value)}
                placeholder="Max"
                className="w-full border border-default bg-white dark:bg-overlay px-3 py-2 text-sm text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="pt-2">
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
    </CollapsiblePanel>
  );
}

