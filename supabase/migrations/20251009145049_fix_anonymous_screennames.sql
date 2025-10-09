-- Fix screen names to be truly anonymous (no PII)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_name TEXT;
  attempt_count INT := 0;
BEGIN
  -- Generate random anonymous screen name
  LOOP
    random_name := CONCAT('user_', SUBSTRING(gen_random_uuid()::text, 1, 12));

    -- Try to insert
    BEGIN
      INSERT INTO user_profiles (id, screen_name)
      VALUES (NEW.id, random_name);

      RETURN NEW;
    EXCEPTION
      WHEN unique_violation THEN
        -- Try again with a new random name
        attempt_count := attempt_count + 1;
        IF attempt_count > 10 THEN
          -- Fallback to longer UUID if we somehow can't find a unique name
          random_name := CONCAT('user_', gen_random_uuid()::text);
          INSERT INTO user_profiles (id, screen_name)
          VALUES (NEW.id, random_name);
          RETURN NEW;
        END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Temporarily disable trigger to avoid modified_at error
ALTER TABLE user_profiles DISABLE TRIGGER user_profiles_updated_at;

-- Update existing user profiles to anonymous names
UPDATE user_profiles
SET screen_name = CONCAT('user_', SUBSTRING(gen_random_uuid()::text, 1, 12))
WHERE screen_name LIKE '%@%' OR screen_name ~ '^[a-z]+_[a-f0-9]{6}$';

-- Re-enable trigger
ALTER TABLE user_profiles ENABLE TRIGGER user_profiles_updated_at;
