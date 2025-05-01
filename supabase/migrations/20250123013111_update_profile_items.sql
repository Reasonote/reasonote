
-- Update the trigger function to handle given_name and family_name
-- Taken with permission from Ishan's code
CREATE OR REPLACE FUNCTION public.tgr_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    -- Insert a row into public.rsn_user
    -- Setting the auth_id to the new user's id and including name fields
    insert into public.rsn_user (auth_id, given_name, family_name)
        values (new.id, new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'family_name');

    insert into public.rsn_user_sysdata (auth_id)
        values (new.id);

    -- Return the auth user row
    return new;
end;
$function$;


-- Update username generation to allow Unicode characters
CREATE OR REPLACE FUNCTION generate_username(given_name TEXT, family_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    test_username TEXT;
    suffix_num INTEGER;
    attempts INTEGER := 0;
    MAX_ATTEMPTS CONSTANT INTEGER := 10;
BEGIN
    -- Simplified core logic
    base_username := CASE
        WHEN (given_name IS NULL OR given_name = '') AND (family_name IS NULL OR family_name = '') THEN 'user'
        WHEN family_name IS NULL OR family_name = '' THEN REGEXP_REPLACE(given_name, '[^[:alnum:]_]', '_', 'g')
        WHEN given_name IS NULL OR given_name = '' THEN REGEXP_REPLACE(family_name, '[^[:alnum:]_]', '_', 'g')
        ELSE LEFT(REGEXP_REPLACE(given_name, '[^[:alnum:]_]', '_', 'g'), 1) || 
             REGEXP_REPLACE(family_name, '[^[:alnum:]_]', '_', 'g')
    END;

    -- Lowercase after processing
    base_username := LOWER(base_username);
    
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

-- Add format constraint after cleaning existing data
DO $$
BEGIN
    -- Temporarily disable the constraint if it exists
    ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS profile_username_format;
    
    -- Clean existing usernames (if any)
    UPDATE user_profile 
    SET username = REGEXP_REPLACE(username, '[^[:alnum:]_]', '_', 'g')
    WHERE username ~ '[^[:alnum:]_]';
    
    -- Add the constraint
    ALTER TABLE user_profile 
    ADD CONSTRAINT profile_username_format 
    CHECK (username ~ '^[[:alnum:]_]+$');
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
END $$; 