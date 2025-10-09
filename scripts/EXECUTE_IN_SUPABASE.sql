-- ============================================================================
-- USER PROFILES MIGRATION
-- Execute this entire file in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/nmbzgmhttmeogwaxhqio/sql/new
-- ============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name VARCHAR(50) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT screen_name_length CHECK (char_length(screen_name) >= 3),
  CONSTRAINT screen_name_format CHECK (screen_name ~ '^[a-zA-Z0-9_-]+$'),
  UNIQUE(screen_name)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_user_profiles_screen_name ON user_profiles(screen_name);

-- Add comments
COMMENT ON TABLE user_profiles IS 'User profiles with anonymous screen names for public sharing';
COMMENT ON COLUMN user_profiles.screen_name IS 'Unique public screen name (3-50 chars, alphanumeric, -, _)';
COMMENT ON COLUMN user_profiles.bio IS 'Optional user biography';
COMMENT ON COLUMN user_profiles.avatar_url IS 'Optional avatar image URL';

-- Update trigger
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_at();

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- Auto-create profile function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, screen_name)
  VALUES (
    NEW.id,
    CONCAT(
      REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'),
      '_',
      SUBSTRING(gen_random_uuid()::text, 1, 6)
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO user_profiles (id, screen_name)
    VALUES (
      NEW.id,
      CONCAT('user_', SUBSTRING(gen_random_uuid()::text, 1, 12))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates a user profile with generated screen name on signup';

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create profiles for existing users
INSERT INTO user_profiles (id, screen_name)
SELECT
  id,
  CONCAT(
    REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'),
    '_',
    SUBSTRING(gen_random_uuid()::text, 1, 6)
  )
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY - Run after executing above
-- ============================================================================
-- SELECT * FROM user_profiles;
