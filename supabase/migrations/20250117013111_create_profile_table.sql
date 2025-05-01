-- First create a function to generate usernames
CREATE OR REPLACE FUNCTION generate_username(given_name TEXT, family_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    test_username TEXT;
    suffix_num INTEGER;
    attempts INTEGER := 0;
    MAX_ATTEMPTS CONSTANT INTEGER := 10;
BEGIN
    -- If both names are null/empty, use 'user' as base
    IF (given_name IS NULL OR given_name = '') AND (family_name IS NULL OR family_name = '') THEN
        base_username := 'user';
    -- If only given_name exists
    ELSIF family_name IS NULL OR family_name = '' THEN
        base_username := LOWER(REGEXP_REPLACE(given_name, '[^a-zA-Z0-9]', '_', 'g'));
    -- If only family_name exists
    ELSIF given_name IS NULL OR given_name = '' THEN
        base_username := LOWER(REGEXP_REPLACE(family_name, '[^a-zA-Z0-9]', '_', 'g'));
    -- If both exist, use first letter + family name
    ELSE
        base_username := LOWER(LEFT(given_name, 1) || REGEXP_REPLACE(family_name, '[^a-zA-Z0-9]', '_', 'g'));
    END IF;
    
    -- Ensure minimum length
    IF LENGTH(base_username) < 3 THEN
        base_username := base_username || 'user';
    END IF;
    
    -- First try the base username without any suffix
    IF NOT EXISTS (SELECT 1 FROM user_profile WHERE username = base_username) THEN
        RETURN base_username;
    END IF;
    
    -- If there's a conflict, then try with suffixes
    LOOP
        -- Generate random number between 1 and 9999
        suffix_num := floor(random() * 9999 + 1)::INTEGER;
        test_username := base_username || suffix_num::TEXT;
        
        -- Exit if we found an unused username or hit max attempts
        EXIT WHEN NOT EXISTS (SELECT 1 FROM user_profile WHERE username = test_username) 
                  OR attempts >= MAX_ATTEMPTS;
                  
        attempts := attempts + 1;
    END LOOP;
    
    -- If we hit max attempts, fall back to timestamp-based suffix
    IF attempts >= MAX_ATTEMPTS THEN
        test_username := base_username || floor(extract(epoch from now()))::TEXT;
    END IF;
    
    RETURN test_username;
END;
$$ LANGUAGE plpgsql;

-- Add function to generate display name
CREATE OR REPLACE FUNCTION generate_display_name(given_name TEXT, family_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- If both names are null/empty, return null
    IF (given_name IS NULL OR given_name = '') AND (family_name IS NULL OR family_name = '') THEN
        RETURN NULL;
    -- If only given_name exists
    ELSIF family_name IS NULL OR family_name = '' THEN
        RETURN given_name;
    -- If only family_name exists
    ELSIF given_name IS NULL OR given_name = '' THEN
        RETURN family_name;
    -- If both exist, combine them
    ELSE
        RETURN given_name || ' ' || family_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create user_profile table
CREATE TABLE public.user_profile (
    id text PRIMARY KEY DEFAULT public.generate_typed_uuid('usrprof'::text),
    rsn_user_id TEXT NOT NULL UNIQUE REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    profile_image_url TEXT,
    show_activity_graph BOOLEAN DEFAULT true,
    pinned_items TEXT[] DEFAULT '{}',
    badges JSONB DEFAULT '[]',
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT,
    CONSTRAINT profile_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- CONSTRAINT profile_username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')

-- Modify the trigger function to set both username and display_name
CREATE OR REPLACE FUNCTION set_default_username()
RETURNS TRIGGER AS $$
DECLARE
    v_given_name TEXT;
    v_family_name TEXT;
BEGIN
    -- Get user info from rsn_user
    SELECT given_name, family_name
    INTO v_given_name, v_family_name
    FROM rsn_user
    WHERE id = NEW.rsn_user_id;

    -- Set username if it's NULL
    IF NEW.username IS NULL THEN
        NEW.username := generate_username(v_given_name, v_family_name);
    END IF;

    -- Set display_name if it's NULL
    IF NEW.display_name IS NULL THEN
        NEW.display_name := generate_display_name(v_given_name, v_family_name);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_username
    BEFORE INSERT ON user_profile
    FOR EACH ROW
    EXECUTE FUNCTION set_default_username();

-- Add indexes
CREATE INDEX user_profile_rsn_user_id_idx ON public.user_profile(rsn_user_id);
CREATE INDEX user_profile_username_idx ON public.user_profile(username);

-- Add RLS policies
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Everyone can view user profiles
CREATE POLICY "User profiles are viewable by everyone" ON public.user_profile
    FOR SELECT USING (true);

-- Users can only update their own user profile
CREATE POLICY "Users can update own user profile" ON public.user_profile
    FOR UPDATE USING (auth.uid()::text = (
        SELECT auth_id::text 
        FROM public.rsn_user 
        WHERE id = rsn_user_id
    ));

-- Users can only insert their own user profile
CREATE POLICY "Users can insert own user profile" ON public.user_profile
    FOR INSERT WITH CHECK (auth.uid()::text = (
        SELECT auth_id::text 
        FROM public.rsn_user 
        WHERE id = rsn_user_id
    ));

CREATE TRIGGER run_tgr_apply_audit 
    BEFORE INSERT OR UPDATE 
    ON public.user_profile 
FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Grant access to authenticated users
GRANT ALL ON public.user_profile TO authenticated;
GRANT ALL ON public.user_profile TO service_role;
GRANT SELECT ON public.user_profile TO anon; 

-- Test the migration with a sample user
DO $$
DECLARE
    test_user_id TEXT;
    resulting_username TEXT;
    resulting_display_name TEXT;
BEGIN
    -- Get a random existing user
    SELECT id INTO test_user_id FROM public.rsn_user LIMIT 1;
    
    -- Log the user's details before migration
    RAISE NOTICE 'Testing migration for user %', test_user_id;
    RAISE NOTICE 'Original user data:';
    RAISE NOTICE '%', (SELECT json_build_object(
        'id', id,
        'given_name', given_name,
        'family_name', family_name
    )::TEXT FROM public.rsn_user WHERE id = test_user_id);

    -- Create user profiles for existing users
    INSERT INTO public.user_profile (rsn_user_id)
    SELECT id 
    FROM public.rsn_user ru
    WHERE NOT EXISTS (
        -- Only create for users that don't already have a profile
        SELECT 1 
        FROM public.user_profile up 
        WHERE up.rsn_user_id = ru.id
    );

    -- Verify the test user's profile
    SELECT username, display_name 
    INTO resulting_username, resulting_display_name
    FROM public.user_profile 
    WHERE rsn_user_id = test_user_id;

    -- Log the results
    RAISE NOTICE 'Created profile:';
    RAISE NOTICE '%', json_build_object(
        'username', resulting_username,
        'display_name', resulting_display_name
    )::TEXT;

    -- Basic validation
    IF resulting_username IS NULL THEN
        RAISE EXCEPTION 'Migration failed: username is null for test user';
    END IF;
END $$; 