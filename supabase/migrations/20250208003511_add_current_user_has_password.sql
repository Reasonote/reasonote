-- Create the current_user_has_password function
CREATE OR REPLACE FUNCTION public.current_user_has_password() 
RETURNS BOOLEAN 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE 
  retval BOOL;
BEGIN
  SELECT
    CASE 
      WHEN encrypted_password IS NULL OR encrypted_password = ''
        THEN FALSE 
      ELSE TRUE 
    END AS has_password
  FROM
    auth.users 
  INTO retval
  WHERE
    id = auth.uid();
    
  RETURN retval;
END;
$$ LANGUAGE plpgsql;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.current_user_has_password() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_password() TO authenticated;

-- Add comment explaining function
COMMENT ON FUNCTION public.current_user_has_password() IS 'Checks if the currently authenticated user has set a password. Returns true if they have a password set, false if not.';

-- Create new type for login_jwt return value
CREATE TYPE public.login_jwt_return_type AS (
    id typed_uuid,
    has_password boolean
);

DROP FUNCTION IF EXISTS public.login_jwt(text);
-- Update login_jwt function
CREATE OR REPLACE FUNCTION public.login_jwt(browser_timezone text DEFAULT 'UTC'::text)
RETURNS login_jwt_return_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    authId uuid;
    userId typed_uuid;
    rawUserData jsonb;
    oauthImageUrl text;
    existingProfile record;
    hasPassword boolean;
    result login_jwt_return_type;
BEGIN
    -- Call the auth.uid() function and store its result
    authId := auth.uid();

    -- If no authId, return null
    IF authId IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if a user with this authId already exists
    SELECT id INTO userId 
        FROM rsn_user 
        WHERE auth_id = authId;

    -- If the user doesn't exist, insert and get the new id
    IF userId IS NULL THEN
        INSERT INTO rsn_user (auth_id) 
        VALUES (authId) 
        RETURNING id INTO userId;
    END IF;

    -- Check if profile exists
    SELECT * INTO existingProfile 
        FROM user_profile 
        WHERE rsn_user_id = userId;

    -- If profile doesn't exist, create it
    IF existingProfile IS NULL THEN
        -- Get the raw user data from auth.users()
        SELECT raw_user_meta_data
            INTO rawUserData
            FROM auth.users
            WHERE id = authId;

        -- Extract avatar_url from OAuth data if it exists
        oauthImageUrl := NULLIF(rawUserData->>'picture', '')::text;

        -- Only set profile_image_url if we have a trusted OAuth image
        IF oauthImageUrl IS NOT NULL THEN
            INSERT INTO user_profile (rsn_user_id, profile_image_url)
            VALUES (userId, oauthImageUrl);
        ELSE
            INSERT INTO user_profile (rsn_user_id)
            VALUES (userId);
        END IF;
    END IF;

    -- Set first_login_date if it is null
    UPDATE rsn_user
        SET first_login_date = NOW()
        WHERE auth_id = authId
        AND first_login_date IS NULL;

    -- Set last_login_date to NOW()
    UPDATE rsn_user
        SET last_login_date = NOW()
        WHERE auth_id = authId;

    -- Set the timezone for this session
    UPDATE rsn_user
        SET timezone = browser_timezone
        WHERE auth_id = authId;

    -- Get password status
    SELECT current_user_has_password() INTO hasPassword;

    -- Construct return value
    result.id := userId;
    result.has_password := hasPassword;

    RETURN result;
END;
$$;

-- Add comment for the new type
COMMENT ON TYPE public.login_jwt_return_type IS 'Return type for login_jwt that includes both the user ID and password status'; 