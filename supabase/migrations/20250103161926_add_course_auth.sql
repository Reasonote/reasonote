----------------------------------------------------------------------------
----------------------------------------------------------------------------
-- course Authorization Setup
----------------------------------------------------------------------------
----------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- Insert the course entity type (if needed)
--------------------------------------------------------------------------------
INSERT INTO public.entity_type (entity_type, abbreviation) VALUES 
  ('course', 'course') 
ON CONFLICT (entity_type) DO NOTHING;

-- Attach the trigger to the course table
DROP TRIGGER IF EXISTS grant_course_creator_auth ON public.course;
CREATE TRIGGER grant_course_creator_auth
  AFTER INSERT ON public.course
  FOR EACH ROW
  EXECUTE PROCEDURE public.tgr_grant_entity_creator_authorization('id', 'course');

--------------------------------------------------------------------------------
-- Recreate vw_course_memauth view
--------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_course_memauth;

CREATE VIEW public.vw_course_memauth AS
SELECT
    ma.id AS memauth_id,
    ma.principal_id,
    ma.principal_type,
    ma.resource_entity_id AS course_id,
    ma.access_level,
    array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions,
    ma.is_public
FROM public.memauth ma
JOIN public.access_level_permission alp 
  ON alp.entity_type = 'course'
  AND upper(alp.access_level) = upper(ma.access_level)
JOIN public.course l ON l.id = ma.resource_entity_id
WHERE ma.resource_entity_type = 'course'
GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.resource_entity_id, ma.access_level, ma.is_public;

COMMENT ON VIEW public.vw_course_memauth IS 'Shows course authorizations, what principals have which access_levels & permissions on which course.';
GRANT SELECT ON public.vw_course_memauth TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- RLS policies on course, using vw_course_memauth for permission checks
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "course INSERT" ON public.course;
DROP POLICY IF EXISTS "course SELECT" ON public.course;
DROP POLICY IF EXISTS "course UPDATE" ON public.course;
DROP POLICY IF EXISTS "course DELETE" ON public.course;

CREATE POLICY "course INSERT" ON public.course FOR INSERT WITH CHECK (
  (created_by = (public.current_rsn_user_id())::text)
  OR public.is_admin()
);

CREATE POLICY "course SELECT" ON public.course FOR SELECT
USING (
  EXISTS(
    SELECT 1
    FROM vw_course_memauth vwm
    WHERE vwm.course_id = course.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'course.SELECT' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
  OR (course.created_by = current_rsn_user_id())
);

CREATE POLICY "course UPDATE" ON public.course FOR UPDATE
USING (
  EXISTS(
    SELECT 1
    FROM vw_course_memauth vwm
    WHERE vwm.course_id = course.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'course.UPDATE' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
);

CREATE POLICY "course DELETE" ON public.course FOR DELETE
USING (
  EXISTS(
    SELECT 1
    FROM vw_course_memauth vwm
    WHERE vwm.course_id = course.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'course.DELETE' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
);

--------------------------------------------------------------------------------
-- RLS policies on course_lesson, using vw_course_memauth for permission checks
--------------------------------------------------------------------------------
ALTER TABLE public.course_lesson ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_lesson INSERT" ON public.course_lesson;
DROP POLICY IF EXISTS "course_lesson SELECT" ON public.course_lesson;
DROP POLICY IF EXISTS "course_lesson UPDATE" ON public.course_lesson;
DROP POLICY IF EXISTS "course_lesson DELETE" ON public.course_lesson;

-- INSERT: Can insert if they have course.UPDATE permission on the parent course
CREATE POLICY "course_lesson INSERT" ON public.course_lesson FOR INSERT 
WITH CHECK (
    EXISTS(
        SELECT 1
        FROM vw_course_memauth vwm
        WHERE vwm.course_id = course
        AND (
            vwm.principal_id = current_rsn_user_id()
            OR vwm.is_public = true
        )
        AND 'course.UPDATE' = ANY(vwm.permissions)
    ) 
    OR public.is_admin()
);

-- SELECT: Can select if they have course.SELECT permission on the parent course
CREATE POLICY "course_lesson SELECT" ON public.course_lesson FOR SELECT
USING (
    EXISTS(
        SELECT 1
        FROM vw_course_memauth vwm
        WHERE vwm.course_id = course
        AND (
            vwm.principal_id = current_rsn_user_id()
            OR vwm.is_public = true
        )
        AND 'course.SELECT' = ANY(vwm.permissions)
    ) 
    OR public.is_admin()
);

-- UPDATE: Can update if they have course.UPDATE permission on the parent course
CREATE POLICY "course_lesson UPDATE" ON public.course_lesson FOR UPDATE
USING (
    EXISTS(
        SELECT 1
        FROM vw_course_memauth vwm
        WHERE vwm.course_id = course
        AND (
            vwm.principal_id = current_rsn_user_id()
            OR vwm.is_public = true
        )
        AND 'course.UPDATE' = ANY(vwm.permissions)
    ) 
    OR public.is_admin()
);

-- DELETE: Can delete if they have course.UPDATE permission on the parent course
CREATE POLICY "course_lesson DELETE" ON public.course_lesson FOR DELETE
USING (
    EXISTS(
        SELECT 1
        FROM vw_course_memauth vwm
        WHERE vwm.course_id = course
        AND (
            vwm.principal_id = current_rsn_user_id()
            OR vwm.is_public = true
        )
        AND 'course.UPDATE' = ANY(vwm.permissions)
    ) 
    OR public.is_admin()
);

--------------------------------------------------------------------------------
-- Define the basic permission levels
--------------------------------------------------------------------------------
INSERT INTO public.permission (permission_code, description) VALUES 
('course.SELECT', 'Can select/view a course'),
('course.INSERT', 'Can insert/create a course'),
('course.UPDATE', 'Can update/edit a course'),
('course.DELETE', 'Can delete a course'),
('course.SHARE', 'Can grant or modify non-owner access levels on a course'),
('course.COMMENT', 'Can comment on a course')
ON CONFLICT (permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Define the basic access levels
--------------------------------------------------------------------------------
INSERT INTO public.entity_type_access_level (entity_type, access_level)
VALUES 
('course', 'owner'),
('course', 'editor'),
('course', 'viewer'),
('course', 'commenter')
ON CONFLICT (entity_type, access_level) DO NOTHING;

--------------------------------------------------------------------------------
-- Setup the permissions for each access level
--------------------------------------------------------------------------------
-- NOTE: If you want to add more permissions to any of the following access levels, you must add them here.
-- For example:
--  If this is the `foo` object,
--  and `foo` objects sometimes have a `bar` object that is considered their child,
--  you may want to add `bar.SELECT` as another permission.
--  The `bar` table can then ask the course permissions for `bar.SELECT` if it needs to.
--------------------------------------------------------------------------------

-- Owners can do anything on the course.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'owner', pc.permission_code
FROM (VALUES 
('course.SELECT'), 
('course.INSERT'), 
('course.UPDATE'), 
('course.DELETE'),
('course.SHARE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Editors can select, update, and comment on a course.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'editor', pc.permission_code
FROM (VALUES 
('course.SELECT'),
('course.UPDATE'),
('course.COMMENT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Viewers can select a course.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
VALUES ('course', 'viewer', 'course.SELECT')
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Commenters can select a course.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'commenter', pc.permission_code
FROM (VALUES 
('course.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;
