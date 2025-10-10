# Library/Catalog Page Unification

**Status**: In Progress
**Date**: 2025-10-09
**Related**: cloud-storage feature, user experience

## Overview

This document describes the refactoring of the Library and Catalog pages to share common UI components and business logic while maintaining their distinct purposes and scopes.

## Problem Statement

The Library (`/library`) and Catalog (`/catalog`) pages currently implement similar functionality with duplicated code:

- **Duplicated Code**: ~200+ lines of filter UI, layout, and state management
- **Inconsistent UX**: Different filter layouts (horizontal inline vs. sidebar)
- **Maintenance Burden**: Changes to filters must be made in two places
- **User Confusion**: Different interaction patterns for similar functionality

### Current Implementation

**Library Page**:
- Horizontal inline filter bar
- Search input, sort dropdown, liked toggle, view mode toggle
- Inline with content area
- Custom filter state management

**Catalog Page**:
- Left sidebar with comprehensive filters
- Search, category, tags, sort, featured toggle, liked toggle, pagination controls
- Responsive accordion on mobile
- `CatalogFilters` component with `ModeFilters` type

## Solution Design

### Architecture Principles

1. **Shared Components**: Extract common UI patterns into reusable components
2. **Variant-Based Rendering**: Single component adapts to context (library vs. catalog)
3. **Progressive Enhancement**: Start with Library, ensure no regressions
4. **Type Safety**: Maintain strict TypeScript throughout
5. **No API Changes**: Pure UI refactoring, no backend changes

### Component Hierarchy

```
ModeBrowserLayout (New)
├── Header
│   ├── Title & Subtitle
│   └── Actions Slot (e.g., "New Mode" button)
├── Filters Sidebar (Sticky on Desktop)
│   └── ModeFiltersPanel (New)
│       ├── Search Input
│       ├── Sort Select
│       ├── Liked Only Toggle
│       ├── [Catalog Only] Category Select
│       ├── [Catalog Only] Tags Input
│       ├── [Catalog Only] Featured Toggle
│       └── [Catalog Only] Items Per Page
└── Content Area
    └── ModeGrid (New)
        ├── Loading Skeletons
        ├── Empty State
        ├── Error State
        ├── Mode Cards Grid/List
        └── [Optional] Pagination
```

## Implementation

### Phase 1: Shared Components

#### 1.1 LibraryFilters Type

**File**: `src/types/cloud-mode.ts`

```typescript
/**
 * Filter options for browsing user's library
 */
export interface LibraryFilters {
  /** Full-text search query */
  search?: string;

  /** Sort order */
  sort?: 'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'likes' | 'downloads';

  /** Show only modes liked by current user */
  showLikedOnly?: boolean;

  /** Display mode (grid or list) */
  viewMode?: 'grid' | 'list';
}
```

#### 1.2 ModeFiltersPanel Component

**File**: `src/components/cloud-storage/ModeFiltersPanel.tsx`

**Purpose**: Generic, reusable filter sidebar that adapts to Library or Catalog context.

**Key Features**:
- Variant-based rendering (`library` | `catalog`)
- Debounced search input
- Active filter count badge
- "Clear All" functionality
- Responsive: desktop sidebar, mobile accordion
- Accessibility: proper labels, keyboard navigation

**Props**:
```typescript
interface ModeFiltersPanelProps {
  filters: LibraryFilters | ModeFilters;
  onChange: (filters: LibraryFilters | ModeFilters) => void;
  variant: 'library' | 'catalog';
  className?: string;
  defaultCollapsed?: boolean;
}
```

**Conditional Rendering**:
- **Always**: Search, Sort, Liked Only
- **Catalog Only**: Category, Tags, Featured, Items Per Page

#### 1.3 ModeBrowserLayout Component

**File**: `src/components/cloud-storage/ModeBrowserLayout.tsx`

**Purpose**: Consistent layout wrapper for both Library and Catalog pages.

**Props**:
```typescript
interface ModeBrowserLayoutProps {
  title: string;
  subtitle: string;
  headerActions?: React.ReactNode;
  filters: React.ReactNode;
  children: React.ReactNode;
}
```

**Layout**:
- Responsive grid: `grid-cols-1 lg:grid-cols-[280px_1fr]`
- Sticky sidebar on desktop: `lg:sticky lg:top-8 lg:self-start`
- Proper spacing and animations

#### 1.4 ModeGrid Component

**File**: `src/components/cloud-storage/ModeGrid.tsx`

**Purpose**: Reusable display component for mode lists with all states (loading, empty, error).

**Props**:
```typescript
interface ModeGridProps {
  modes: CloudMode[];
  isLoading: boolean;
  error: Error | null;
  viewMode?: 'grid' | 'list';
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onModeSelect: (mode: CloudMode) => void;
  onModeLoad?: (mode: CloudMode) => void;
  onModeEdit?: (mode: CloudMode) => void;
  showPagination?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}
```

**States**:
- **Loading**: Skeleton cards
- **Error**: Alert with retry option
- **Empty**: Custom message with icon
- **Success**: Grid/list of ModeCards

### Phase 2: Library Page Refactoring

**File**: `src/pages/Library.tsx`

**Changes**:
1. Replace inline filter bar with `ModeFiltersPanel`
2. Wrap content in `ModeBrowserLayout`
3. Replace manual grid rendering with `ModeGrid`
4. Simplify state management (remove view mode from filters, handle separately if needed)
5. Move "New Mode" button to `headerActions` prop

