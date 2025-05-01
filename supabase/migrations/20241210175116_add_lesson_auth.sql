----------------------------------------------------------------------------
----------------------------------------------------------------------------
-- lesson Authorization Setup
----------------------------------------------------------------------------
----------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- Insert the lesson entity type (if needed)
--------------------------------------------------------------------------------
INSERT INTO public.entity_type (entity_type, abbreviation) VALUES 
  ('lesson', 'lesson') 
ON CONFLICT (entity_type) DO NOTHING;



-- Attach the trigger to the lesson table
DROP TRIGGER IF EXISTS grant_lesson_creator_auth ON public.lesson;
CREATE TRIGGER grant_lesson_creator_auth
  AFTER INSERT ON public.lesson
  FOR EACH ROW
  EXECUTE PROCEDURE public.tgr_grant_entity_creator_authorization('id', 'lesson');

--------------------------------------------------------------------------------
-- Recreate vw_lesson_memauth view
--------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_lesson_memauth;

CREATE VIEW public.vw_lesson_memauth AS
SELECT
    ma.id AS memauth_id,
    ma.principal_id,
    ma.principal_type,
    ma.resource_entity_id AS lesson_id,
    ma.access_level,
    array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions,
    ma.is_public
FROM public.memauth ma
JOIN public.access_level_permission alp 
  ON alp.entity_type = 'lesson'
  AND upper(alp.access_level) = upper(ma.access_level)
JOIN public.lesson l ON l.id = ma.resource_entity_id   -- changed this to use resource_entity_id
WHERE ma.resource_entity_type = 'lesson'
GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.resource_entity_id, ma.access_level, ma.is_public;

COMMENT ON VIEW public.vw_lesson_memauth IS 'Shows lesson authorizations, what principals have which access_levels & permissions on which lesson.';
GRANT SELECT ON public.vw_lesson_memauth TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- RLS policies on lesson, using vw_lesson_memauth for permission checks
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "lesson INSERT" ON public.lesson;
DROP POLICY IF EXISTS "lesson SELECT" ON public.lesson;
DROP POLICY IF EXISTS "lesson UPDATE" ON public.lesson;
DROP POLICY IF EXISTS "lesson DELETE" ON public.lesson;

CREATE POLICY "lesson INSERT" ON public.lesson FOR INSERT WITH CHECK (
  (created_by = (public.current_rsn_user_id())::text)
  OR public.is_admin()
);

CREATE POLICY "lesson SELECT" ON public.lesson FOR SELECT
USING (
  EXISTS(
    SELECT 1
    FROM vw_lesson_memauth vwm
    WHERE vwm.lesson_id = lesson.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'lesson.SELECT' = ANY(vwm.permissions)
  )
  -- Ideally we wouldn't need these fallback checks,
  -- But to be on the safe side since the new permissions are new,
  -- we'll keep them for now.
  OR (lesson.created_by = current_rsn_user_id())
  OR (lesson.for_user = current_rsn_user_id())
  OR public.is_admin()
);

CREATE POLICY "lesson UPDATE" ON public.lesson FOR UPDATE
USING (
  EXISTS(
    SELECT 1
    FROM vw_lesson_memauth vwm
    WHERE vwm.lesson_id = lesson.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'lesson.UPDATE' = ANY(vwm.permissions)
  )
  -- Ideally we wouldn't need these fallback checks,
  -- But to be on the safe side since the new permissions are new,
  -- we'll keep them for now.
  OR (lesson.created_by = current_rsn_user_id())
  OR (lesson.for_user = current_rsn_user_id())
  OR public.is_admin()
);

CREATE POLICY "lesson DELETE" ON public.lesson FOR DELETE
USING (
  EXISTS(
    SELECT 1
    FROM vw_lesson_memauth vwm
    WHERE vwm.lesson_id = lesson.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'lesson.DELETE' = ANY(vwm.permissions)
  ) 
  -- Ideally we wouldn't need these fallback checks,
  -- But to be on the safe side since the new permissions are new,
  -- we'll keep them for now.
  OR (lesson.created_by = current_rsn_user_id())
  OR (lesson.for_user = current_rsn_user_id())
  OR public.is_admin()
);


--------------------------------------------------------------------------------
-- Define the basic permission levels
--------------------------------------------------------------------------------
INSERT INTO public.permission (permission_code, description) VALUES 
('lesson.SELECT', 'Can select/view a lesson'),
('lesson.INSERT', 'Can insert/create a lesson'),
('lesson.UPDATE', 'Can update/edit a lesson'),
('lesson.DELETE', 'Can delete a lesson'),
('lesson.SHARE', 'Can grant or modify non-owner access levels on a lesson'),
('lesson.COMMENT', 'Can comment on a lesson')
ON CONFLICT (permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Define the basic access levels
--------------------------------------------------------------------------------
INSERT INTO public.entity_type_access_level (entity_type, access_level)
VALUES 
('lesson', 'owner'),
('lesson', 'editor'),
('lesson', 'viewer'),
('lesson', 'commenter')
ON CONFLICT (entity_type, access_level) DO NOTHING;

--------------------------------------------------------------------------------
-- Setup the permissions for each access level
--------------------------------------------------------------------------------
-- NOTE: If you want to add more permissions to any of the following access levels, you must add them here.
-- For example:
--  If this is the `foo` object,
--  and `foo` objects sometimes have a `bar` object that is considered their child,
--  you may want to add `bar.SELECT` as another permission.
--  The `bar` table can then ask the lesson permissions for `bar.SELECT` if it needs to.
--------------------------------------------------------------------------------

-- Owners can do anything on the lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'owner', pc.permission_code
FROM (VALUES 
('lesson.SELECT'), 
('lesson.INSERT'), 
('lesson.UPDATE'), 
('lesson.DELETE'),
('lesson.SHARE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Editors can select, update, and comment on a lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'editor', pc.permission_code
FROM (VALUES 
('lesson.SELECT'),
('lesson.UPDATE'),
('lesson.COMMENT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Viewers can select a lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
VALUES ('lesson', 'viewer', 'lesson.SELECT')
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Commenters can select a lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'commenter', pc.permission_code
FROM (VALUES 
('lesson.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;


--------------------------------------------------------------------------------
-- Create lesson memauth entries.
--------------------------------------------------------------------------------
INSERT INTO memauth (
    resource_entity_id,
    access_level,
    principal_user_id
)
SELECT 
    l.id,
    'owner',
    l.created_by
FROM lesson l
WHERE l.created_by IS NOT NULL
ON CONFLICT DO NOTHING;