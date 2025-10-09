-- Generate friendly screen names like "happy-panda-42"

-- Create function to generate friendly screen names
CREATE OR REPLACE FUNCTION generate_friendly_screenname()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'happy', 'clever', 'bright', 'swift', 'brave', 'calm', 'cool', 'eager',
    'fair', 'gentle', 'jolly', 'kind', 'lively', 'merry', 'nice', 'proud',
    'quick', 'quiet', 'witty', 'wise', 'bold', 'cosmic', 'daring', 'epic',
    'fancy', 'glad', 'groovy', 'keen', 'lucky', 'magic', 'neat', 'noble',
    'peppy', 'super', 'wild', 'zany', 'stellar', 'prime', 'radiant', 'shiny'
  ];
  nouns TEXT[] := ARRAY[
    'panda', 'falcon', 'tiger', 'eagle', 'bear', 'wolf', 'fox', 'hawk',
    'lion', 'otter', 'raven', 'swan', 'whale', 'lynx', 'cobra', 'crane',
    'moose', 'bison', 'gecko', 'koala', 'lemur', 'meerkat', 'Phoenix', 'dragon',
    'unicorn', 'griffin', 'pegasus', 'sphinx', 'hydra', 'kraken', 'comet',
    'nebula', 'pulsar', 'quasar', 'nova', 'meteor', 'aurora', 'zenith', 'quantum'
  ];
  adj TEXT;
  noun TEXT;
  num TEXT;
BEGIN
  -- Select random adjective and noun
  adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
  -- Generate random 2-3 digit number
  num := (10 + floor(random() * 990))::text;

  RETURN adj || '-' || noun || '-' || num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_friendly_screenname() IS 'Generates memorable anonymous screen names like "happy-panda-42"';

-- Update the trigger function to generate friendly names
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_name TEXT;
  attempt_count INT := 0;
BEGIN
  -- Generate random friendly screen name
  LOOP
    random_name := generate_friendly_screenname();

    -- Try to insert
    BEGIN
      INSERT INTO user_profiles (id, screen_name)
      VALUES (NEW.id, random_name);

      RETURN NEW;
    EXCEPTION
      WHEN unique_violation THEN
        -- Try again with a new random name
        attempt_count := attempt_count + 1;
        IF attempt_count > 20 THEN
          -- Fallback to UUID-based name if we can't find a unique friendly name
          random_name := CONCAT('user-', SUBSTRING(gen_random_uuid()::text, 1, 8));
          INSERT INTO user_profiles (id, screen_name)
          VALUES (NEW.id, random_name);
          RETURN NEW;
        END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates a user profile with friendly screen name on signup';

-- Update existing user profiles to friendly names
-- Temporarily disable trigger to avoid modified_at error
ALTER TABLE user_profiles DISABLE TRIGGER user_profiles_updated_at;

DO $$
DECLARE
  profile_record RECORD;
  new_name TEXT;
  attempt_count INT;
BEGIN
  FOR profile_record IN SELECT id FROM user_profiles LOOP
    attempt_count := 0;
    LOOP
      new_name := generate_friendly_screenname();

      BEGIN
        UPDATE user_profiles
        SET screen_name = new_name
        WHERE id = profile_record.id;

        EXIT; -- Success, exit the loop
      EXCEPTION
        WHEN unique_violation THEN
          attempt_count := attempt_count + 1;
          IF attempt_count > 20 THEN
            -- Fallback to UUID-based name
            new_name := CONCAT('user-', SUBSTRING(gen_random_uuid()::text, 1, 8));
            UPDATE user_profiles
            SET screen_name = new_name
            WHERE id = profile_record.id;
            EXIT;
          END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

-- Re-enable trigger
ALTER TABLE user_profiles ENABLE TRIGGER user_profiles_updated_at;
