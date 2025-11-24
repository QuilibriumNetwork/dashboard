import { useState } from "react";
import ChevronDown from "@/components/ui/ChevronDown";

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
          {/* Search by Prover or Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
              Search by Prover or Selector
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
                placeholder="Enter prover or selector hex..."
                className="w-full border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-4 py-2 pr-10 text-sm text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => updateFilter("searchQuery", "")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-burgundy/60 hover:text-burgundy dark:text-white/60 dark:hover:text-white transition-colors rounded hover:bg-burgundy/10 dark:hover:bg-white/10"
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
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Min Frame Number
              </label>
              <input
                type="number"
                value={filters.minFrameNumber}
                onChange={(e) => updateFilter("minFrameNumber", e.target.value)}
                placeholder="Min"
                className="w-full border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-3 py-2 text-sm text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Max Frame Number
              </label>
              <input
                type="number"
                value={filters.maxFrameNumber}
                onChange={(e) => updateFilter("maxFrameNumber", e.target.value)}
                placeholder="Max"
                className="w-full border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-3 py-2 text-sm text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
              />
            </div>
          </div>

          {/* Requests Count Range */}
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Min Requests
              </label>
              <input
                type="number"
                value={filters.minRequests}
                onChange={(e) => updateFilter("minRequests", e.target.value)}
                placeholder="Min"
                className="w-full border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-3 py-2 text-sm text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60 mb-2">
                Max Requests
              </label>
              <input
                type="number"
                value={filters.maxRequests}
                onChange={(e) => updateFilter("maxRequests", e.target.value)}
                placeholder="Max"
                className="w-full border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] px-3 py-2 text-sm text-burgundy dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30 transition-colors"
              />
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

