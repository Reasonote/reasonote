------------------------------------------------------------------------
-- Basic Extensions

-- Create PLV8 extension
CREATE EXTENSION IF NOT EXISTS plv8;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgtap;

-- 
-------------------------------------------------------------------------


------------------------------------------------------------------------
-- Create typed_uuid - domain & creator
-- 
CREATE DOMAIN typed_uuid AS 
   VARCHAR CHECK ((VALUE IS NULL) OR (split_part(value,'_', 2)::uuid IS NOT NULL));

CREATE OR REPLACE FUNCTION public.generate_typed_uuid(type_prefix text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$    
    BEGIN
        IF type_prefix IS NULL THEN
            RAISE EXCEPTION 'generate_typed_uuid must have a type_prefix passed to it.';
        ELSE
            IF strpos(type_prefix, '_') = 0 THEN  
                RETURN type_prefix || '_' || uuid_generate_v4();
            ELSE
                RAISE EXCEPTION 'generate_typed_uuid must have a type_prefix passed to it that does not contain an underscore. Got this: %', type_prefix;
            END IF;
        END IF;     
    END;                  
$function$
;

CREATE OR REPLACE FUNCTION public.is_valid_typed_uuid(type_prefix text, to_test typed_uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$	
	BEGIN
        IF split_part(to_test,'_', 1) <> type_prefix THEN
            return false;
        ELSE
            return true;
        END IF;  
	END;                  
$function$
;

-- 
-- Create domain & creator
------------------------------------------------------------------------

------------------------------------------------------------------------
-- BEGIN: Emails


CREATE OR REPLACE FUNCTION public.emails_match(first_email text, second_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
	begin
		return trim(both from first_email) ilike trim(both from second_email);
	end;        
$function$
;

GRANT ALL ON FUNCTION public.emails_match(first_email text, second_email text) TO anon;
GRANT ALL ON FUNCTION public.emails_match(first_email text, second_email text) TO authenticated;
GRANT ALL ON FUNCTION public.emails_match(first_email text, second_email text) TO service_role;

CREATE DOMAIN email AS 
   VARCHAR CHECK ((value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'));


-- END: Emails
------------------------------------------------------------------------


------------------------------------------------------------------------
-- USERS

CREATE TABLE public.rsn_user (
    auth_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users on delete cascade,
    id typed_uuid UNIQUE GENERATED ALWAYS AS ('rsnusr_' || auth_id::text) STORED,
    username text UNIQUE,
    given_name text,
    family_name text,
    CONSTRAINT rsn_user__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnusr', id))
);

-- Policies
create policy "rsn_user SELECT"
  on rsn_user for select
  using ( true );

create policy "rsn_user INSERT"
  on rsn_user for insert
  with check ( auth.uid() = auth_id );

create policy "rsn_user UPDATE"
  on rsn_user for update
  using ( auth.uid() = auth_id );

ALTER TABLE public.rsn_user ENABLE ROW LEVEL SECURITY;


-- current_rsn_user_id
CREATE OR REPLACE FUNCTION public.current_rsn_user_id()
 RETURNS typed_uuid 
 LANGUAGE plpgsql
 STABLE
AS $function$
  BEGIN
        IF auth.email() IS NULL THEN
            -- This covers cases where we're logged in as the service_role.
            IF auth.role() = 'service_role' THEN
                RETURN public.rsn_system_user_id();
            ELSE
                RETURN null;
            END IF;
        ELSE
            RETURN (SELECT id FROM rsn_user WHERE rsn_user.auth_id = auth.uid());
        END IF;
  END;
$function$
;

GRANT ALL ON FUNCTION public.current_rsn_user_id() TO anon;
GRANT ALL ON FUNCTION public.current_rsn_user_id() TO authenticated;
GRANT ALL ON FUNCTION public.current_rsn_user_id() TO service_role;

-- SYSTEM USER
CREATE OR REPLACE FUNCTION public.rsn_system_user_auth_id()
 RETURNS uuid
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$	
	BEGIN
        RETURN '01010101-0101-0101-0101-010134501073'::uuid;
	END;                  
$function$
;

CREATE OR REPLACE FUNCTION public.rsn_system_user_id()
 RETURNS typed_uuid
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$	
	BEGIN
        RETURN ('rsnusr_' || public.rsn_system_user_auth_id())::typed_uuid;
	END;                  
$function$
;

-- Supabase user table
-- DEFAULT PASSWORD: 'rootchangeme'
INSERT INTO auth.users (id, instance_id, email, email_confirmed_at, encrypted_password, aud, "role", raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
	('01010101-0101-0101-0101-010134501073', '00000000-0000-0000-0000-000000000000', 'system@reasonote.com', '2023-02-24T19:57:41.849Z', '$2a$10$.ILG3Y6N5i7p6REPTTBnIOLTD6qG40kHgBExz.trHSsRz/ffFqM8e', 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '2023-02-24T19:57:41.849Z', '2023-02-24T19:57:41.849Z', '2023-02-24T19:57:41.849Z', '', '', '', '');

-- Supabase identity table
INSERT INTO auth.identities (provider_id, user_id, "provider", identity_data, created_at, updated_at, last_sign_in_at) VALUES
	('02020202-0202-0202-0202-020134501073', '01010101-0101-0101-0101-010134501073', 'email', '{"sub":"01010101-0101-0101-0101-010134501073","email":"system@reasonote.com"}', '2023-02-24T19:57:41.849Z', '2023-02-24T19:57:41.849Z', '2023-02-24T19:57:41.849Z');

-- Finally, create the RSN_SYSTEM_USER rsn_user 
INSERT INTO rsn_user (auth_id, username, given_name, family_name) VALUES (
    '01010101-0101-0101-0101-010134501073',
    'reasonote',
    'Reasonote',
    ''
);

-- USERS
------------------------------------------------------------------------

------------------------------------------------------------------------
-- BEGIN Various Functions

CREATE TYPE operation_log_process_status_enum AS ENUM (
    'pending',
    'in_progress', 
    'complete', 
    'failed'
);

CREATE TABLE public.operation_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    table_name text,
    trigger_name text,
    operation_when text,
    operation_type text,
    operation_level text,
    entity_id uuid,
    jsonb_diff jsonb,
    rsn_user_id typed_uuid DEFAULT public.current_rsn_user_id(),
    event_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    process_status public.operation_log_process_status_enum DEFAULT 'pending'::public.operation_log_process_status_enum,
    processed_date timestamp without time zone
);


ALTER TABLE public.operation_log OWNER TO postgres;
COMMENT ON TABLE public.operation_log IS '@graphql({"totalCount": {"enabled": true}})';
COMMENT ON COLUMN public.operation_log.table_name IS 'The name of the table the trigger was run on. Default value will be pulled from the TG_TABLE_NAME value when running the tgr_log_operation trigger.';
COMMENT ON COLUMN public.operation_log.trigger_name IS 'The name of the trigger that was run to populate the record. Default value will be log_operation otherwise the value should be pulled from TG_NAME.';
COMMENT ON COLUMN public.operation_log.operation_when IS 'The value for when the trigger was run. Possible values will be BEFORE, AFTER, or INSTEAD OF';
COMMENT ON COLUMN public.operation_log.operation_type IS 'The type of operation. Possible values will be INSERT, UPDATE, DELETE, or TRUNCATE';
COMMENT ON COLUMN public.operation_log.operation_level IS 'The trigger operations level. Possible values will be ROW or STATEMENT';
COMMENT ON COLUMN public.operation_log.entity_id IS 'The id of the entity that was affected by the operation. Using this id along with the table name should allow you to find the record that was changed. If the record was delete this id will be the id of the deleted record.';
COMMENT ON COLUMN public.operation_log.jsonb_diff IS 'A jsonb representation of the difference between the new record and the old record. On insert this will be the full record that was inserted and on delete this value will be null.';
COMMENT ON COLUMN public.operation_log.rsn_user_id IS 'A foreign key constraint was intentionally left off this column to allow us to keep records around even after a user is removed from our database.';
COMMENT ON COLUMN public.operation_log.event_date IS 'The date time when action to place.';

ALTER TABLE ONLY public.operation_log
    ADD CONSTRAINT operation_log_pkey PRIMARY KEY (id);

ALTER TABLE public.operation_log ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.operation_log TO service_role;

CREATE OR REPLACE FUNCTION public.tgr_log_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        _id uuid;
        _diff jsonb;
    BEGIN
        
        IF TG_OP = 'DELETE' THEN 
            _id = OLD.id;
        ELSE 
            _id = NEW.id;
        END IF;
        
        SELECT * 
        INTO _diff
        FROM json_diff_values(row_to_json(NEW.*), row_to_json(OLD.*));
        
        INSERT INTO public.operation_log (id, table_name, trigger_name, operation_when, operation_type, operation_level, entity_id, jsonb_diff, rsn_user_id, event_date)
        VALUES(uuid_generate_v4(), TG_TABLE_NAME, TG_NAME, TG_WHEN, TG_OP, TG_LEVEL, _id, _diff, current_rsn_user_id(), (now() AT TIME ZONE 'utc'::text));
        
        RETURN NEW;
    
    EXCEPTION 
        WHEN OTHERS THEN 
        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
        RETURN NEW;
    END;
$function$
;

GRANT ALL ON FUNCTION public.tgr_log_operation() TO anon;
GRANT ALL ON FUNCTION public.tgr_log_operation() TO authenticated;
GRANT ALL ON FUNCTION public.tgr_log_operation() TO service_role;

-- END Various Functions
------------------------------------------------------------------------



------------------------------------------------------------------------
-- BEGIN: Create basic triggers
-- 

CREATE OR REPLACE FUNCTION public.tgr_apply_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN

        /*
            On update we make sure the create_by and create_date is set to the 
            old value. This ensures that values aren't set to null by accident.
            We also make sure tp set the current user to the value of the person
            currently logged in. The function current_rsn_user_id will return null if
            the user is not found in the database. This means that when the service_role
            calls items with this trigger it will set the updated_by to null, but still
            update the record with the correct updated date.
        */
        IF TG_OP = 'UPDATE' THEN -- Update
            BEGIN
                NEW.created_by = OLD.created_by;
                NEW.created_date = OLD.created_date;

                NEW.updated_by = current_rsn_user_id();
                NEW.updated_date = (now() at time zone 'utc');
            END;
        END IF;

        /*
         On insert make sure the created_by and updated_by
         user is set to the current user even if it's being 
         set to a value on the frontend. We also set the
         current created_date and updated_date to standardize the
         timestamps.
        */
        IF TG_OP = 'INSERT' THEN -- Insert
            BEGIN
                NEW.created_by = current_rsn_user_id();
                NEW.created_date = (now() at time zone 'utc');

                NEW.updated_by = current_rsn_user_id();
                NEW.updated_date = (now() at time zone 'utc');
            END;
        END IF;

        RETURN NEW;
    END;
$function$
;

GRANT ALL ON FUNCTION public.tgr_apply_audit() TO anon;
GRANT ALL ON FUNCTION public.tgr_apply_audit() TO authenticated;
GRANT ALL ON FUNCTION public.tgr_apply_audit() TO service_role;

--
-- END: Create basic triggers
------------------------------------------------------------------------




------------------------------------------------------------------------
-- Create basic tables 
-- 

CREATE OR REPLACE FUNCTION public.text_whitespace_or_null(s text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    -- Determines if a string is all whitespace, or null
    BEGIN
        return (COALESCE(TRIM(s), '') = '');
    END;
$function$
;

GRANT ALL ON FUNCTION public.text_whitespace_or_null(s text) TO anon;
GRANT ALL ON FUNCTION public.text_whitespace_or_null(s text) TO authenticated;
GRANT ALL ON FUNCTION public.text_whitespace_or_null(s text) TO service_role;


CREATE OR REPLACE FUNCTION public.login_jwt()
 RETURNS SETOF rsn_user
 LANGUAGE plpgsql
AS $function$
    DECLARE
       user_id uuid;
       jwt_login_email text;
       jwt_first_name text;
       jwt_last_name text;
    BEGIN
        ------------------------------------------------------------
        -- Extract information from the JWT
        jwt_login_email = auth.jwt() ->> 'email';
        jwt_first_name = auth.jwt() ->> 'first_name';
        jwt_last_name = auth.jwt() ->> 'last_name';
        IF (text_whitespace_or_null(jwt_login_email)) THEN
            RAISE EXCEPTION 'JWT does not contain an email. This may have happened if you tried to call this function by a non-authenticated user, or using a system-level token which is not associated with an email.';
        END IF;

        ------------------------------------------------------------
        -- Fetch or Create the rsn_user
        IF (EXISTS(SELECT 1 FROM rsn_user WHERE emails_match(login_email, jwt_login_email))) THEN
            -- User EXISTS - RETURN USER
            SELECT id 
                FROM rsn_user up 
                WHERE emails_match(up.login_email, jwt_login_email) 
                INTO user_id;
        ELSE
            -- THE USER DOES NOT EXIST
            -- Add the user
            SELECT * 
                FROM add_user(jwt_first_name, jwt_last_name, jwt_login_email, 'FreeUser') 
                INTO user_id;
        END IF;

        --------------------------------------------------------------------------------
        -- We should have a user_id by now -- if not, something went wrong
        IF (user_id IS NULL) THEN
            RAISE EXCEPTION 'Could not find or create a user for the given JWT.';
        end if;

        --------------------------------------------------------------------------------
        -- Update the properties of this user, in accordance with the JWT
        -- Set first_name to the JWT value if the current value is null/empty.            
        UPDATE rsn_user
            SET first_name = jwt_first_name::text
            WHERE emails_match(login_email, jwt_login_email)
            AND text_whitespace_or_null(first_name);
        
        -- Set last_name to the JWT value if the current value is null/empty.            
        UPDATE rsn_user
            SET last_name = jwt_last_name::text
            WHERE emails_match(login_email, jwt_login_email)
            AND text_whitespace_or_null(last_name);

        -- Set first_login_date if it is null
        UPDATE rsn_user
            SET first_login_date = NOW()
            WHERE emails_match(login_email, jwt_login_email)
            AND first_login_date IS NULL;

        -- Set last_login_date to NOW()
        UPDATE rsn_user
            SET last_login_date = NOW()
            WHERE emails_match(login_email, jwt_login_email);
        
        --------------------------------------------------------------------------------
        -- Return the rsn_user
        RETURN query SELECT * FROM rsn_user WHERE id = user_id;
    END;
$function$
;

GRANT ALL ON FUNCTION public.login_jwt() TO anon;
GRANT ALL ON FUNCTION public.login_jwt() TO authenticated;
GRANT ALL ON FUNCTION public.login_jwt() TO service_role;


------------------------------------------------------------------------
-- BEGIN: Basic Graphql setup

comment on schema public is e'@graphql({"inflect_names": true})';

-- Graphql function expose
-- create function public.graphql(
--     "operationName" text default null,
--     query text default null,
--     variables jsonb default null
-- )
--     returns jsonb
--     language sql
-- as $$
--     select graphql.resolve(query, variables);
-- $$;

--
-- END: Basic Graphql setup
------------------------------------------------------------------------