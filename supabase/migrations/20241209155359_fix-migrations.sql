--------------------------------------------------------------------------------
-- Create foundational tables for the permission framework:
-- 1) entity_type
-- 2) permission
-- 3) entity_type_access_level
-- 4) access_level_permission
--------------------------------------------------------------------------------

-- Table: entity_type
-- Stores the different entity types that can have access levels (e.g., 'lesson', 'chat', 'bot', 'group').
CREATE TABLE IF NOT EXISTS public.entity_type (
    entity_type character varying(512) NOT NULL,
    created_by TEXT DEFAULT current_rsn_user_id(),
    created_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_by TEXT DEFAULT current_rsn_user_id(),
    updated_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT entity_type_pkey PRIMARY KEY (entity_type)
);
COMMENT ON TABLE public.entity_type IS 'Stores known entity types that can have access levels and permissions.';

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON entity_type FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON entity_type FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


-- Enable row level security and basic policy (adjust if needed):
ALTER TABLE public.entity_type ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_type SELECT" ON public.entity_type FOR SELECT USING (true);
CREATE POLICY "entity_type INSERT" ON public.entity_type FOR INSERT WITH CHECK (false);
CREATE POLICY "entity_type UPDATE" ON public.entity_type FOR UPDATE USING (false);
CREATE POLICY "entity_type DELETE" ON public.entity_type FOR DELETE USING (false);
GRANT ALL ON TABLE public.entity_type TO anon, authenticated, service_role;

