---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.is_anon_user

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.is_anon_user)
------------------------------
CREATE OR REPLACE FUNCTION public.is_anon_user(p_user_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_auth_id uuid;
  v_found_user record;
begin
  -- Get the raw auth.users ID
  v_auth_id := get_normal_user_id(p_user_id);

  -- Check if user exists and is anonymous
  select * into v_found_user 
  from auth.users 
  where id = v_auth_id;

  if not found then
    return false;
  end if;

  return v_found_user.is_anonymous = true;
end;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.is_anon_user)
---------------------------------------------------------------------------
