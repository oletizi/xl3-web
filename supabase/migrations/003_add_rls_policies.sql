-- Migration: 003_add_rls_policies.sql
-- Description: Row Level Security policies for modes, likes, ratings, and versions
-- Created: 2025-10-08

-- Enable RLS on all tables
ALTER TABLE modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MODES TABLE POLICIES
-- ============================================================================

-- Policy: Anyone can view public modes
CREATE POLICY "Public modes are viewable by everyone"
  ON modes FOR SELECT
  USING (is_public = true);

COMMENT ON POLICY "Public modes are viewable by everyone" ON modes IS
  'Allows unauthenticated and authenticated users to view modes marked as public';

-- Policy: Users can view their own modes (public or private)
CREATE POLICY "Users can view own modes"
  ON modes FOR SELECT
  USING (auth.uid() = author_id);

COMMENT ON POLICY "Users can view own modes" ON modes IS
  'Allows users to view all their own modes regardless of public status';

-- Policy: Users can create modes (author_id must match auth.uid())
CREATE POLICY "Users can create modes"
  ON modes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

COMMENT ON POLICY "Users can create modes" ON modes IS
  'Ensures users can only create modes with themselves as the author';

-- Policy: Users can update their own modes
CREATE POLICY "Users can update own modes"
  ON modes FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

COMMENT ON POLICY "Users can update own modes" ON modes IS
  'Allows users to update only their own modes and prevents changing author_id';

-- Policy: Users can delete their own modes
CREATE POLICY "Users can delete own modes"
  ON modes FOR DELETE
  USING (auth.uid() = author_id);

COMMENT ON POLICY "Users can delete own modes" ON modes IS
  'Allows users to delete only their own modes';

-- Policy: Admins have full access (requires custom JWT claims)
CREATE POLICY "Admins have full access to modes"
  ON modes
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
  );

COMMENT ON POLICY "Admins have full access to modes" ON modes IS
  'Grants full CRUD access to users with admin role in JWT claims';

-- ============================================================================
-- MODE_LIKES TABLE POLICIES
-- ============================================================================

-- Policy: Anyone can view likes on public modes
CREATE POLICY "Public mode likes are viewable"
  ON mode_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_likes.mode_id
      AND modes.is_public = true
    )
  );

COMMENT ON POLICY "Public mode likes are viewable" ON mode_likes IS
  'Allows viewing likes for public modes only';

-- Policy: Users can view their own likes
CREATE POLICY "Users can view own likes"
  ON mode_likes FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own likes" ON mode_likes IS
  'Allows users to see which modes they have liked';

-- Policy: Authenticated users can like public modes
CREATE POLICY "Authenticated users can like modes"
  ON mode_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_likes.mode_id
      AND modes.is_public = true
    )
  );

COMMENT ON POLICY "Authenticated users can like modes" ON mode_likes IS
  'Allows authenticated users to like public modes only';

-- Policy: Users can unlike modes they liked
CREATE POLICY "Users can unlike modes"
  ON mode_likes FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can unlike modes" ON mode_likes IS
  'Allows users to remove their own likes';

-- ============================================================================
-- MODE_RATINGS TABLE POLICIES
-- ============================================================================

-- Policy: Anyone can view ratings on public modes
CREATE POLICY "Public mode ratings are viewable"
  ON mode_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_ratings.mode_id
      AND modes.is_public = true
    )
  );

COMMENT ON POLICY "Public mode ratings are viewable" ON mode_ratings IS
  'Allows viewing ratings and reviews for public modes';

-- Policy: Users can view their own ratings
CREATE POLICY "Users can view own ratings"
  ON mode_ratings FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own ratings" ON mode_ratings IS
  'Allows users to see their own ratings and reviews';

-- Policy: Authenticated users can rate public modes
CREATE POLICY "Authenticated users can rate modes"
  ON mode_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_ratings.mode_id
      AND modes.is_public = true
    )
  );

COMMENT ON POLICY "Authenticated users can rate modes" ON mode_ratings IS
  'Allows authenticated users to rate and review public modes';

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON mode_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own ratings" ON mode_ratings IS
  'Allows users to modify their existing ratings and reviews';

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON mode_ratings FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own ratings" ON mode_ratings IS
  'Allows users to remove their ratings and reviews';

-- ============================================================================
-- MODE_VERSIONS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view versions of modes they can access
CREATE POLICY "Users can view accessible mode versions"
  ON mode_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_versions.mode_id
      AND (modes.is_public = true OR modes.author_id = auth.uid())
    )
  );

COMMENT ON POLICY "Users can view accessible mode versions" ON mode_versions IS
  'Allows viewing version history for public modes or user''s own modes';

-- Policy: Only mode authors can create versions
CREATE POLICY "Authors can create mode versions"
  ON mode_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_versions.mode_id
      AND modes.author_id = auth.uid()
    )
  );

COMMENT ON POLICY "Authors can create mode versions" ON mode_versions IS
  'Allows only mode authors to create version history entries';

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- Categories are public (read-only for all users)
-- No RLS needed - all users can read, only admins can modify via Supabase dashboard
-- Not enabling RLS on categories table as it's meant to be fully public
