---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.os_name

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.os_name)
------------------------------
CREATE OR REPLACE FUNCTION public.os_name()
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$SELECT 'linux'::text;$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.os_name)
---------------------------------------------------------------------------
