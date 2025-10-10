/**
 * ModeGrid Component
 *
 * A reusable display component for mode lists with comprehensive state handling.
 * Supports loading skeletons, empty states, error states, and success rendering.
 *
 * Features:
 * - Loading state with skeleton cards
 * - Error state with Alert component
 * - Empty state with custom message and icon
 * - Grid/list view mode support
 * - Optional pagination controls
 * - Animated mode cards with stagger effect
 *
 * @module components/cloud-storage/ModeGrid
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, PackageOpen } from 'lucide-react';
import { CloudMode } from '@/types/cloud-mode';
import { ModeCard } from '@/components/cloud-storage/ModeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ModeGridProps {
  /** Array of modes to display */
  modes: CloudMode[];

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Error object if fetch failed */
  error: Error | null;

  /** Display mode: grid or list */
  viewMode?: 'grid' | 'list';

  /** Custom message for empty state */
  emptyMessage?: string;

  /** Custom icon for empty state */
  emptyIcon?: React.ReactNode;

  /** Callback when mode card is clicked */
  onModeSelect: (mode: CloudMode) => void;

  /** Optional callback when load button is clicked */
  onModeLoad?: (mode: CloudMode) => void;

  /** Optional callback when edit button is clicked */
  onModeEdit?: (mode: CloudMode) => void;

  /** Whether to show pagination controls */
  showPagination?: boolean;

  /** Pagination data */
  pagination?: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  /** Callback when page changes */
  onPageChange?: (page: number) => void;

  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ModeGrid displays a collection of mode cards with comprehensive state handling.
 *
 * @example
 * ```tsx
 * <ModeGrid
 *   modes={modes}
 *   isLoading={isLoading}
 *   error={error}
 *   viewMode="grid"
 *   onModeSelect={(mode) => navigate(`/modes/${mode.id}`)}
 *   onModeLoad={(mode) => loadMode(mode)}
 *   onModeEdit={(mode) => openEditor(mode)}
 *   showPagination={true}
 *   pagination={paginationData}
 *   onPageChange={handlePageChange}
 * />
 * ```
 */
export const ModeGrid: React.FC<ModeGridProps> = ({
  modes,
  isLoading,
  error,
  viewMode = 'grid',
  emptyMessage = 'No modes found',
  emptyIcon,
  onModeSelect,
  onModeLoad,
  onModeEdit,
  showPagination = false,
  pagination,
  onPageChange,
  className,
}) => {
  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => {
    const skeletonCount = pagination?.limit || 24;
    const gridClass = viewMode === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 space-y-4"
    >
      {emptyIcon || <PackageOpen className="h-24 w-24 text-muted-foreground/50" />}
      <h3 className="text-xl font-semibold">No Modes Found</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {emptyMessage}
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
        {error instanceof Error ? error.message : 'Failed to load modes.'}
      </AlertDescription>
    </Alert>
  );

  /**
   * Calculate page numbers to display in pagination
   */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (!pagination) return [];

    const { page, totalPages } = pagination;
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

  /**
   * Handle page change with scroll to top
   */
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (!showPagination || !pagination || pagination.totalPages <= 1) {
      return null;
    }

    const { page, totalPages, hasNext, hasPrev } = pagination;
    const pageNumbers = getPageNumbers();

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={hasPrev ? () => handlePageChange(page - 1) : undefined}
              className={!hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
              className={!hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  /**
   * Render mode cards grid
   */
  const renderModeCards = () => {
    const gridClass = viewMode === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';

    return (
      <div className={gridClass}>
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ModeCard
              mode={mode}
              onSelect={onModeSelect}
              onLoad={onModeLoad}
              onEdit={onModeEdit}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  /**
   * Render results summary (optional - shown when pagination is enabled)
   */
  const renderResultsSummary = () => {
    if (!showPagination || !pagination || modes.length === 0) {
      return null;
    }

    const start = ((pagination.page - 1) * (pagination.limit || 24)) + 1;
    const end = Math.min(pagination.page * (pagination.limit || 24), pagination.total || 0);
    const total = pagination.total || 0;

    return (
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {start}–{end} of {total} modes
        </p>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Error State */}
      {error && renderErrorState()}

      {/* Loading State */}
      {isLoading && renderSkeletons()}

      {/* Empty State */}
      {!isLoading && !error && modes.length === 0 && renderEmptyState()}

      {/* Success State - Modes Grid */}
      {!isLoading && !error && modes.length > 0 && (
        <>
          {/* Results Summary */}
          {renderResultsSummary()}

          {/* Mode Cards */}
          {renderModeCards()}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

ModeGrid.displayName = 'ModeGrid';
