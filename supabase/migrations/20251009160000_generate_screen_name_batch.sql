-- Migration: 20251009160000_generate_screen_name_batch.sql
-- Description: Create function to generate batches of unique screen names
-- Created: 2025-10-09

CREATE OR REPLACE FUNCTION generate_screen_name_batch(count INTEGER DEFAULT 10)
RETURNS TABLE(screen_name TEXT) AS $$
DECLARE
  max_attempts INT := count * 5; -- Allow up to 5x attempts
  attempts INT := 0;
  generated_name TEXT;
  names TEXT[] := '{}';
BEGIN
  -- Generate unique screen names
  WHILE array_length(names, 1) IS NULL OR array_length(names, 1) < count AND attempts < max_attempts LOOP
    attempts := attempts + 1;
    generated_name := generate_friendly_screenname();

    -- Check if name is unique (not in existing profiles and not in our batch)
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles WHERE user_profiles.screen_name = generated_name
    ) AND NOT (generated_name = ANY(names)) THEN
      names := array_append(names, generated_name);
    END IF;
  END LOOP;

  -- Return the generated names
  RETURN QUERY SELECT unnest(names);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_screen_name_batch(INTEGER) IS
  'Generates a batch of unique friendly screen names for user selection';
