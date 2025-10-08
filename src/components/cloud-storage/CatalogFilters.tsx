/**
 * CatalogFilters Component
 *
 * Provides comprehensive filtering and sorting controls for the public mode catalog.
 * Features include search, category selection, tag filtering, sorting options,
 * featured toggle, and pagination controls.
 *
 * @module components/cloud-storage/CatalogFilters
 */

import * as React from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { ModeFilters, ModeCategory, ModeSortOption } from '@/types/cloud-mode';
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
 * Available sort options with display labels
 */
const SORT_OPTIONS: Array<{ value: ModeSortOption; label: string }> = [
  { value: 'recent', label: 'Newest First' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'views', label: 'Most Viewed' },
];

/**
 * Available items-per-page options
 */
const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48] as const;

/**
 * Default debounce delay for search input (milliseconds)
 */
const SEARCH_DEBOUNCE_DELAY = 500;

// ============================================================================
// INTERFACES
// ============================================================================

export interface CatalogFiltersProps {
  /** Current filter state */
  filters: ModeFilters;

  /** Callback when filters change */
  onChange: (filters: ModeFilters) => void;

  /** Additional CSS classes */
  className?: string;

  /** Whether to show the mobile accordion collapsed by default */
  defaultCollapsed?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * CatalogFilters provides a comprehensive filtering interface for browsing modes.
 *
 * Features:
 * - Debounced search input
 * - Category selection
 * - Tag filtering
 * - Sort options
 * - Featured toggle
 * - Pagination controls
 * - Responsive design with mobile accordion
 * - Active filter count badge
 * - Clear all functionality
 */
export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filters,
  onChange,
  className,
  defaultCollapsed = true,
}) => {
  // Local state for search input (debounced)
  const [searchValue, setSearchValue] = React.useState(filters.search || '');
  const [tagsValue, setTagsValue] = React.useState(
    filters.tags?.join(', ') || ''
  );

  // Debounce timer ref
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tagsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local search state with prop changes
  React.useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  // Sync local tags state with prop changes
  React.useEffect(() => {
    setTagsValue(filters.tags?.join(', ') || '');
  }, [filters.tags]);

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
        page: 1, // Reset to first page on search
      });
    }, SEARCH_DEBOUNCE_DELAY);
  };

  /**
   * Handle tags input with debouncing
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

      onChange({
        ...filters,
        tags: tags.length > 0 ? tags : undefined,
        page: 1, // Reset to first page on tags change
      });
    }, SEARCH_DEBOUNCE_DELAY);
  };

  /**
   * Handle category selection
   */
  const handleCategoryChange = (value: string) => {
    onChange({
      ...filters,
      category: value === 'all' ? undefined : (value as ModeCategory),
      page: 1, // Reset to first page
    });
  };

  /**
   * Handle sort option change
   */
  const handleSortChange = (value: string) => {
    onChange({
      ...filters,
      sort: value as ModeSortOption,
    });
  };

  /**
   * Handle featured toggle
   */
  const handleFeaturedToggle = (checked: boolean) => {
    onChange({
      ...filters,
      isFeatured: checked || undefined,
      page: 1, // Reset to first page
    });
  };

  /**
   * Handle items per page change
   */
  const handleLimitChange = (value: string) => {
    onChange({
      ...filters,
      limit: parseInt(value, 10),
      page: 1, // Reset to first page
    });
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    setSearchValue('');
    setTagsValue('');
    onChange({
      sort: filters.sort, // Keep sort preference
      limit: filters.limit, // Keep pagination preference
      page: 1,
    });
  };

  /**
   * Calculate number of active filters
   */
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.isFeatured) count++;
    return count;
  }, [filters]);

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
      {/* Search Input */}
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

      {/* Category Select */}
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

      {/* Tags Input */}
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

      {/* Sort Select */}
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
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Toggle */}
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

      {/* Items Per Page */}
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

CatalogFilters.displayName = 'CatalogFilters';
