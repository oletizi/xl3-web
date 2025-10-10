/**
 * ModeFiltersPanel Component
 *
 * A generic, reusable filter sidebar that adapts to Library or Catalog context.
 * Provides comprehensive filtering and sorting controls with variant-based rendering.
 *
 * Features:
 * - Variant support: 'library' | 'catalog'
 * - Debounced search input
 * - Active filter count badge
 * - Clear all functionality
 * - Responsive: desktop sidebar, mobile accordion
 * - Accessibility: proper labels, keyboard navigation
 *
 * @module components/cloud-storage/ModeFiltersPanel
 */

import * as React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { LibraryFilters, ModeFilters, ModeCategory, ModeSortOption } from '@/types/cloud-mode';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Available mode categories with display labels
 */
const CATEGORIES: Array<{ value: ModeCategory; label: string }> = [
  { value: 'daw-control', label: 'DAW Control' },
  { value: 'live-performance', label: 'Live Performance' },
  { value: 'mixing-mastering', label: 'Mixing & Mastering' },
  { value: 'instrument-control', label: 'Instrument Control' },
  { value: 'genre-specific', label: 'Genre Specific' },
  { value: 'educational', label: 'Educational' },
];

/**
 * Available sort options for catalog
 */
const CATALOG_SORT_OPTIONS: Array<{ value: ModeSortOption; label: string }> = [
  { value: 'recent', label: 'Newest First' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'views', label: 'Most Viewed' },
];

/**
 * Available sort options for library
 */
const LIBRARY_SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'recent', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'downloads', label: 'Most Downloaded' },
];

/**
 * Available items-per-page options (catalog only)
 */
const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48] as const;

/**
 * Default debounce delay for search input (milliseconds)
 */
const SEARCH_DEBOUNCE_DELAY = 500;

// ============================================================================
// INTERFACES
// ============================================================================

export interface ModeFiltersPanelProps {
  /** Current filter state */
  filters: LibraryFilters | ModeFilters;

  /** Callback when filters change */
  onChange: (filters: LibraryFilters | ModeFilters) => void;

  /** Context variant: library or catalog */
  variant: 'library' | 'catalog';

  /** Additional CSS classes */
  className?: string;

