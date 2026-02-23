import { Button } from "./Button";
import ChevronDown from "./ChevronDown";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  };

  // Calculate visible page range for desktop
  const maxVisible = 7;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const showStartEllipsis = startPage > 2;
  const showEndEllipsis = endPage < totalPages - 1;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
      {/* Mobile: compact Prev / X of Y / Next */}
      <div className="flex sm:hidden items-center gap-2">
        <Button
          variant="secondary"
          size="xs"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
          aria-label="Go to previous page"
        >
          <ChevronDown className="w-3 h-3 rotate-90" />
          <span>Prev</span>
        </Button>
        <span className="min-w-[4rem] text-center text-sm sm:text-xs font-medium text-secondary">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1"
          aria-label="Go to next page"
        >
          <span>Next</span>
          <ChevronDown className="w-3 h-3 -rotate-90" />
        </Button>
      </div>

      {/* Desktop: full pagination with page numbers */}
      <div className="hidden sm:flex items-center gap-2">
        <Button
          variant="secondary"
          size="xs"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
          aria-label="Go to previous page"
        >
          <ChevronDown className="w-3 h-3 rotate-90" />
          <span>Previous</span>
        </Button>
        <div className="flex items-center gap-1">
          {/* First page + ellipsis */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1.5 text-sm sm:text-xs font-semibold rounded-lg transition-colors ${
                  currentPage === 1
                    ? "bg-burgundy/20 dark:bg-white/20 text-primary"
                    : "text-secondary hover:text-primary hover:bg-active-highlight"
                }`}
                aria-current={currentPage === 1 ? "page" : undefined}
              >
                1
              </button>
              {showStartEllipsis && (
                <span className="px-2 text-sm sm:text-xs text-faint">...</span>
              )}
            </>
          )}

          {/* Visible page range */}
          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 text-sm sm:text-xs font-semibold rounded-lg transition-colors ${
                currentPage === page
                  ? "bg-burgundy/20 dark:bg-white/20 text-primary"
                  : "text-secondary hover:text-primary hover:bg-active-highlight"
              }`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          {/* Ellipsis + last page */}
          {endPage < totalPages && (
            <>
              {showEndEllipsis && (
                <span className="px-2 text-sm sm:text-xs text-faint">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1.5 text-sm sm:text-xs font-semibold rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? "bg-burgundy/20 dark:bg-white/20 text-primary"
                    : "text-secondary hover:text-primary hover:bg-active-highlight"
                }`}
                aria-current={currentPage === totalPages ? "page" : undefined}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1"
          aria-label="Go to next page"
        >
          <span>Next</span>
          <ChevronDown className="w-3 h-3 -rotate-90" />
        </Button>
      </div>
    </div>
  );
}
