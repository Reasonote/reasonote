---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.tgr_skill_set_root_skill_id

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.tgr_skill_set_root_skill_id)
------------------------------
CREATE OR REPLACE FUNCTION public.tgr_skill_set_root_skill_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.root_skill_id IS NULL THEN
        -- If generated_from_skill_path exists and has elements, use the first one
        IF NEW.generated_from_skill_path IS NOT NULL AND array_length(NEW.generated_from_skill_path, 1) > 0 THEN
            NEW.root_skill_id := NEW.generated_from_skill_path[1];
        ELSE
            -- Otherwise, set to self
            NEW.root_skill_id := NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.tgr_skill_set_root_skill_id)
---------------------------------------------------------------------------
