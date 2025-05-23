---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.get_normal_user_id

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.get_normal_user_id)
------------------------------
CREATE OR REPLACE FUNCTION public.get_normal_user_id(p_user_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
begin
  -- If the user_id starts with rsnusr_, remove it
  if p_user_id like 'rsnusr_%' then
    return (substring(p_user_id from 8))::uuid;
  end if;
  -- Otherwise try to cast directly to UUID
  return p_user_id::uuid;
end;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.get_normal_user_id)
---------------------------------------------------------------------------
