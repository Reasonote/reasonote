
-- Change the `id` column on the User table to `text` type
ALTER TABLE public.rsn_user ALTER COLUMN id TYPE text;


ALTER TABLE public.bot ALTER COLUMN id TYPE text;
ALTER TABLE public.bot ALTER COLUMN forked_from TYPE text;
ALTER TABLE public.bot ALTER COLUMN created_by TYPE text;
ALTER TABLE public.bot ALTER COLUMN updated_by TYPE text;


--  id             | typed_uuid               |           | not null | generate_typed_uuid('cmsg'::text)
--  body           | text                     |           |          | 
--  created_date   | timestamp with time zone |           | not null | now()
--  updated_date   | timestamp with time zone |           | not null | now()
--  created_by_bot | typed_uuid               |           |          | 
--  created_by     | typed_uuid               |           |          | 
--  updated_by     | typed_uuid               |           |          | 
ALTER TABLE public.chat_message ALTER COLUMN id TYPE text;
ALTER TABLE public.chat_message ALTER COLUMN created_by_bot TYPE text;
ALTER TABLE public.chat_message ALTER COLUMN created_by TYPE text;
ALTER TABLE public.chat_message ALTER COLUMN updated_by TYPE text;

--                                         Table "public.chat"
--     Column    |           Type           | Collation | Nullable |              Default              
-- --------------+--------------------------+-----------+----------+-----------------------------------
--  id           | typed_uuid               |           | not null | generate_typed_uuid('chat'::text)
--  topic        | text                     |           |          | 
--  manual_title | text                     |           |          | 
--  auto_title   | text                     |           |          | 
--  is_public    | boolean                  |           | not null | false
--  created_date | timestamp with time zone |           | not null | now()
--  updated_date | timestamp with time zone |           | not null | now()
--  created_by   | typed_uuid               |           |          | 
--  updated_by   | typed_uuid               |           |          | 
ALTER TABLE public.chat ALTER COLUMN id TYPE text;
ALTER TABLE public.chat ALTER COLUMN created_by TYPE text;
ALTER TABLE public.chat ALTER COLUMN updated_by TYPE text;

------------------------------
--                                        Table "public.entity"
--     Column    |           Type           | Collation | Nullable |              Default              
-- --------------+--------------------------+-----------+----------+-----------------------------------
--  id           | typed_uuid               |           | not null | generate_typed_uuid('enty'::text)
--  e_name       | text                     |           |          | 
--  e_type       | text                     |           |          | 
--  e_data       | jsonb                    |           |          | 
--  created_date | timestamp with time zone |           | not null | now()
--  updated_date | timestamp with time zone |           | not null | now()
--  created_by   | typed_uuid               |           |          | 
--  updated_by   | typed_uuid               |           |          | 
ALTER TABLE public.entity ALTER COLUMN id TYPE text;
ALTER TABLE public.entity ALTER COLUMN created_by TYPE text;
ALTER TABLE public.entity ALTER COLUMN updated_by TYPE text;


--                                Table "public.group"
--    Column   |    Type    | Collation | Nullable |             Default              
-- ------------+------------+-----------+----------+----------------------------------
--  id         | typed_uuid |           | not null | generate_typed_uuid('grp'::text)
--  group_name | text       |           |          | 
-- Indexes:
--     "group_pkey" PRIMARY KEY, btree (id)
-- Check constraints:
--     "group__id__check_prefix" CHECK (is_valid_typed_uuid('grp'::text, id))
-- Referenced by:
--     TABLE "member_authorization" CONSTRAINT "member_authorization_granted_group_id_fkey" FOREIGN KEY (granted_group_id) REFERENCES "group"(id) ON DELETE CASCADE
--     TABLE "member_authorization" CONSTRAINT "member_authorization_group_id_fkey" FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE CASCADE
-- Policies:
--     POLICY "group DELETE" FOR DELETE
--       USING (true)
--     POLICY "group INSERT" FOR SELECT
--       USING (true)
--     POLICY "group SELECT" FOR SELECT
--       USING (true)
--     POLICY "group UPDATE" FOR UPDATE
--       USING (true)
-- 
-- 

ALTER TABLE public.group ALTER COLUMN id TYPE text;


