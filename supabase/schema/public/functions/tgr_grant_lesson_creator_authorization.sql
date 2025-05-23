---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.tgr_grant_lesson_creator_authorization

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.tgr_grant_lesson_creator_authorization)
------------------------------
CREATE OR REPLACE FUNCTION public.tgr_grant_lesson_creator_authorization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
BEGIN
  -- When a new lesson is created, grant the creator 'owner' access in memauth
  INSERT INTO memauth (id, resource_lesson_id, resource_entity_type, access_level, principal_user_id)
  VALUES (generate_typed_uuid('memauth'), NEW.id, 'lesson', 'owner', current_rsn_user_id());
  RETURN NEW;
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.tgr_grant_lesson_creator_authorization)
---------------------------------------------------------------------------
