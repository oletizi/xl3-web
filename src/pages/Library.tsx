import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Grid,
  List,
  Filter,
  Upload,
  Plus,
  Tag,
  AlertCircle,
  RefreshCw,
  SortAsc,
  SortDesc,
  Calendar,
  Heart
} from "lucide-react";
import { motion } from "framer-motion";
import { useMyModes } from "@/hooks/use-cloud-modes";
import { ModeCard } from "@/components/cloud-storage/ModeCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "recent" | "oldest" | "name-asc" | "name-desc" | "likes" | "downloads";

const Library = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data: modes, isLoading, error, refetch } = useMyModes();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  // Filter and sort modes based on search query and sort option
  const filteredAndSortedModes = useMemo(() => {
    if (!modes) return [];

    let result = [...modes];

    // Apply liked filter
    if (showLikedOnly) {
      result = result.filter((mode) => mode.userLiked === true);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
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
      switch (sortBy) {
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
  }, [modes, searchQuery, sortBy, showLikedOnly]);

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

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Search/filter skeleton */}
        <div className="flex gap-4 items-center justify-between">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold mb-2">Failed to Load Library</h2>
        <p className="text-muted-foreground mb-6">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state (no modes yet)
  if (!modes || modes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              My Library
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your custom modes and presets
            </p>
          </div>

          <Button onClick={handleNewMode} size="sm" className="bg-secondary text-secondary-foreground shadow-glow-secondary">
            <Plus className="w-4 h-4 mr-2" />
            New Mode
          </Button>
        </motion.div>

        {/* Empty state */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <Tag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No modes yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first custom mode to get started with your MIDI controller.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Button onClick={handleNewMode} className="bg-primary text-primary-foreground shadow-glow-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Mode
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your custom modes and presets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleNewMode} size="sm" className="bg-secondary text-secondary-foreground shadow-glow-secondary">
            <Plus className="w-4 h-4 mr-2" />
            New Mode
          </Button>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search your modes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Show Liked Only toggle */}
          <div className="flex items-center space-x-2 px-3 py-2 border border-border rounded-lg">
            <Heart className={`w-4 h-4 ${showLikedOnly ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="liked-only" className="cursor-pointer text-sm">
              Liked
            </Label>
            <Switch
              id="liked-only"
              checked={showLikedOnly}
              onCheckedChange={setShowLikedOnly}
            />
          </div>

          {/* Sort selector */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Most Recent
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Oldest
                </div>
              </SelectItem>
              <SelectItem value="name-asc">
                <div className="flex items-center">
                  <SortAsc className="w-4 h-4 mr-2" />
                  Name (A-Z)
                </div>
              </SelectItem>
              <SelectItem value="name-desc">
                <div className="flex items-center">
                  <SortDesc className="w-4 h-4 mr-2" />
                  Name (Z-A)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Badge variant="outline" className="text-muted-foreground">
            {filteredAndSortedModes.length} {filteredAndSortedModes.length === 1 ? "mode" : "modes"}
          </Badge>
        </div>
      </motion.div>

      {/* No search results */}
      {filteredAndSortedModes.length === 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No modes found</h3>
          <p className="text-muted-foreground mb-4">
            No modes match "{searchQuery}". Try a different search term.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </motion.div>
      )}

      {/* Modes Grid/List */}
      {filteredAndSortedModes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ModeCard
                mode={mode}
                onSelect={(mode) => navigate(`/modes/${mode.id}`)}
                onLoad={handleLoadMode}
                onEdit={handleEditMode}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Library;