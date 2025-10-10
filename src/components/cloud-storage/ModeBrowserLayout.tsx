/**
 * ModeBrowserLayout Component
 *
 * Provides a consistent layout wrapper for both Library and Catalog pages.
 * Features a responsive grid layout with a sticky sidebar for filters.
 *
 * Layout Structure:
 * - Header with title, subtitle, and optional action buttons
 * - Responsive grid: single column on mobile, sidebar + content on desktop
 * - Sticky sidebar on desktop (filters remain visible while scrolling)
 * - Content area for mode grids
 *
 * @module components/cloud-storage/ModeBrowserLayout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ModeBrowserLayoutProps {
  /** Page title displayed in header */
  title: string;

  /** Subtitle/description displayed below title */
  subtitle: string;

  /** Optional action buttons (e.g., "New Mode" button) */
  headerActions?: React.ReactNode;

  /** Filter panel component */
  filters: React.ReactNode;

  /** Main content (mode grid, loading states, etc.) */
  children: React.ReactNode;

  /** Additional CSS classes for container */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ModeBrowserLayout provides a consistent layout structure for mode browsing pages.
 *
 * Features:
 * - Animated header with gradient title
 * - Responsive grid layout (mobile: 1 col, desktop: sidebar + content)
 * - Sticky sidebar on desktop
 * - Flexible header actions slot
 *
 * @example
 * ```tsx
 * <ModeBrowserLayout
 *   title="My Library"
 *   subtitle="Manage your custom modes"
 *   headerActions={<Button>New Mode</Button>}
 *   filters={
 *     <ModeFiltersPanel
 *       variant="library"
 *       filters={filters}
 *       onChange={setFilters}
 *     />
 *   }
 * >
 *   <ModeGrid
 *     modes={modes}
 *     isLoading={isLoading}
 *     error={error}
 *     viewMode="grid"
 *     onModeSelect={handleSelect}
 *   />
 * </ModeBrowserLayout>
 * ```
 */
export const ModeBrowserLayout: React.FC<ModeBrowserLayoutProps> = ({
  title,
  subtitle,
  headerActions,
  filters,
  children,
  className,
}) => {
  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>
          {headerActions && (
            <div className="flex-shrink-0">{headerActions}</div>
          )}
        </div>
      </motion.div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters Sidebar - Sticky on Desktop */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          {filters}
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
};

ModeBrowserLayout.displayName = 'ModeBrowserLayout';