---------------------------------------------------------------------------
-- BEGIN: TABLE DESCRIPTION (TABLE: public.member_authorization)
------------------------------
--                                                                   Table "public.member_authorization"
--         Column        |            Type             | Collation | Nullable |                                          Default                                           
-- ----------------------+-----------------------------+-----------+----------+--------------------------------------------------------------------------------------------
--  id                   | typed_uuid                  |           | not null | generate_typed_uuid('ma'::text)
--  granted_chat_id      | typed_uuid                  |           |          | 
--  granted_bot_id       | typed_uuid                  |           |          | 
--  granted_group_id     | typed_uuid                  |           |          | 
--  granted_entity_id    | typed_uuid                  |           |          | generated always as (COALESCE(granted_chat_id, granted_bot_id, granted_group_id)) stored
--  granted_entity_type  | text                        |           |          | 
--  access_level         | character varying(512)      |           | not null | 
--  is_base_access_level | boolean                     |           |          | generated always as (is_base_access_level(granted_entity_type, access_level::text)) stored
--  user_id              | typed_uuid                  |           | not null | 
--  bot_id               | typed_uuid                  |           | not null | 
--  group_id             | typed_uuid                  |           | not null | 
--  agent_id             | typed_uuid                  |           |          | generated always as (COALESCE(user_id, bot_id, group_id)) stored
--  agent_type           | agent_type                  |           | not null | generated always as (                                                                     +
--                       |                             |           |          | CASE                                                                                      +
--                       |                             |           |          |     WHEN user_id IS NULL THEN                                                             +
--                       |                             |           |          |     CASE                                                                                  +
--                       |                             |           |          |         WHEN bot_id IS NULL THEN 'group'::agent_type                                      +
--                       |                             |           |          |         ELSE 'bot'::agent_type                                                            +
--                       |                             |           |          |     END                                                                                   +
--                       |                             |           |          |     ELSE 'user'::agent_type                                                               +
--                       |                             |           |          | END) stored
--  created_date         | timestamp without time zone |           | not null | (now() AT TIME ZONE 'utc'::text)
--  modified_by          | typed_uuid                  |           |          | current_rsn_user_id()
--  modified_date        | timestamp without time zone |           | not null | (now() AT TIME ZONE 'utc'::text)
--  created_by           | typed_uuid                  |           |          | current_rsn_user_id()
-- Indexes:
--     "member_authorization_pkey" PRIMARY KEY, btree (id)
--     "member_authorization_member_entity_type_id_access_level_key" UNIQUE CONSTRAINT, btree (agent_id, granted_entity_type, granted_entity_id, access_level)
-- Check constraints:
--     "ma_type_matches_typename" CHECK (granted_chat_id IS NOT NULL AND granted_entity_type = 'chat'::text OR granted_bot_id IS NOT NULL AND granted_entity_type = 'bot'::text OR granted_group_id IS NOT NULL AND granted_entity_type = 'group'::text)
--     "member_auth__id__check_prefix" CHECK (is_valid_typed_uuid('ma'::text, id))
--     "member_authorization_check" CHECK (((granted_chat_id IS NOT NULL)::integer + (granted_bot_id IS NOT NULL)::integer + (granted_group_id IS NOT NULL)::integer) = 1)
--     "one_member_only_check" CHECK (((user_id IS NOT NULL)::integer + (bot_id IS NOT NULL)::integer + (group_id IS NOT NULL)::integer) = 1)
-- Foreign-key constraints:
--     "member_authorization_bot_id_fkey" FOREIGN KEY (bot_id) REFERENCES bot(id) ON DELETE CASCADE
--     "member_authorization_granted_bot_id_fkey" FOREIGN KEY (granted_bot_id) REFERENCES bot(id) ON DELETE CASCADE
--     "member_authorization_granted_chat_id_fkey" FOREIGN KEY (granted_chat_id) REFERENCES chat(id) ON DELETE CASCADE
--     "member_authorization_granted_group_id_fkey" FOREIGN KEY (granted_group_id) REFERENCES "group"(id) ON DELETE CASCADE
--     "member_authorization_group_id_fkey" FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE CASCADE
--     "member_authorization_user_id_fkey" FOREIGN KEY (user_id) REFERENCES rsn_user(id) ON DELETE CASCADE
-- Policies:
--     POLICY "member_authorization DELETE" FOR DELETE
--       USING (true)
--     POLICY "member_authorization INSERT" FOR SELECT
--       USING (true)
--     POLICY "member_authorization SELECT" FOR SELECT
--       USING (true)
--     POLICY "member_authorization UPDATE" FOR UPDATE
--       USING (true)
-- Triggers:
--     handle_audit_properties BEFORE INSERT OR UPDATE ON member_authorization FOR EACH ROW EXECUTE FUNCTION tgr_apply_audit()
--     log_operation AFTER INSERT OR DELETE OR UPDATE ON member_authorization FOR EACH ROW EXECUTE FUNCTION tgr_log_operation()
-- 
-- 

