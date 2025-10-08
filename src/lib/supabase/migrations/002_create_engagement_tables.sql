-- Migration: 002_create_engagement_tables.sql
-- Description: Create engagement tables for likes, ratings, and related functionality
-- Created: 2025-10-08

-- Mode likes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS mode_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode_id UUID NOT NULL REFERENCES modes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, mode_id)
);

COMMENT ON TABLE mode_likes IS 'Tracks which users have liked which modes';
COMMENT ON COLUMN mode_likes.user_id IS 'User who liked the mode';
COMMENT ON COLUMN mode_likes.mode_id IS 'Mode that was liked';

-- Mode ratings table (one rating per user per mode)
CREATE TABLE IF NOT EXISTS mode_ratings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode_id UUID NOT NULL REFERENCES modes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, mode_id)
);

COMMENT ON TABLE mode_ratings IS 'Stores user ratings and reviews for modes';
COMMENT ON COLUMN mode_ratings.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN mode_ratings.review IS 'Optional text review';

-- Trigger for updated_at on mode_ratings
CREATE TRIGGER mode_ratings_updated_at
  BEFORE UPDATE ON mode_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_at();

-- Function to update mode rating aggregate (maintains denormalized data)
CREATE OR REPLACE FUNCTION update_mode_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle both INSERT/UPDATE and DELETE operations
  IF TG_OP = 'DELETE' THEN
    UPDATE modes
    SET
      rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM mode_ratings WHERE mode_id = OLD.mode_id), 0),
      rating_count = (SELECT COUNT(*) FROM mode_ratings WHERE mode_id = OLD.mode_id)
    WHERE id = OLD.mode_id;
    RETURN OLD;
  ELSE
    UPDATE modes
    SET
      rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM mode_ratings WHERE mode_id = NEW.mode_id), 0),
      rating_count = (SELECT COUNT(*) FROM mode_ratings WHERE mode_id = NEW.mode_id)
    WHERE id = NEW.mode_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_mode_rating() IS 'Automatically updates aggregate rating and count on modes table';

-- Trigger to update mode rating aggregate after any change to mode_ratings
CREATE TRIGGER mode_ratings_update_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON mode_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mode_rating();
