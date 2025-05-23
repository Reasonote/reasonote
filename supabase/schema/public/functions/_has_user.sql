---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public._has_user

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public._has_user)
------------------------------
CREATE OR REPLACE FUNCTION public._has_user(name)
 RETURNS boolean
 LANGUAGE sql
 STRICT
AS $function$
    SELECT EXISTS( SELECT true FROM pg_catalog.pg_user WHERE usename = $1);
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public._has_user)
---------------------------------------------------------------------------