-- Table: permission
-- Stores permission codes (e.g. 'lesson.SELECT', 'lesson.UPDATE') that define discrete actions.
CREATE TABLE IF NOT EXISTS public.permission (
    permission_code character varying(512) NOT NULL,
    description text,
    CONSTRAINT permission_pkey PRIMARY KEY (permission_code),
    created_by TEXT DEFAULT current_rsn_user_id(),
    created_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_by TEXT DEFAULT current_rsn_user_id(),
    updated_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
COMMENT ON TABLE public.permission IS 'Stores individual permission codes that can be granted via access levels.';
GRANT ALL ON TABLE public.permission TO anon, authenticated, service_role;

ALTER TABLE public.permission ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permission SELECT" ON public.permission FOR SELECT USING (true);
CREATE POLICY "permission INSERT" ON public.permission FOR INSERT WITH CHECK (false);
CREATE POLICY "permission UPDATE" ON public.permission FOR UPDATE USING (false);
CREATE POLICY "permission DELETE" ON public.permission FOR DELETE USING (false);

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON permission FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON permission FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();



-- Table: entity_type_access_level
-- Maps an entity_type to a set of named access levels (e.g. 'lesson' -> 'owner', 'viewer').
CREATE TABLE IF NOT EXISTS public.entity_type_access_level (
    entity_type character varying(512) NOT NULL,
    access_level character varying(512) NOT NULL,
    created_by TEXT DEFAULT current_rsn_user_id(),
    created_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_by TEXT DEFAULT current_rsn_user_id(),
    updated_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT entity_type_access_level_pkey PRIMARY KEY (entity_type, access_level),
    CONSTRAINT entity_type_entity_type_fkey FOREIGN KEY (entity_type) REFERENCES public.entity_type(entity_type) ON DELETE CASCADE
);
COMMENT ON TABLE public.entity_type_access_level IS 'Defines valid access levels for each entity type (e.g., "owner" for "lesson").';
ALTER TABLE public.entity_type_access_level ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_type_access_level SELECT" ON public.entity_type_access_level FOR SELECT USING (true);
CREATE POLICY "entity_type_access_level INSERT" ON public.entity_type_access_level FOR INSERT WITH CHECK (false);
CREATE POLICY "entity_type_access_level UPDATE" ON public.entity_type_access_level FOR UPDATE USING (false);
CREATE POLICY "entity_type_access_level DELETE" ON public.entity_type_access_level FOR DELETE USING (false);
GRANT ALL ON TABLE public.entity_type_access_level TO anon, authenticated, service_role;

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON entity_type_access_level FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON entity_type_access_level FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


-- Table: access_level_permission
-- Maps each (entity_type, access_level) to the permissions it grants.
CREATE TABLE IF NOT EXISTS public.access_level_permission (
    entity_type character varying(512) NOT NULL,
    access_level character varying(512) NOT NULL,
    permission_code character varying(512) NOT NULL,
    created_by TEXT DEFAULT current_rsn_user_id(),
    created_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_by TEXT DEFAULT current_rsn_user_id(),
    updated_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT access_level_permission_pkey PRIMARY KEY (entity_type, access_level, permission_code),
    CONSTRAINT entity_type_access_level_fkey FOREIGN KEY (access_level, entity_type) REFERENCES public.entity_type_access_level(access_level, entity_type),
    CONSTRAINT permission_code_fkey FOREIGN KEY (permission_code) REFERENCES public.permission(permission_code)
);
COMMENT ON TABLE public.access_level_permission IS 'Associates access levels with the specific permissions they confer.';
ALTER TABLE public.access_level_permission ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access_level_permission SELECT" ON public.access_level_permission FOR SELECT USING (true);
CREATE POLICY "access_level_permission INSERT" ON public.access_level_permission FOR INSERT WITH CHECK (false);
CREATE POLICY "access_level_permission UPDATE" ON public.access_level_permission FOR UPDATE USING (false);
CREATE POLICY "access_level_permission DELETE" ON public.access_level_permission FOR DELETE USING (false);
GRANT ALL ON TABLE public.access_level_permission TO anon, authenticated, service_role;

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON access_level_permission FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON access_level_permission FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


--------------------------------------------------------------------------------
-- Create memauth table (replaces member_authorization) with principal/resource naming
--------------------------------------------------------------------------------

-- The memauth table assigns an access_level to a principal (user/bot/group) on a resource (lesson, chat, bot, group).
DROP TABLE IF EXISTS public.memauth CASCADE;

CREATE TABLE public.memauth (
    id text NOT NULL DEFAULT generate_typed_uuid('memauth'),
    resource_entity_type text NOT NULL,   -- e.g. 'lesson', 'chat', etc.
    access_level character varying(512) NOT NULL,

    -- Principal (the one receiving permissions) - only one of these set:
    principal_user_id text,
    principal_bot_id text,
    principal_group_id text,

    -- Resource (the thing permissions apply to) - only one set:
    resource_chat_id text,
    resource_bot_id text,
    resource_group_id text,
    resource_lesson_id text,

    created_date timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    created_by text DEFAULT current_rsn_user_id(),
    updated_by text,
    updated_date timestamp with time zone DEFAULT now(),

    CONSTRAINT memauth_pkey PRIMARY KEY (id),

    -- Check only one principal:
    CONSTRAINT one_principal_only_check CHECK (
      ((principal_user_id IS NOT NULL)::integer +
       (principal_bot_id IS NOT NULL)::integer +
       (principal_group_id IS NOT NULL)::integer) = 1
    ),

    -- Check only one resource:
    CONSTRAINT one_resource_only_check CHECK (
      ((resource_chat_id IS NOT NULL)::integer +
       (resource_bot_id IS NOT NULL)::integer +
       (resource_group_id IS NOT NULL)::integer +
       (resource_lesson_id IS NOT NULL)::integer) = 1
    ),

    -- Ensure resource_entity_type matches chosen resource column
    CONSTRAINT type_matches_resource CHECK (
      (resource_chat_id IS NOT NULL AND resource_entity_type = 'chat')
      OR (resource_bot_id IS NOT NULL AND resource_entity_type = 'bot')
      OR (resource_group_id IS NOT NULL AND resource_entity_type = 'group')
      OR (resource_lesson_id IS NOT NULL AND resource_entity_type = 'lesson')
    ),

    -- Typed UUID check:
    CONSTRAINT memauth_id_check_prefix CHECK (is_valid_typed_uuid('memauth', id::typed_uuid))
);
COMMENT ON TABLE public.memauth IS 'Maps principals (user/bot/group) to access_levels on specific resources (lesson/chat/etc.).';

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON memauth FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON memauth FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


-- Add generated columns for convenience:
ALTER TABLE public.memauth
  ADD COLUMN principal_id text GENERATED ALWAYS AS (COALESCE(principal_user_id, principal_bot_id, principal_group_id)) STORED;
COMMENT ON COLUMN public.memauth.principal_id IS 'Unified principal identifier (user/bot/group).';

ALTER TABLE public.memauth
  ADD COLUMN principal_type public.agent_type GENERATED ALWAYS AS (
    CASE
      WHEN principal_user_id IS NULL THEN
        CASE
          WHEN principal_bot_id IS NULL THEN 'group'::agent_type
          ELSE 'bot'::agent_type
        END
      ELSE 'user'::agent_type
    END
) STORED;
COMMENT ON COLUMN public.memauth.principal_type IS 'Type of the principal: user, bot, or group.';

ALTER TABLE public.memauth
  ADD COLUMN resource_entity_id text GENERATED ALWAYS AS (COALESCE(resource_chat_id, resource_bot_id, resource_group_id, resource_lesson_id)) STORED;
COMMENT ON COLUMN public.memauth.resource_entity_id IS 'Unified resource identifier, which lesson/chat/etc. this row refers to.';

-- Foreign keys:
ALTER TABLE public.memauth ADD FOREIGN KEY (principal_user_id) REFERENCES public.rsn_user(id) ON DELETE CASCADE;
ALTER TABLE public.memauth ADD FOREIGN KEY (principal_bot_id) REFERENCES public.bot(id) ON DELETE CASCADE;
ALTER TABLE public.memauth ADD FOREIGN KEY (principal_group_id) REFERENCES public."group"(id) ON DELETE CASCADE;
ALTER TABLE public.memauth ADD FOREIGN KEY (resource_chat_id) REFERENCES public.chat(id) ON DELETE CASCADE;
ALTER TABLE public.memauth ADD FOREIGN KEY (resource_bot_id) REFERENCES public.bot(id) ON DELETE CASCADE;
ALTER TABLE public.memauth ADD FOREIGN KEY (resource_group_id) REFERENCES public."group"(id) ON DELETE CASCADE;
ALTER TABLE public.memauth ADD FOREIGN KEY (resource_lesson_id) REFERENCES public.lesson(id) ON DELETE CASCADE;

-- RLS on memauth:
ALTER TABLE public.memauth ENABLE ROW LEVEL SECURITY;
-- Add simple policies for service_role; adjust as needed:
CREATE POLICY memauth__service_role__select ON public.memauth FOR SELECT TO service_role USING (true);
CREATE POLICY memauth__service_role__insert ON public.memauth FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY memauth__service_role__update ON public.memauth FOR UPDATE TO service_role USING (true);
CREATE POLICY memauth__service_role__delete ON public.memauth FOR DELETE TO service_role USING (true);

GRANT ALL ON TABLE public.memauth TO anon, authenticated, service_role;


--------------------------------------------------------------------------------
-- Insert 'lesson' entity type, and define 'owner' access level & permissions
--------------------------------------------------------------------------------
INSERT INTO public.entity_type (entity_type) VALUES ('lesson') ON CONFLICT (entity_type) DO NOTHING;
COMMENT ON COLUMN public.entity_type.entity_type IS 'Name of the entity type (e.g. "lesson").';

INSERT INTO public.entity_type_access_level (entity_type, access_level)
VALUES ('lesson', 'owner')
ON CONFLICT (entity_type, access_level) DO NOTHING;

INSERT INTO public.permission (permission_code, description) VALUES 
('lesson.SELECT', 'Can select/view a lesson'),
('lesson.INSERT', 'Can insert/create a lesson'),
('lesson.UPDATE', 'Can update/edit a lesson'),
('lesson.DELETE', 'Can delete a lesson')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'owner', pc.permission_code
FROM (VALUES ('lesson.SELECT'), ('lesson.INSERT'), ('lesson.UPDATE'), ('lesson.DELETE')) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;


--------------------------------------------------------------------------------
-- Create vw_lesson_memauth view
-- This view shows which principals have what access level & permissions on which lessons.
--------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_lesson_memauth;

CREATE VIEW public.vw_lesson_memauth AS
SELECT
    ma.id AS memauth_id,
    ma.principal_id,
    ma.principal_type,
    ma.resource_lesson_id AS lesson_id,
    l._name AS lesson_name,
    l._summary AS lesson_summary,
    ma.access_level,
    array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions
FROM public.memauth ma
JOIN public.access_level_permission alp 
  ON alp.entity_type = 'lesson'
  AND upper(alp.access_level) = upper(ma.access_level)
JOIN public.lesson l ON l.id = ma.resource_lesson_id
WHERE ma.resource_entity_type = 'lesson'
GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.resource_lesson_id, l._name, l._summary, ma.access_level;

COMMENT ON VIEW public.vw_lesson_memauth IS 'Shows lesson authorizations, what principals have which access_levels & permissions on which lessons.';
GRANT SELECT ON public.vw_lesson_memauth TO anon, authenticated, service_role;

-- Allow null on lesson.root_skill
ALTER TABLE public.lesson ALTER COLUMN root_skill DROP NOT NULL;

--------------------------------------------------------------------------------
-- RLS policies on lesson, now using vw_lesson_memauth for permission checks
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "lesson INSERT" ON public.lesson;
DROP POLICY IF EXISTS "lesson SELECT" ON public.lesson;
DROP POLICY IF EXISTS "lesson UPDATE" ON public.lesson;
DROP POLICY IF EXISTS "lesson DELETE" ON public.lesson;

CREATE POLICY "lesson INSERT" ON public.lesson FOR INSERT WITH CHECK (
  (created_by = (public.current_rsn_user_id())::text) 
  OR (for_user = (public.current_rsn_user_id())::text) 
  OR public.is_admin()
);



CREATE POLICY "lesson SELECT" ON public.lesson FOR SELECT
USING (
  EXISTS(
    SELECT 1
    FROM vw_lesson_memauth vwm
    WHERE vwm.lesson_id = lesson.id
      AND vwm.principal_id = current_rsn_user_id()
      AND 'lesson.SELECT' = ANY(vwm.permissions)
  ) 
  OR is_admin()
  -- Allow lesson creator to select their own lesson immediately after creation.
  OR (lesson.created_by = current_rsn_user_id())
  OR (lesson.for_user = current_rsn_user_id())
);


CREATE POLICY "lesson UPDATE" ON public.lesson FOR UPDATE
USING (
  EXISTS(
    SELECT 1
    FROM vw_lesson_memauth vwm
    WHERE vwm.lesson_id = lesson.id
      AND vwm.principal_id = current_rsn_user_id()
      AND 'lesson.UPDATE' = ANY(vwm.permissions)
  ) OR is_admin()
);

CREATE POLICY "lesson DELETE" ON public.lesson FOR DELETE
USING (
  EXISTS(
    SELECT 1
    FROM vw_lesson_memauth vwm
    WHERE vwm.lesson_id = lesson.id
      AND vwm.principal_id = current_rsn_user_id()
      AND 'lesson.DELETE' = ANY(vwm.permissions)
  ) OR is_admin()
);


--------------------------------------------------------------------------------
-- Trigger function to grant 'owner' access on new lesson insert
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.tgr_grant_lesson_creator_authorization() CASCADE;

CREATE OR REPLACE FUNCTION public.tgr_grant_lesson_creator_authorization()
RETURNS TRIGGER AS $$
DECLARE
BEGIN
  -- When a new lesson is created, grant the creator 'owner' access in memauth
  INSERT INTO memauth (id, resource_lesson_id, resource_entity_type, access_level, principal_user_id)
  VALUES (generate_typed_uuid('memauth'), NEW.id, 'lesson', 'owner', current_rsn_user_id());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.tgr_grant_lesson_creator_authorization() IS 'Trigger that grants "owner" memauth to lesson creator after inserting a new lesson.';

DROP TRIGGER IF EXISTS grant_lesson_creator_auth ON public.lesson;
CREATE TRIGGER grant_lesson_creator_auth
AFTER INSERT ON public.lesson
FOR EACH ROW
EXECUTE FUNCTION public.tgr_grant_lesson_creator_authorization();


--------------------------------------------------------------------------------
-- Grants on lesson and memauth tables
--------------------------------------------------------------------------------
GRANT ALL ON TABLE public.lesson TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.memauth TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- Create 'owner' memauth entries for existing lessons
--------------------------------------------------------------------------------
INSERT INTO memauth (
    id,
    resource_lesson_id,
    resource_entity_type,
    access_level,
    principal_user_id
)
SELECT 
    generate_typed_uuid('memauth'),
    l.id,
    'lesson',
    'owner',
    l.created_by
FROM lesson l
WHERE l.created_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also grant owner access to for_user if different from created_by
INSERT INTO memauth (
    id,
    resource_lesson_id,
    resource_entity_type,
    access_level,
    principal_user_id
)
SELECT 
    generate_typed_uuid('memauth'),
    l.id,
    'lesson',
    'owner',
    l.for_user
FROM lesson l
WHERE l.for_user IS NOT NULL 
AND l.for_user != l.created_by
ON CONFLICT DO NOTHING;