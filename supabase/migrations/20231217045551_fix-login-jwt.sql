ALTER TABLE rsn_user
    ADD COLUMN first_login_date timestamp with time zone,
    ADD COLUMN last_login_date timestamp with time zone;

DROP FUNCTION IF EXISTS public.login_jwt();

CREATE OR REPLACE FUNCTION public.login_jwt()
RETURNS typed_uuid
LANGUAGE plpgsql
AS $function$
DECLARE
    authId uuid;
    userId typed_uuid;
BEGIN
    -- Call the auth.uid() function and store its result
    authId := auth.uid();

    -- Check if a user with this authId already exists
    SELECT id INTO userId FROM rsn_user WHERE auth_id = authId;

    -- If the user doesn't exist, insert and get the new id
    IF userId IS NULL THEN
        INSERT INTO rsn_user (auth_id) VALUES (authId) RETURNING id INTO userId;
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
$function$
;