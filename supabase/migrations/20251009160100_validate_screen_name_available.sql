-- Migration: 20251009160100_validate_screen_name_available.sql
-- Description: Create function to validate screen name availability
-- Created: 2025-10-09

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
