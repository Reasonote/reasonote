CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
-- Required to avoid circular dependency with RLS policies
SECURITY DEFINER
AS $function$
DECLARE
    current_user_id typed_uuid;
    user_sysdata_record RECORD;
BEGIN
    -- Get current rsn_user_id
    current_user_id := public.current_rsn_user_id();
    
    -- If no user is logged in, return false
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get corresponding rsn_user_sysdata
    SELECT * INTO user_sysdata_record 
    FROM rsn_user_sysdata 
    WHERE rsn_user_id = current_user_id::text;

    -- If no sysdata found, return false
    IF user_sysdata_record IS NULL THEN
        RETURN false;
    END IF;

    -- Check if extra_license_info->>'Reasonote-Admin' is true
    RETURN (
        user_sysdata_record.extra_license_info->>'Reasonote-Admin' = 'true'
    );
END;
$function$
;