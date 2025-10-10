import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Grid, List, Tag } from "lucide-react";
import { useMyModes } from "@/hooks/use-cloud-modes";
import { useAuth } from "@/contexts/AuthContext";
import { LibraryFilters } from "@/types/cloud-mode";
import { ModeFiltersPanel } from "@/components/cloud-storage/ModeFiltersPanel";
import { ModeBrowserLayout } from "@/components/cloud-storage/ModeBrowserLayout";
import { ModeGrid } from "@/components/cloud-storage/ModeGrid";

const Library = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: modes, isLoading, error, refetch } = useMyModes();

  // Filter state
  const [filters, setFilters] = useState<LibraryFilters>({
    sort: 'recent',
    viewMode: 'grid',
  });

  // Filter and sort modes based on filter state
  const filteredAndSortedModes = useMemo(() => {
    if (!modes) return [];

    let result = [...modes];

    // Apply liked filter
    if (filters.showLikedOnly) {
      result = result.filter((mode) => mode.userLiked === true);
    }

    // Apply search filter
    if (filters.search?.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter((mode) => {
        const matchesName = mode.name.toLowerCase().includes(query);
        const matchesDescription = mode.description?.toLowerCase().includes(query);
        const matchesTags = mode.tags?.some((tag) => tag.toLowerCase().includes(query));
        const matchesCategory = mode.category?.toLowerCase().includes(query);
        return matchesName || matchesDescription || matchesTags || matchesCategory;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sort) {
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "likes":
          return b.likes - a.likes;
        case "downloads":
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

    return result;
  }, [modes, filters]);

  // Handle loading mode into editor
  const handleLoadMode = (mode: any) => {
    navigate(`/?mode=${mode.id}`);
  };

  // Handle editing mode
  const handleEditMode = (mode: any) => {
    navigate(`/?mode=${mode.id}&edit=true`);
  };

  // Handle creating new mode
  const handleNewMode = () => {
    navigate("/");
  };

  // Handle mode selection (navigate to detail)
  const handleModeSelect = (mode: any) => {
    navigate(`/modes/${mode.id}`);
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-6">
          Please sign in to access your library.
        </p>
        <Button onClick={() => navigate("/login")}>
          Sign In
        </Button>
      </div>
    );
  }

  // Custom empty state message for no modes
  const emptyMessage = !modes || modes.length === 0
    ? "Create your first custom mode to get started with your MIDI controller."
    : "No modes match your search criteria. Try adjusting your filters.";

  return (
    <ModeBrowserLayout
      title="My Library"
      subtitle="Manage your custom modes and presets"
      headerActions={
        <Button
          onClick={handleNewMode}
          size="sm"
          className="bg-secondary text-secondary-foreground shadow-glow-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Mode
        </Button>
      }
      filters={
        <ModeFiltersPanel
          variant="library"
          filters={filters}
          onChange={setFilters}
        />
      }
    >
      <ModeGrid
        modes={filteredAndSortedModes}
        isLoading={isLoading}
        error={error}
        viewMode={filters.viewMode}
        emptyMessage={emptyMessage}
        emptyIcon={<Tag className="w-24 h-24 text-muted-foreground/50" />}
        onModeSelect={handleModeSelect}
        onModeLoad={handleLoadMode}
        onModeEdit={handleEditMode}
        onRetry={() => refetch()}
      />
    </ModeBrowserLayout>
  );
};

export default Library;