-- Migration: 004_add_indexes.sql
-- Description: Performance indexes for common query patterns
-- Created: 2025-10-08

-- ============================================================================
-- MODES TABLE INDEXES
-- ============================================================================

-- Index: Lookup modes by author (user's library)
CREATE INDEX IF NOT EXISTS idx_modes_author
  ON modes(author_id);

COMMENT ON INDEX idx_modes_author IS
  'Optimizes queries for user''s own modes (library page)';

-- Index: Filter public modes (catalog browsing)
CREATE INDEX IF NOT EXISTS idx_modes_public
  ON modes(is_public)
  WHERE is_public = true;

COMMENT ON INDEX idx_modes_public IS
  'Partial index for efficient public mode filtering';

-- Index: Featured modes (homepage, promotions)
CREATE INDEX IF NOT EXISTS idx_modes_featured
  ON modes(is_featured)
  WHERE is_featured = true;

COMMENT ON INDEX idx_modes_featured IS
  'Partial index for featured modes display';

-- Index: Filter by category
CREATE INDEX IF NOT EXISTS idx_modes_category
  ON modes(category);

COMMENT ON INDEX idx_modes_category IS
  'Optimizes category filtering in catalog';

-- Index: Filter by tags (array contains queries)
CREATE INDEX IF NOT EXISTS idx_modes_tags
  ON modes USING GIN(tags);

COMMENT ON INDEX idx_modes_tags IS
  'GIN index for efficient tag-based filtering and search';

-- Index: Sort by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_modes_created
  ON modes(created_at DESC);

COMMENT ON INDEX idx_modes_created IS
  'Optimizes sorting by newest modes';

-- Index: Sort by downloads (most popular)
CREATE INDEX IF NOT EXISTS idx_modes_downloads
  ON modes(downloads DESC);

COMMENT ON INDEX idx_modes_downloads IS
  'Optimizes sorting by download count';

-- Index: Sort by likes (community favorites)
CREATE INDEX IF NOT EXISTS idx_modes_likes
  ON modes(likes DESC);

COMMENT ON INDEX idx_modes_likes IS
  'Optimizes sorting by like count';

-- Index: Sort by rating (highest rated)
CREATE INDEX IF NOT EXISTS idx_modes_rating
  ON modes(rating DESC NULLS LAST);

COMMENT ON INDEX idx_modes_rating IS
  'Optimizes sorting by rating, placing unrated modes last';

-- Index: Full-text search on name and description
CREATE INDEX IF NOT EXISTS idx_modes_search
  ON modes USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  );

COMMENT ON INDEX idx_modes_search IS
  'Full-text search index for mode name and description';

-- Composite index: Public modes sorted by creation date
CREATE INDEX IF NOT EXISTS idx_modes_public_created
  ON modes(is_public, created_at DESC)
  WHERE is_public = true;

COMMENT ON INDEX idx_modes_public_created IS
  'Optimizes catalog browsing with default sort';

-- Composite index: Public modes by category and creation date
CREATE INDEX IF NOT EXISTS idx_modes_public_category_created
  ON modes(is_public, category, created_at DESC)
  WHERE is_public = true;

COMMENT ON INDEX idx_modes_public_category_created IS
  'Optimizes filtered catalog browsing by category';

-- ============================================================================
-- MODE_LIKES TABLE INDEXES
-- ============================================================================

-- Index: Lookup likes by mode (for displaying like counts)
CREATE INDEX IF NOT EXISTS idx_mode_likes_mode
  ON mode_likes(mode_id);

COMMENT ON INDEX idx_mode_likes_mode IS
  'Optimizes counting likes for a specific mode';

-- Index: Lookup likes by user (user's liked modes)
CREATE INDEX IF NOT EXISTS idx_mode_likes_user
  ON mode_likes(user_id);

COMMENT ON INDEX idx_mode_likes_user IS
  'Optimizes queries for modes liked by a specific user';

-- Composite index: Check if user liked a specific mode
CREATE INDEX IF NOT EXISTS idx_mode_likes_user_mode
  ON mode_likes(user_id, mode_id);

COMMENT ON INDEX idx_mode_likes_user_mode IS
  'Optimizes checking if a specific user liked a specific mode';

-- ============================================================================
-- MODE_RATINGS TABLE INDEXES
-- ============================================================================

-- Index: Lookup ratings by mode (for calculating averages)
CREATE INDEX IF NOT EXISTS idx_mode_ratings_mode
  ON mode_ratings(mode_id);

COMMENT ON INDEX idx_mode_ratings_mode IS
  'Optimizes aggregating ratings for a specific mode';

-- Index: Lookup ratings by user (user's rating history)
CREATE INDEX IF NOT EXISTS idx_mode_ratings_user
  ON mode_ratings(user_id);

COMMENT ON INDEX idx_mode_ratings_user IS
  'Optimizes queries for ratings by a specific user';

-- Composite index: Recent ratings (for activity feeds)
CREATE INDEX IF NOT EXISTS idx_mode_ratings_created
  ON mode_ratings(mode_id, created_at DESC);

COMMENT ON INDEX idx_mode_ratings_created IS
  'Optimizes displaying recent ratings for a mode';

-- ============================================================================
-- MODE_VERSIONS TABLE INDEXES
-- ============================================================================

-- Index: Lookup versions by mode (version history)
CREATE INDEX IF NOT EXISTS idx_mode_versions_mode
  ON mode_versions(mode_id, created_at DESC);

COMMENT ON INDEX idx_mode_versions_mode IS
  'Optimizes retrieving version history for a mode';

-- Index: Lookup specific version
CREATE INDEX IF NOT EXISTS idx_mode_versions_mode_version
  ON mode_versions(mode_id, version);

COMMENT ON INDEX idx_mode_versions_mode_version IS
  'Optimizes retrieving a specific version of a mode';

-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

-- Index: Order categories by display order
CREATE INDEX IF NOT EXISTS idx_categories_display_order
  ON categories(display_order);

COMMENT ON INDEX idx_categories_display_order IS
  'Optimizes ordering categories for display';

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for query planner optimization
ANALYZE modes;
ANALYZE mode_likes;
ANALYZE mode_ratings;
ANALYZE mode_versions;
ANALYZE categories;
