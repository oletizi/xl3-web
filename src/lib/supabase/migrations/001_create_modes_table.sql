-- Migration: 001_create_modes_table.sql
-- Description: Create core modes table with user ownership and engagement metrics
-- Created: 2025-10-08

-- Modes table (core storage for custom controller modes)
CREATE TABLE IF NOT EXISTS modes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Mode metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',

  -- Mode data (JSONB for flexibility and queryability)
  controls JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Visibility flags
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_official BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,

  -- Engagement metrics (denormalized for performance)
  downloads INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  fork_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,

  -- Discovery metadata
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  thumbnail TEXT, -- Base64 or URL (future: Supabase Storage)

  -- Relationships
  parent_mode_id UUID REFERENCES modes(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_version CHECK (version ~ '^\d+\.\d+\.\d+$')
);

-- Add comment for documentation
COMMENT ON TABLE modes IS 'Stores custom MIDI controller modes created by users';
COMMENT ON COLUMN modes.controls IS 'JSONB object containing control mappings (knobs, faders, buttons)';
COMMENT ON COLUMN modes.is_public IS 'Whether mode is visible in public catalog';
COMMENT ON COLUMN modes.is_official IS 'Marks official/verified modes';
COMMENT ON COLUMN modes.is_featured IS 'Featured modes shown prominently in UI';
COMMENT ON COLUMN modes.parent_mode_id IS 'Reference to original mode if this is a fork';

-- Mode versions table (version history tracking)
CREATE TABLE IF NOT EXISTS mode_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_id UUID NOT NULL REFERENCES modes(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  changes TEXT,
  controls JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(mode_id, version)
);

COMMENT ON TABLE mode_versions IS 'Tracks version history of mode changes';

-- Categories table (predefined mode categories)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,

  UNIQUE(name)
);

COMMENT ON TABLE categories IS 'Predefined categories for organizing modes';

-- Insert default categories
INSERT INTO categories (id, name, description, display_order) VALUES
  ('daw-control', 'DAW Control', 'Digital Audio Workstation control surfaces', 1),
  ('live-performance', 'Live Performance', 'Setups for live shows and DJing', 2),
  ('mixing-mastering', 'Mixing & Mastering', 'Studio mixing and mastering workflows', 3),
  ('instrument-control', 'Instrument Control', 'Hardware synth and instrument mappings', 4),
  ('genre-specific', 'Genre-Specific', 'Genre-optimized configurations', 5),
  ('educational', 'Educational', 'Learning and tutorial modes', 6)
ON CONFLICT (id) DO NOTHING;

-- Trigger function to update modified_at timestamp
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_modified_at() IS 'Automatically updates modified_at timestamp on row update';

-- Apply trigger to modes table
CREATE TRIGGER modes_modified_at
  BEFORE UPDATE ON modes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_at();

-- Database functions for atomic operations
-- Function to increment likes atomically
CREATE OR REPLACE FUNCTION increment_likes(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET likes = likes + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_likes(UUID) IS 'Atomically increments like count for a mode';

-- Function to decrement likes atomically
CREATE OR REPLACE FUNCTION decrement_likes(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decrement_likes(UUID) IS 'Atomically decrements like count for a mode (minimum 0)';

-- Function to increment fork count atomically
CREATE OR REPLACE FUNCTION increment_fork_count(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET fork_count = fork_count + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_fork_count(UUID) IS 'Atomically increments fork count when mode is forked';

-- Function to increment views atomically
CREATE OR REPLACE FUNCTION increment_views(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET views = views + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_views(UUID) IS 'Atomically increments view count for a mode';

-- Function to increment downloads atomically
CREATE OR REPLACE FUNCTION increment_downloads(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET downloads = downloads + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_downloads(UUID) IS 'Atomically increments download count for a mode';