-- Remove foreign keys
ALTER TABLE public.member_authorization DROP CONSTRAINT member_authorization_bot_id_fkey;
ALTER TABLE public.member_authorization DROP CONSTRAINT member_authorization_granted_bot_id_fkey;
ALTER TABLE public.member_authorization DROP CONSTRAINT member_authorization_granted_chat_id_fkey;
ALTER TABLE public.member_authorization DROP CONSTRAINT member_authorization_granted_group_id_fkey;
ALTER TABLE public.member_authorization DROP CONSTRAINT member_authorization_group_id_fkey;
ALTER TABLE public.member_authorization DROP CONSTRAINT member_authorization_user_id_fkey;


ALTER TABLE public.member_authorization ALTER COLUMN id TYPE text;


ALTER TABLE public.member_authorization DROP COLUMN granted_entity_id;
ALTER TABLE public.member_authorization ALTER COLUMN granted_chat_id TYPE text;
ALTER TABLE public.member_authorization ALTER COLUMN granted_bot_id TYPE text;
ALTER TABLE public.member_authorization ALTER COLUMN granted_group_id TYPE text;
ALTER TABLE public.member_authorization ADD COLUMN granted_entity_id text GENERATED ALWAYS AS (COALESCE(granted_chat_id, granted_bot_id, granted_group_id)) STORED;


ALTER TABLE public.member_authorization DROP COLUMN agent_type;
ALTER TABLE public.member_authorization DROP COLUMN agent_id;
ALTER TABLE public.member_authorization ALTER COLUMN user_id TYPE text;
ALTER TABLE public.member_authorization ALTER COLUMN bot_id TYPE text;
ALTER TABLE public.member_authorization ALTER COLUMN group_id TYPE text;
ALTER TABLE public.member_authorization ADD COLUMN agent_id text GENERATED ALWAYS AS (COALESCE(user_id, bot_id, group_id)) STORED;
ALTER TABLE public.member_authorization ADD COLUMN agent_type agent_type GENERATED ALWAYS AS (CASE WHEN user_id IS NULL THEN CASE WHEN bot_id IS NULL THEN 'group'::agent_type ELSE 'bot'::agent_type END ELSE 'user'::agent_type END) STORED;


ALTER TABLE public.member_authorization ALTER COLUMN modified_by TYPE text;
ALTER TABLE public.member_authorization ALTER COLUMN created_by TYPE text;

-- Add foreign keys back
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES bot(id) ON DELETE CASCADE;
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_granted_bot_id_fkey FOREIGN KEY (granted_bot_id) REFERENCES bot(id) ON DELETE CASCADE;
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_granted_chat_id_fkey FOREIGN KEY (granted_chat_id) REFERENCES chat(id) ON DELETE CASCADE;
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_granted_group_id_fkey FOREIGN KEY (granted_group_id) REFERENCES "group"(id) ON DELETE CASCADE;
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_group_id_fkey FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE CASCADE;
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_user_id_fkey FOREIGN KEY (user_id) REFERENCES rsn_user(id) ON DELETE CASCADE;
ALTER TABLE public.member_authorization ADD CONSTRAINT member_authorization_member_entity_type_id_access_level_key UNIQUE (
        agent_id, granted_entity_type, granted_entity_id, access_level
);

--                                                Table "public.operation_log"
--      Column      |               Type                | Collation | Nullable |                   Default                    
-- -----------------+-----------------------------------+-----------+----------+----------------------------------------------
--  id              | uuid                              |           | not null | uuid_generate_v4()
--  table_name      | text                              |           |          | 
--  trigger_name    | text                              |           |          | 
--  operation_when  | text                              |           |          | 
--  operation_type  | text                              |           |          | 
--  operation_level | text                              |           |          | 
--  entity_id       | uuid                              |           |          | 
--  jsonb_diff      | jsonb                             |           |          | 
--  rsn_user_id     | typed_uuid                        |           |          | current_rsn_user_id()
--  event_date      | timestamp without time zone       |           | not null | (now() AT TIME ZONE 'utc'::text)
--  process_status  | operation_log_process_status_enum |           |          | 'pending'::operation_log_process_status_enum
--  processed_date  | timestamp without time zone       |           |          | 
-- Indexes:
--     "operation_log_pkey" PRIMARY KEY, btree (id)
-- Policies (row security enabled): (none)
-- 

