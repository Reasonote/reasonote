-- Update the login_jwt function
CREATE OR REPLACE FUNCTION public.login_jwt()
RETURNS typed_uuid
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    authId uuid;
    userId typed_uuid;
    rawUserData jsonb;
    oauthImageUrl text;
    existingProfile record;
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

    RETURN userId;
END;
$$;