  /** Whether to show the mobile accordion collapsed by default */
  defaultCollapsed?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ModeFiltersPanel provides a comprehensive filtering interface for browsing modes.
 *
 * Adapts its UI based on the variant prop:
 * - Library: Shows search, sort, liked toggle
 * - Catalog: Shows search, category, tags, sort, featured, liked, pagination
 *
 * @example
 * ```tsx
 * // Library usage
 * <ModeFiltersPanel
 *   variant="library"
 *   filters={libraryFilters}
 *   onChange={setLibraryFilters}
 * />
 *
 * // Catalog usage
 * <ModeFiltersPanel
 *   variant="catalog"
 *   filters={catalogFilters}
 *   onChange={setCatalogFilters}
 * />
 * ```
 */
export const ModeFiltersPanel: React.FC<ModeFiltersPanelProps> = ({
  filters,
  onChange,
  variant,
  className,
  defaultCollapsed = true,
}) => {
  // Local state for search input (debounced)
  const [searchValue, setSearchValue] = React.useState(filters.search || '');
  const [tagsValue, setTagsValue] = React.useState(
    'tags' in filters && filters.tags ? filters.tags.join(', ') : ''
  );

  // Debounce timer refs
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tagsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Type guards
  const isCatalogFilters = (f: LibraryFilters | ModeFilters): f is ModeFilters => {
    return variant === 'catalog';
  };

  // Sync local search state with prop changes
  React.useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  // Sync local tags state with prop changes
  React.useEffect(() => {
    if ('tags' in filters) {
      setTagsValue(filters.tags?.join(', ') || '');
    }
  }, [filters]);

  /**
   * Handle search input with debouncing
   */
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      onChange({
        ...filters,
        search: value.trim() || undefined,
        ...(variant === 'catalog' && { page: 1 }), // Reset to first page on search in catalog
      });
    }, SEARCH_DEBOUNCE_DELAY);
  };

  /**
   * Handle tags input with debouncing (catalog only)
   */
  const handleTagsChange = (value: string) => {
    setTagsValue(value);

    // Clear existing timeout
    if (tagsTimeoutRef.current) {
      clearTimeout(tagsTimeoutRef.current);
    }

    // Set new timeout
    tagsTimeoutRef.current = setTimeout(() => {
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (isCatalogFilters(filters)) {
        onChange({
          ...filters,
          tags: tags.length > 0 ? tags : undefined,
          page: 1, // Reset to first page
        });
      }
    }, SEARCH_DEBOUNCE_DELAY);
  };

  /**
   * Handle category selection (catalog only)
   */
  const handleCategoryChange = (value: string) => {
    if (isCatalogFilters(filters)) {
      onChange({
        ...filters,
        category: value === 'all' ? undefined : (value as ModeCategory),
        page: 1, // Reset to first page
      });
    }
  };

  /**
   * Handle sort option change
   */
  const handleSortChange = (value: string) => {
    if (isCatalogFilters(filters)) {
      onChange({
        ...filters,
        sort: value as ModeSortOption,
      });
    } else {
      onChange({
        ...filters,
        sort: value as LibraryFilters['sort'],
      });
    }
  };

  /**
   * Handle featured toggle (catalog only)
   */
  const handleFeaturedToggle = (checked: boolean) => {
    if (isCatalogFilters(filters)) {
      onChange({
        ...filters,
        isFeatured: checked || undefined,
        page: 1, // Reset to first page
      });
    }
  };

  /**
   * Handle liked only toggle
   */
  const handleLikedToggle = (checked: boolean) => {
    onChange({
      ...filters,
      showLikedOnly: checked || undefined,
      ...(variant === 'catalog' && { page: 1 }), // Reset to first page in catalog
    });
  };

  /**
   * Handle items per page change (catalog only)
   */
  const handleLimitChange = (value: string) => {
    if (isCatalogFilters(filters)) {
      onChange({
        ...filters,
        limit: parseInt(value, 10),
        page: 1, // Reset to first page
      });
    }
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    setSearchValue('');
    setTagsValue('');

    if (isCatalogFilters(filters)) {
      onChange({
        sort: filters.sort, // Keep sort preference
        limit: filters.limit, // Keep pagination preference
        page: 1,
      });
    } else {
      onChange({
        sort: filters.sort, // Keep sort preference
        viewMode: 'viewMode' in filters ? filters.viewMode : undefined, // Keep view mode
      });
    }
  };

  /**
   * Calculate number of active filters
   */
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.showLikedOnly) count++;

    if (isCatalogFilters(filters)) {
      if (filters.category) count++;
      if (filters.tags && filters.tags.length > 0) count++;
      if (filters.isFeatured) count++;
    }

    return count;
  }, [filters, variant]);

  /**
   * Cleanup timeouts on unmount
   */
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (tagsTimeoutRef.current) {
        clearTimeout(tagsTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Render filter controls content
   */
  const renderFilters = () => (
    <div className="space-y-4">
      {/* Search Input - Common to both variants */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Modes</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Search by name or description..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Category Select - Catalog only */}
      {variant === 'catalog' && isCatalogFilters(filters) && (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={filters.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tags Input - Catalog only */}
      {variant === 'catalog' && (
        <div className="space-y-2">
          <Label htmlFor="tags">
            Tags
            <span className="ml-1 text-xs text-muted-foreground">
              (comma-separated)
            </span>
          </Label>
          <div className="relative">
            <Input
              id="tags"
              type="text"
              placeholder="e.g., ableton, midi, controller"
              value={tagsValue}
              onChange={(e) => handleTagsChange(e.target.value)}
              className={cn(tagsValue && 'pr-9')}
            />
            {tagsValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => handleTagsChange('')}
                aria-label="Clear tags"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Sort Select - Common to both variants */}
      <div className="space-y-2">
        <Label htmlFor="sort">Sort By</Label>
        <Select
          value={filters.sort || 'recent'}
          onValueChange={handleSortChange}
        >
          <SelectTrigger id="sort">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {(variant === 'catalog' ? CATALOG_SORT_OPTIONS : LIBRARY_SORT_OPTIONS).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Toggle - Catalog only */}
      {variant === 'catalog' && isCatalogFilters(filters) && (
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="featured" className="cursor-pointer">
            Show Featured Only
          </Label>
          <Switch
            id="featured"
            checked={filters.isFeatured || false}
            onCheckedChange={handleFeaturedToggle}
          />
        </div>
      )}

      {/* Liked Only Toggle - Common to both variants */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="liked-only" className="cursor-pointer">
          Show Liked Only
        </Label>
        <Switch
          id="liked-only"
          checked={filters.showLikedOnly || false}
          onCheckedChange={handleLikedToggle}
        />
      </div>

      {/* Items Per Page - Catalog only */}
      {variant === 'catalog' && isCatalogFilters(filters) && (
        <div className="space-y-2">
          <Label htmlFor="limit">Items Per Page</Label>
          <Select
            value={String(filters.limit || 24)}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger id="limit">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} items
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop View - Always Visible */}
      <div className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8"
            >
              <X className="mr-1 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
        {renderFilters()}
      </div>

      {/* Mobile View - Accordion */}
      <div className="lg:hidden">
        <Accordion
          type="single"
          collapsible
          defaultValue={defaultCollapsed ? undefined : 'filters'}
        >
          <AccordionItem value="filters">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="mb-4 h-8 w-full"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
                {renderFilters()}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

ModeFiltersPanel.displayName = 'ModeFiltersPanel';