ALTER TABLE public.operation_log ALTER COLUMN entity_id TYPE text;
ALTER TABLE public.operation_log ALTER COLUMN rsn_user_id TYPE text;


--                                               Table "public.rsn_user_sysdata"
--        Column       |    Type    | Collation | Nullable |                             Default                              
-- --------------------+------------+-----------+----------+------------------------------------------------------------------
--  id                 | typed_uuid |           | not null | generated always as ('rsnusrsys_'::text || auth_id::text) stored
--  rsn_user_id        | typed_uuid |           |          | generated always as ('rsnusr_'::text || auth_id::text) stored
--  auth_id            | uuid       |           | not null | 
--  extra_license_info | jsonb      |           |          | 
--  auth_email         | text       |           |          | 
-- Indexes:
--     "rsn_user_sysdata_pkey" PRIMARY KEY, btree (id)
-- Check constraints:
--     "rsn_user_sysdata__id__check_prefix" CHECK (is_valid_typed_uuid('rsnusrsys'::text, id))
--     "rsn_user_sysdata__rsn_user_id__check_prefix" CHECK (is_valid_typed_uuid('rsnusr'::text, rsn_user_id))
-- Foreign-key constraints:
--     "rsn_user_sysdata_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE
-- Policies:
--     POLICY "rsn_user_sysdata DELETE" FOR DELETE
--       USING (((current_rsn_user_id())::text = (rsn_user_id)::text))
--     POLICY "rsn_user_sysdata INSERT" FOR INSERT
--       WITH CHECK (false)
--     POLICY "rsn_user_sysdata SELECT" FOR SELECT
--       USING (((current_rsn_user_id())::text = (rsn_user_id)::text))
--     POLICY "rsn_user_sysdata UPDATE" FOR UPDATE
--       USING (false)
-- Triggers:
--     run_tgr_user_auth_sync BEFORE INSERT OR UPDATE ON rsn_user_sysdata FOR EACH ROW EXECUTE FUNCTION tgr_user_auth_sync()
-- 

--- 1. Drop Policies

DROP POLICY "rsn_user_sysdata DELETE" ON public.rsn_user_sysdata;
DROP POLICY "rsn_user_sysdata INSERT" ON public.rsn_user_sysdata;
DROP POLICY "rsn_user_sysdata SELECT" ON public.rsn_user_sysdata;
DROP POLICY "rsn_user_sysdata UPDATE" ON public.rsn_user_sysdata;

--- 2. Alter Column Type

ALTER TABLE public.rsn_user_sysdata ALTER COLUMN id TYPE text;
ALTER TABLE public.rsn_user_sysdata ALTER COLUMN rsn_user_id TYPE text;

--- 3. Add Policies again 

CREATE POLICY "rsn_user_sysdata DELETE" ON public.rsn_user_sysdata FOR DELETE USING (((current_rsn_user_id())::text = (rsn_user_id)::text));
CREATE POLICY "rsn_user_sysdata INSERT" ON public.rsn_user_sysdata FOR INSERT WITH CHECK (false);
CREATE POLICY "rsn_user_sysdata SELECT" ON public.rsn_user_sysdata FOR SELECT USING (((current_rsn_user_id())::text = (rsn_user_id)::text));
CREATE POLICY "rsn_user_sysdata UPDATE" ON public.rsn_user_sysdata FOR UPDATE USING (false);

ALTER TABLE public.rsn_page_vector ALTER COLUMN id TYPE text;
ALTER TABLE public.rsn_page_vector ALTER COLUMN rsn_page_id TYPE text;
ALTER TABLE public.rsn_page_vector ALTER COLUMN created_by TYPE text;
ALTER TABLE public.rsn_page_vector ALTER COLUMN updated_by TYPE text;


ALTER TABLE public.rsn_page ALTER COLUMN created_by TYPE text;
ALTER TABLE public.rsn_page ALTER COLUMN updated_by TYPE text;


