---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.add_result

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.add_result)
------------------------------
CREATE OR REPLACE FUNCTION public.add_result(boolean, boolean, text, text, text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NOT $1 THEN PERFORM _set('failed', _get('failed') + 1); END IF;
    RETURN nextval('__tresults___numb_seq');
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.add_result)
---------------------------------------------------------------------------
