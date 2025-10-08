import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, PackageOpen } from "lucide-react";
import { motion } from "framer-motion";

import { usePublicModes } from "@/hooks/use-cloud-modes";
import { ModeFilters } from "@/types/cloud-mode";
import { ModeCard } from "@/components/cloud-storage/ModeCard";
import { CatalogFilters } from "@/components/cloud-storage/CatalogFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Catalog = () => {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<ModeFilters>({
    sort: 'recent',
    limit: 24,
    page: 1,
  });

  // Fetch public modes
  const { data, isLoading, error } = usePublicModes(filters);

  /**
   * Handle filter changes from CatalogFilters component
   */
  const handleFilterChange = (newFilters: ModeFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handle page navigation
   */
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle mode selection (navigate to detail view)
   */
  const handleModeSelect = (modeId: string) => {
    navigate(`/modes/${modeId}`);
  };

  /**
   * Handle mode load (apply to editor)
   */
  const handleModeLoad = (modeId: string) => {
    // TODO: Implement mode loading to editor
    navigate(`/editor?mode=${modeId}`);
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: filters.limit || 24 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <PackageOpen className="h-24 w-24 text-muted-foreground/50" />
      <h3 className="text-xl font-semibold">No Modes Found</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {filters.search || filters.category || filters.tags
          ? "Try adjusting your filters to find more modes."
          : "Be the first to share a mode with the community!"}
      </p>
    </motion.div>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Modes</AlertTitle>
      <AlertDescription>
        {error instanceof Error ? error.message : "Failed to load modes from the catalog."}
      </AlertDescription>
    </Alert>
  );

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (!data?.pagination) return null;

    const { page, totalPages, hasNext, hasPrev } = data.pagination;

    // Calculate page numbers to display
    const getPageNumbers = (): (number | 'ellipsis')[] => {
      const pages: (number | 'ellipsis')[] = [];
      const showPages = 5; // Max number of page buttons to show

      if (totalPages <= showPages) {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (page > 3) {
          pages.push('ellipsis');
        }

        // Show pages around current page
        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (page < totalPages - 2) {
          pages.push('ellipsis');
        }

        // Always show last page
        pages.push(totalPages);
      }

      return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={hasPrev ? () => handlePageChange(page - 1) : undefined}
              className={!hasPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {pageNumbers.map((pageNum, idx) =>
            pageNum === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => handlePageChange(pageNum)}
                  isActive={pageNum === page}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={hasNext ? () => handlePageChange(page + 1) : undefined}
              className={!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Community Catalog
        </h1>
        <p className="text-muted-foreground mt-2">
          Discover and share custom modes with the community
        </p>
      </motion.div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <CatalogFilters
            filters={filters}
            onChange={handleFilterChange}
          />
        </aside>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Error State */}
          {error && renderErrorState()}

          {/* Loading State */}
          {isLoading && renderSkeletons()}

          {/* Empty State */}
          {!isLoading && !error && data?.data.length === 0 && renderEmptyState()}

          {/* Modes Grid */}
          {!isLoading && !error && data && data.data.length > 0 && (
            <>
              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} modes
                </p>
              </div>

              {/* Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.data.map((mode, index) => (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ModeCard
                      mode={mode}
                      onSelect={(m) => handleModeSelect(m.id)}
                      onLoad={(m) => handleModeLoad(m.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && renderPagination()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Catalog;