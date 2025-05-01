-- Function to split name into given_name and family_name
CREATE OR REPLACE FUNCTION public.split_full_name(full_name text)
RETURNS TABLE(given_name text, family_name text) AS $$
BEGIN
    -- Split the full name by whitespace
    -- First part becomes given_name, rest becomes family_name
    RETURN QUERY 
    SELECT 
        (regexp_split_to_array(full_name, '\s+'))[1] as given_name,
        array_to_string((regexp_split_to_array(full_name, '\s+'))[2:], ' ') as family_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the existing auth sync trigger function to handle both email and name sync
CREATE OR REPLACE FUNCTION public.tgr_user_auth_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user auth.users%ROWTYPE;
    split_names record;
    has_name_columns boolean;
BEGIN
    -- Get the auth user record
    SELECT * FROM auth.users 
        WHERE id = new.auth_id 
        INTO auth_user;

    -- Set the email
    new.auth_email := auth_user.email;

    -- Check if the target table has name columns
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME
        AND column_name IN ('given_name', 'family_name')
    ) INTO has_name_columns;

    -- Only proceed with name updates if the table has the required columns
    IF has_name_columns THEN
        -- Try to get column values, defaulting to empty string if they don't exist
        IF (COALESCE(new.given_name, '') = '') AND 
           (COALESCE(new.family_name, '') = '') AND
           auth_user.raw_user_meta_data->>'name' IS NOT NULL THEN
            
            -- Split the name
            SELECT * INTO split_names 
            FROM public.split_full_name(auth_user.raw_user_meta_data->>'name');

            -- Update the names
            new.given_name := split_names.given_name;
            new.family_name := split_names.family_name;
        END IF;
    END IF;

    RETURN new;
END;
$$;

-- Update existing users
UPDATE public.rsn_user u
SET 
    given_name = split_names.given_name,
    family_name = split_names.family_name
FROM 
    auth.users au,
    public.split_full_name(au.raw_user_meta_data->>'name') split_names
WHERE 
    u.auth_id = au.id 
    AND au.raw_user_meta_data->>'name' IS NOT NULL
    AND (u.given_name IS NULL OR u.given_name = '')
    AND (u.family_name IS NULL OR u.family_name = ''); 