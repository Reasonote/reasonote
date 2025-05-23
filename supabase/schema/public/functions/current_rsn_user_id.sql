---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.current_rsn_user_id

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.current_rsn_user_id)
------------------------------
CREATE OR REPLACE FUNCTION public.current_rsn_user_id()
 RETURNS typed_uuid
 LANGUAGE plpgsql
 STABLE
AS $function$
  BEGIN
        IF auth.email() IS NULL THEN
            -- This covers cases where we're logged in as the service_role.
            IF auth.role() = 'service_role' THEN
                RETURN public.rsn_system_user_id();
            ELSE
                RETURN null;
            END IF;
        ELSE
            RETURN (SELECT id FROM rsn_user WHERE rsn_user.auth_id = auth.uid());
        END IF;
  END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.current_rsn_user_id)
---------------------------------------------------------------------------
