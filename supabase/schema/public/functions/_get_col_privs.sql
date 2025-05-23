---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public._get_col_privs

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public._get_col_privs)
------------------------------
CREATE OR REPLACE FUNCTION public._get_col_privs(name, text, name)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
    privs  TEXT[] := ARRAY['INSERT', 'REFERENCES', 'SELECT', 'UPDATE'];
    grants TEXT[] := '{}';
BEGIN
    FOR i IN 1..array_upper(privs, 1) LOOP
        IF pg_catalog.has_column_privilege($1, $2, $3, privs[i]) THEN
            grants := grants || privs[i];
        END IF;
    END LOOP;
    RETURN grants;
EXCEPTION
    -- Not a valid column name.
    WHEN undefined_column THEN RETURN '{undefined_column}';
    -- Not a valid table name.
    WHEN undefined_table THEN RETURN '{undefined_table}';
    -- Not a valid role.
    WHEN undefined_object THEN RETURN '{undefined_role}';
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public._get_col_privs)
---------------------------------------------------------------------------
