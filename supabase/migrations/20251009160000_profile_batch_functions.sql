-- ============================================================================
-- PROFILE SCREEN NAME BATCH GENERATION AND VALIDATION
-- Adds batch generation and validation functions for user profile screen names
-- ============================================================================

-- Function to generate a batch of unique screen names
CREATE OR REPLACE FUNCTION generate_screen_name_batch(count INTEGER DEFAULT 10)
RETURNS TABLE(screen_name TEXT) AS $$
DECLARE
  max_attempts INT := count * 5; -- Allow up to 5x attempts
  attempts INT := 0;
  generated_name TEXT;
  names TEXT[] := '{}';
BEGIN
  -- Generate unique screen names
  WHILE array_length(names, 1) < count AND attempts < max_attempts LOOP
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

-- Function to validate that a screen name is available
CREATE OR REPLACE FUNCTION validate_screen_name_available(name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE screen_name = name
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_screen_name_available(TEXT) IS
  'Checks if a screen name is available (not already taken)';

-- Add RLS policies for profile updates
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
