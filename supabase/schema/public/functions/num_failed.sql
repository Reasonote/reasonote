---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.num_failed

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.num_failed)
------------------------------
CREATE OR REPLACE FUNCTION public.num_failed()
 RETURNS integer
 LANGUAGE sql
 STRICT
AS $function$
    SELECT _get('failed');
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.num_failed)
---------------------------------------------------------------------------
