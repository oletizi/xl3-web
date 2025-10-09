-- Migration: 20251009160200_profile_update_policy.sql
-- Description: Add RLS policies for profile updates
-- Created: 2025-10-09

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can update own profile" ON user_profiles IS
  'Allows users to update only their own profile';

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

COMMENT ON POLICY "Users can read own profile" ON user_profiles IS
  'Allows users to read their own profile (in addition to public visibility)';