--- Create `rsn_page_vec_queue` table
--- This table is used to queue up pages for vectorization
CREATE TABLE public.rsn_page_vec_queue (
    id text DEFAULT public.generate_typed_uuid('rsnpagevq'::text) NOT NULL,
    rsn_page_id text,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT rsn_page_vec_queue__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnpagevq'::text, (id)::public.typed_uuid))
);

-- Permissions
ALTER TABLE public.rsn_page_vec_queue ENABLE ROW LEVEL SECURITY;
---- Policies
CREATE POLICY "rsn_page_vec_queue DELETE" ON public.rsn_page_vec_queue FOR
    DELETE USING (true);
CREATE POLICY "rsn_page_vec_queue INSERT" ON public.rsn_page_vec_queue FOR
    INSERT WITH CHECK (true);
CREATE POLICY "rsn_page_vec_queue SELECT" ON public.rsn_page_vec_queue FOR
    SELECT USING (true);
CREATE POLICY "rsn_page_vec_queue UPDATE" ON public.rsn_page_vec_queue FOR
    UPDATE USING (true);
---- Grants
GRANT ALL ON TABLE public.rsn_page_vec_queue TO anon;
GRANT ALL ON TABLE public.rsn_page_vec_queue TO authenticated;
GRANT ALL ON TABLE public.rsn_page_vec_queue TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit 
BEFORE 
INSERT OR UPDATE 
ON public.rsn_page_vec_queue 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
AFTER
INSERT OR DELETE OR UPDATE 
ON public.rsn_page_vec_queue 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- Descriptions
COMMENT ON TABLE public.rsn_page_vec_queue IS 'A queue of rsn pages to be vectorized.';


-------------------------------------
-- BEGIN: Create & Register `tgr_rsn_page_vec_queue_insert` trigger

-- Create trigger
CREATE OR REPLACE FUNCTION public.tgr_rsn_page_vec_queue_insert()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    -- This should be triggered by an INSERT / UPDATE
    -- When a new page is created, or a page is updated, add it to the queue if it does not exist.

    -- Check if the page already exists in the queue
    IF EXISTS (SELECT 1 FROM rsn_page_vec_queue WHERE rsn_page_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- IF update, check if the body of the page has changed.
    -- If the body has not changed, then do not add it to the queue.
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.body = NEW.body) THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Add the rsn_page to the queue
    INSERT INTO rsn_page_vec_queue (rsn_page_id) VALUES (NEW.id);

    RETURN NEW;
END;
$BODY$;
COMMENT ON FUNCTION public.tgr_rsn_page_vec_queue_insert() IS 'Add a rsn_page to the `rsn_page_vec_queue` table when a new rsn_page is created.';

-- Register this function
CREATE TRIGGER tgr_rsn_page_vec_queue_insert
    AFTER INSERT
    ON public.rsn_page
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_page_vec_queue_insert();
COMMENT ON TRIGGER tgr_rsn_page_vec_queue_insert ON public.rsn_page IS 'Add a rsn_page to the `rsn_page_vec_queue` table when a new rsn_page is created.';

-- Register this function for Update
CREATE TRIGGER tgr_rsn_page_vec_queue_update
    AFTER UPDATE
    ON public.rsn_page
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_page_vec_queue_insert();
COMMENT ON TRIGGER tgr_rsn_page_vec_queue_update ON public.rsn_page IS 'Add a rsn_page to the `rsn_page_vec_queue` table when a rsn_page is updated.';

-- END: Create & Register `tgr_rsn_page_vec_queue_insert` trigger
-------------------------------------


-------------------------------------
-- 
CREATE OR REPLACE FUNCTION base_url() RETURNS text AS $$
  BEGIN
    -- This should only be called from the local machine and must be overridden in production.
    PERFORM public.throw_if_not_local();
    -- This is the internal Kong URL for the localhost Kong instance.
    RETURN 'http://supabase_kong_Reasonote:8000';
  END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION anon_key() RETURNS text AS $$
  BEGIN
    -- This should only be called from the local machine and must be overridden in production.
    PERFORM public.throw_if_not_local();
    RETURN 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  END;
$$ LANGUAGE plpgsql;
--
-------------------------------------


SELECT cron.schedule (
  'crn_process_queue', -- name of the cron job
  '* * * * *', -- Every minute
  $$ 
    SELECT net.http_post(
        url:= base_url() || '/functions/v1/update_rsn_page_vectors',
        headers:= format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', anon_key())::jsonb,
        body:=concat('{}')::jsonb
      ) as request_id;
  $$ -- query to run
);