---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public._grolist

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public._grolist)
------------------------------
CREATE OR REPLACE FUNCTION public._grolist(name)
 RETURNS oid[]
 LANGUAGE sql
AS $function$
    SELECT ARRAY(
        SELECT member
          FROM pg_catalog.pg_auth_members m
          JOIN pg_catalog.pg_roles r ON m.roleid = r.oid
         WHERE r.rolname =  $1
    );
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public._grolist)
---------------------------------------------------------------------------
