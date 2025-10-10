import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageOpen } from "lucide-react";

import { usePublicModes } from "@/hooks/use-cloud-modes";
import { ModeFilters } from "@/types/cloud-mode";
import { ModeFiltersPanel } from "@/components/cloud-storage/ModeFiltersPanel";
import { ModeBrowserLayout } from "@/components/cloud-storage/ModeBrowserLayout";
import { ModeGrid } from "@/components/cloud-storage/ModeGrid";

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
   * Handle page navigation
   */
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  /**
   * Handle mode selection (navigate to detail view)
   */
  const handleModeSelect = (mode: any) => {
    navigate(`/modes/${mode.id}`);
  };

  /**
   * Handle mode load (apply to editor)
   */
  const handleModeLoad = (mode: any) => {
    navigate(`/editor?mode=${mode.id}`);
  };

  // Custom empty state message
  const emptyMessage = filters.search || filters.category || filters.tags
    ? "Try adjusting your filters to find more modes."
    : "Be the first to share a mode with the community!";

  // Prepare pagination data for ModeGrid
  const paginationData = data?.pagination ? {
    page: data.pagination.page,
    totalPages: data.pagination.totalPages,
    hasNext: data.pagination.hasNext,
    hasPrev: data.pagination.hasPrev,
    total: data.pagination.total,
    limit: data.pagination.limit,
  } : undefined;

  return (
    <ModeBrowserLayout
      title="Community Catalog"
      subtitle="Discover and share custom modes with the community"
      filters={
        <ModeFiltersPanel
          variant="catalog"
          filters={filters}
          onChange={setFilters}
        />
      }
    >
      <ModeGrid
        modes={data?.data || []}
        isLoading={isLoading}
        error={error}
        emptyMessage={emptyMessage}
        emptyIcon={<PackageOpen className="h-24 w-24 text-muted-foreground/50" />}
        onModeSelect={handleModeSelect}
        onModeLoad={handleModeLoad}
        showPagination={true}
        pagination={paginationData}
        onPageChange={handlePageChange}
      />
    </ModeBrowserLayout>
  );
};

export default Catalog;