**Before** (Inline Filters):
```tsx
<div className="flex items-center justify-between">
  <Input placeholder="Search..." />
  <Select>...</Select>
  <Switch />
  {/* etc */}
</div>
<div className="grid grid-cols-3">
  {modes.map(mode => <ModeCard />)}
</div>
```

**After** (Shared Components):
```tsx
<ModeBrowserLayout
  title="My Library"
  subtitle="Manage your custom modes"
  headerActions={<Button>New Mode</Button>}
  filters={
    <ModeFiltersPanel
      variant="library"
      filters={filters}
      onChange={setFilters}
    />
  }
>
  <ModeGrid
    modes={filteredModes}
    isLoading={isLoading}
    error={error}
    viewMode={viewMode}
    onModeSelect={handleSelect}
    onModeLoad={handleLoad}
    onModeEdit={handleEdit}
  />
</ModeBrowserLayout>
```

### Phase 3: Catalog Page Refactoring

**File**: `src/pages/Catalog.tsx`

**Changes**:
1. Replace `CatalogFilters` with `ModeFiltersPanel` (variant="catalog")
2. Use `ModeBrowserLayout` for structure
3. Replace manual rendering with `ModeGrid`
4. Keep pagination logic, pass to `ModeGrid`

**Benefits**:
- Eliminates ~100 lines of pagination rendering code
- Consistent empty/error states
- Automatic loading skeletons

### Phase 4: Deprecation Strategy

**CatalogFilters.tsx**:
- Option 1: Delete entirely, use `ModeFiltersPanel` directly
- Option 2: Keep as thin wrapper for backward compatibility
- Recommendation: **Option 1** (clean break, simpler codebase)

## Data Flow

### Library Flow

```
User Interaction → LibraryFilters State → Client-Side Filtering → ModeGrid Display
                                        ↓
                           useMyModes() (Server fetch)
```

### Catalog Flow

```
User Interaction → ModeFilters State → Server-Side Filtering → ModeGrid Display
                                     ↓
                      usePublicModes(filters) (Server fetch with filters)
```

## Testing Strategy

### Unit Tests
- `ModeFiltersPanel`: Filter state changes, clear all, variant rendering
- `ModeBrowserLayout`: Prop rendering, responsive behavior
- `ModeGrid`: All states (loading, error, empty, success)

### Integration Tests
- Library page: Search, sort, filter, view modes
- Catalog page: All filters, pagination, filter combinations

### E2E Tests
- Full user journeys:
  - Search and filter in Library
  - Browse catalog with filters
  - Toggle liked-only in both pages

### Regression Testing
- Verify all existing functionality works
- Check mobile responsive behavior
- Test keyboard navigation
- Validate accessibility

## Migration Checklist

- [ ] Create `LibraryFilters` type in `cloud-mode.ts`
- [ ] Implement `ModeFiltersPanel` component
- [ ] Implement `ModeBrowserLayout` component
- [ ] Implement `ModeGrid` component
- [ ] Unit test all new components
- [ ] Refactor Library page
- [ ] Test Library page thoroughly
- [ ] Refactor Catalog page
- [ ] Test Catalog page thoroughly
- [ ] Delete or update `CatalogFilters.tsx`
- [ ] Integration tests
- [ ] E2E tests
- [ ] Update Storybook stories (if applicable)
- [ ] Documentation review
- [ ] Code review
- [ ] Merge to main

## Benefits

### Code Quality
- **-200 lines**: Eliminate duplicated filter code
- **+Reusability**: Three new reusable components
- **+Maintainability**: Single source of truth for filters

### User Experience
- **Consistency**: Identical filter UI in Library and Catalog
- **Familiarity**: Users learn once, use everywhere
- **Accessibility**: Better keyboard nav and screen reader support

### Developer Experience
- **Faster Development**: Add new filters in one place
- **Easier Testing**: Test shared components once
- **Better Types**: Strict TypeScript throughout

## Future Enhancements

### Short Term
- View mode preference persistence (localStorage)
- Filter preset saving
- Advanced sorting options

### Long Term
- Unified search across Library and Catalog
- Smart suggestions based on user behavior
- Bulk operations on filtered results
- Export filtered results

## References

- Original implementation: `src/components/cloud-storage/CatalogFilters.tsx`
- Catalog page: `src/pages/Catalog.tsx`
- Library page: `src/pages/Library.tsx`
- Types: `src/types/cloud-mode.ts`
- ModeCard component: `src/components/cloud-storage/ModeCard.tsx`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-10-09 | Use variant prop instead of separate components | Reduces duplication, easier to maintain consistency |
| 2025-10-09 | Keep ModeCard as-is | Already well-designed and shared |
| 2025-10-09 | Client-side filtering for Library | Simpler, no API changes needed |
| 2025-10-09 | Create separate LibraryFilters type | Type safety, clearer intent |

## Success Metrics

- **Code Reduction**: Target 200+ lines removed
- **Component Reuse**: 3 new shared components used in 2+ places
- **Bug Rate**: Zero regression bugs in 2 weeks post-deployment
- **User Satisfaction**: No increase in support tickets about filters
- **Performance**: No measurable performance regression

## Notes

- This is a pure UI refactoring with no database or API changes
- All existing functionality must be preserved
- Consider feature flag for gradual rollout if needed
- Monitor error logs closely post-deployment
