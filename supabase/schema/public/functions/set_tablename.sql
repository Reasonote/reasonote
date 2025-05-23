---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.set_tablename

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.set_tablename)
------------------------------
CREATE OR REPLACE FUNCTION public.set_tablename()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.tablename := public.get_tablename_from_abbreviation(
        substring(NEW._ref_id, 0, strpos(NEW._ref_id, '_'))
    );
    RETURN NEW;
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.set_tablename)
---------------------------------------------------------------------------
