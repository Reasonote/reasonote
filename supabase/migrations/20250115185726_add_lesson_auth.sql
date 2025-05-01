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
DROP POLICY IF EXISTS "lesson INSERT" ON public.lesson;
DROP POLICY IF EXISTS "lesson SELECT" ON public.lesson;
DROP POLICY IF EXISTS "lesson UPDATE" ON public.lesson;
DROP POLICY IF EXISTS "lesson DELETE" ON public.lesson;

DROP VIEW IF EXISTS public.vw_lesson_memauth;

CREATE VIEW public.vw_lesson_memauth AS
WITH combined_permissions AS (
    -- Direct lesson permissions
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
    JOIN public.lesson l ON l.id = ma.resource_entity_id
    WHERE ma.resource_entity_type = 'lesson'
    GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.resource_entity_id, ma.access_level, ma.is_public

    UNION

    -- Course-inherited permissions
    SELECT 
        vcm.memauth_id,
        vcm.principal_id,
        vcm.principal_type,
        cl.lesson AS lesson_id,
        vcm.access_level,
        vcm.permissions,
        vcm.is_public
    FROM public.vw_course_memauth vcm
    JOIN public.course_lesson cl ON cl.course = vcm.course_id
)
SELECT 
    memauth_id,
    principal_id,
    principal_type,
    lesson_id,
    access_level,
    array_agg(DISTINCT permission ORDER BY permission) AS permissions,
    bool_or(is_public) AS is_public
FROM (
    SELECT 
        memauth_id,
        principal_id,
        principal_type,
        lesson_id,
        access_level,
        unnest(permissions) AS permission,
        is_public
    FROM combined_permissions
) flattened
GROUP BY 
    memauth_id,
    principal_id,
    principal_type,
    lesson_id,
    access_level;

COMMENT ON VIEW public.vw_lesson_memauth IS 'Shows lesson authorizations, including those inherited from courses through course_lesson. Shows what principals have which access_levels & permissions on which lesson.';
GRANT SELECT ON public.vw_lesson_memauth TO anon, authenticated, service_role;

-- Re-create the lesson policies
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
  OR public.is_admin()
  OR (lesson.created_by = current_rsn_user_id())
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
  OR public.is_admin()
  OR (lesson.created_by = current_rsn_user_id())
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
  OR public.is_admin()
  OR (lesson.created_by = current_rsn_user_id())
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
('lesson.SHARE'),
('activity.SELECT'),
('activity.INSERT'),
('activity.UPDATE'),
('activity.DELETE'),
('activity.SHARE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Editors can select, update, and comment on a lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'editor', pc.permission_code
FROM (VALUES 
('lesson.SELECT'),
('lesson.UPDATE'),
('lesson.COMMENT'),
('activity.SELECT'),
('activity.UPDATE'),
('activity.COMMENT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Viewers can select a lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'viewer', pc.permission_code
FROM (VALUES 
('lesson.SELECT'),
('activity.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Commenters can select a lesson.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'lesson', 'commenter', pc.permission_code
FROM (VALUES 
('lesson.SELECT'),
('activity.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Update vw_activity_memauth to include lesson-inherited permissions
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "activity INSERT" ON public.activity;
DROP POLICY IF EXISTS "activity SELECT" ON public.activity;
DROP POLICY IF EXISTS "activity UPDATE" ON public.activity;
DROP POLICY IF EXISTS "activity DELETE" ON public.activity;

DROP VIEW IF EXISTS public.vw_activity_memauth;

CREATE VIEW public.vw_activity_memauth AS
WITH combined_permissions AS (
    -- Direct activity permissions
    SELECT 
        ma.id AS memauth_id,
        ma.principal_id,
        ma.principal_type,
        ma.resource_entity_id AS activity_id,
        ma.access_level,
        array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions,
        ma.is_public
    FROM public.memauth ma
    JOIN public.access_level_permission alp 
        ON alp.entity_type = 'activity'
        AND upper(alp.access_level) = upper(ma.access_level)
    JOIN public.activity a ON a.id = ma.resource_entity_id
    WHERE ma.resource_entity_type = 'activity'
    GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.resource_entity_id, ma.access_level, ma.is_public

    UNION

    -- Lesson-inherited permissions
    SELECT 
        vlm.memauth_id,
        vlm.principal_id,
        vlm.principal_type,
        la.activity AS activity_id,
        vlm.access_level,
        vlm.permissions,
        vlm.is_public
    FROM public.vw_lesson_memauth vlm
    JOIN public.lesson_activity la ON la.lesson = vlm.lesson_id
)
SELECT 
    memauth_id,
    principal_id,
    principal_type,
    activity_id,
    access_level,
    array_agg(DISTINCT permission ORDER BY permission) AS permissions,
    bool_or(is_public) AS is_public
FROM (
    SELECT 
        memauth_id,
        principal_id,
        principal_type,
        activity_id,
        access_level,
        unnest(permissions) AS permission,
        is_public
    FROM combined_permissions
) flattened
GROUP BY 
    memauth_id,
    principal_id,
    principal_type,
    activity_id,
    access_level;

COMMENT ON VIEW public.vw_activity_memauth IS 'Shows activity authorizations, including those inherited from lessons through lesson_activity. Shows what principals have which access_levels & permissions on which activity.';
GRANT SELECT ON public.vw_activity_memauth TO anon, authenticated, service_role;

-- Re-create the policies that depend on the view
CREATE POLICY "activity INSERT" ON public.activity FOR INSERT WITH CHECK (
  (created_by = (public.current_rsn_user_id())::text)
  OR public.is_admin()
);

CREATE POLICY "activity SELECT" ON public.activity FOR SELECT
USING (
  EXISTS(
    SELECT 1
    FROM vw_activity_memauth vwm
    WHERE vwm.activity_id = activity.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'activity.SELECT' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
  OR (activity.created_by = current_rsn_user_id())
  OR (activity.generated_for_user = current_rsn_user_id())
);

CREATE POLICY "activity UPDATE" ON public.activity FOR UPDATE
USING (
  EXISTS(
    SELECT 1
    FROM vw_activity_memauth vwm
    WHERE vwm.activity_id = activity.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'activity.UPDATE' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
  OR (activity.created_by = current_rsn_user_id())
  OR (activity.generated_for_user = current_rsn_user_id())
);

CREATE POLICY "activity DELETE" ON public.activity FOR DELETE
USING (
  EXISTS(
    SELECT 1
    FROM vw_activity_memauth vwm
    WHERE vwm.activity_id = activity.id
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND 'activity.DELETE' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
  OR (activity.created_by = current_rsn_user_id())
  OR (activity.generated_for_user = current_rsn_user_id())
);

--------------------------------------------------------------------------------
-- Setup course access level permissions (including lesson and activity inheritance)
--------------------------------------------------------------------------------
-- Course owners get all course, lesson, and activity permissions
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'owner', pc.permission_code
FROM (VALUES 
('course.SELECT'),
('course.INSERT'),
('course.UPDATE'),
('course.DELETE'),
('course.SHARE'),
('lesson.SELECT'),
('lesson.INSERT'),
('lesson.UPDATE'),
('lesson.DELETE'),
('lesson.SHARE'),
('activity.SELECT'),
('activity.INSERT'),
('activity.UPDATE'),
('activity.DELETE'),
('activity.SHARE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Course editors get view/edit permissions for courses, lessons, and activities
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'editor', pc.permission_code
FROM (VALUES 
('course.SELECT'),
('course.UPDATE'),
('course.COMMENT'),
('lesson.SELECT'),
('lesson.UPDATE'),
('lesson.COMMENT'),
('activity.SELECT'),
('activity.UPDATE'),
('activity.COMMENT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Course viewers get view permissions for courses, lessons, and activities
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'viewer', pc.permission_code
FROM (VALUES 
('course.SELECT'),
('lesson.SELECT'),
('activity.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Course commenters get view and comment permissions for courses, lessons, and activities
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'commenter', pc.permission_code
FROM (VALUES 
('course.SELECT'),
('course.COMMENT'),
('lesson.SELECT'),
('lesson.COMMENT'),
('activity.SELECT'),
('activity.COMMENT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Update skill policies to allow public SELECT access
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "skill SELECT" ON public.skill;

-- Temporarily allow public SELECT access
CREATE POLICY "skill SELECT" ON public.skill 
FOR SELECT USING (true);

--------------------------------------------------------------------------------
-- Update skill_link policies to allow public SELECT access
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "skill_link SELECT" ON public.skill_link;

-- Allow public SELECT access for skill_link
CREATE POLICY "skill_link SELECT" ON public.skill_link 
FOR SELECT USING (true);

--------------------------------------------------------------------------------
-- Define resource permissions
--------------------------------------------------------------------------------
INSERT INTO public.permission (permission_code, description) VALUES 
('resource.SELECT', 'Can select/view a resource'),
('resource.INSERT', 'Can insert/create a resource'),
('resource.UPDATE', 'Can update/edit a resource'),
('resource.DELETE', 'Can delete a resource')
ON CONFLICT (permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Update resource policies to include course-inherited permissions
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "resource SELECT" ON public.resource;
DROP POLICY IF EXISTS "resource INSERT" ON public.resource;
DROP POLICY IF EXISTS "resource UPDATE" ON public.resource;
DROP POLICY IF EXISTS "resource DELETE" ON public.resource;

-- Resource policies with course inheritance
CREATE POLICY "resource SELECT" ON public.resource FOR SELECT
USING (
  (created_by = current_rsn_user_id() OR is_admin())
  OR (
    parent_course_id IS NOT NULL 
    AND EXISTS(
      SELECT 1 FROM vw_course_memauth vcm
      WHERE vcm.course_id = parent_course_id
        AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
        AND 'resource.SELECT' = ANY(vcm.permissions)
    )
  )
);

CREATE POLICY "resource INSERT" ON public.resource FOR INSERT
WITH CHECK (
  (created_by = current_rsn_user_id() OR is_admin())
  OR (
    parent_course_id IS NOT NULL 
    AND EXISTS(
      SELECT 1 FROM vw_course_memauth vcm
      WHERE vcm.course_id = parent_course_id
        AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
        AND 'resource.INSERT' = ANY(vcm.permissions)
    )
  )
);

CREATE POLICY "resource UPDATE" ON public.resource FOR UPDATE
USING (
  (created_by = current_rsn_user_id() OR is_admin())
  OR (
    parent_course_id IS NOT NULL 
    AND EXISTS(
      SELECT 1 FROM vw_course_memauth vcm
      WHERE vcm.course_id = parent_course_id
        AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
        AND 'resource.UPDATE' = ANY(vcm.permissions)
    )
  )
);

CREATE POLICY "resource DELETE" ON public.resource FOR DELETE
USING (
  (created_by = current_rsn_user_id() OR is_admin())
  OR (
    parent_course_id IS NOT NULL 
    AND EXISTS(
      SELECT 1 FROM vw_course_memauth vcm
      WHERE vcm.course_id = parent_course_id
        AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
        AND 'resource.DELETE' = ANY(vcm.permissions)
    )
  )
);

--------------------------------------------------------------------------------
-- Add resource permissions to course access levels
--------------------------------------------------------------------------------
-- Course owners get all resource permissions
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'owner', pc.permission_code
FROM (VALUES 
('resource.SELECT'),
('resource.INSERT'),
('resource.UPDATE'),
('resource.DELETE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Course editors get view/edit permissions for resources
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'editor', pc.permission_code
FROM (VALUES 
('resource.SELECT'),
('resource.UPDATE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Course viewers get view permissions for resources
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'viewer', pc.permission_code
FROM (VALUES 
('resource.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Course commenters get view permissions for resources
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT 'course', 'commenter', pc.permission_code
FROM (VALUES 
('resource.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Update snip policies to include course-inherited permissions through resources
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "snip SELECT" ON public.snip;
DROP POLICY IF EXISTS "snip INSERT" ON public.snip;
DROP POLICY IF EXISTS "snip UPDATE" ON public.snip;
DROP POLICY IF EXISTS "snip DELETE" ON public.snip;

CREATE POLICY "snip SELECT" ON public.snip FOR SELECT
USING (
  ((current_rsn_user_id()::text = _owner) OR (_owner IS NULL AND (now() - created_date) < '00:02:00'::interval))
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_snip_id = snip.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.SELECT' = ANY(vcm.permissions)
  )
);

CREATE POLICY "snip INSERT" ON public.snip FOR INSERT
WITH CHECK (
  ((current_rsn_user_id()::text = _owner) OR (_owner IS NULL AND (now() - created_date) < '00:02:00'::interval))
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_snip_id = snip.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.INSERT' = ANY(vcm.permissions)
  )
);

CREATE POLICY "snip UPDATE" ON public.snip FOR UPDATE
USING (
  ((current_rsn_user_id()::text = _owner) OR (_owner IS NULL AND (now() - created_date) < '00:02:00'::interval))
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_snip_id = snip.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.UPDATE' = ANY(vcm.permissions)
  )
);

CREATE POLICY "snip DELETE" ON public.snip FOR DELETE
USING (
  ((current_rsn_user_id()::text = _owner) OR (_owner IS NULL AND (now() - created_date) < '00:02:00'::interval))
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_snip_id = snip.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.DELETE' = ANY(vcm.permissions)
  )
);

--------------------------------------------------------------------------------
-- Update rsn_page policies to include course-inherited permissions through resources
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rsn_page SELECT" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page INSERT" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page UPDATE" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page DELETE" ON public.rsn_page;

CREATE POLICY "rsn_page SELECT" ON public.rsn_page FOR SELECT
USING (
  (created_by = current_rsn_user_id()::text OR is_admin())
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_page_id = rsn_page.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.SELECT' = ANY(vcm.permissions)
  )
);

CREATE POLICY "rsn_page INSERT" ON public.rsn_page FOR INSERT
WITH CHECK (
  (created_by = current_rsn_user_id()::text OR is_admin())
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_page_id = rsn_page.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.INSERT' = ANY(vcm.permissions)
  )
);

CREATE POLICY "rsn_page UPDATE" ON public.rsn_page FOR UPDATE
USING (
  (created_by = current_rsn_user_id()::text OR is_admin())
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_page_id = rsn_page.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.UPDATE' = ANY(vcm.permissions)
  )
);

CREATE POLICY "rsn_page DELETE" ON public.rsn_page FOR DELETE
USING (
  (created_by = current_rsn_user_id()::text OR is_admin())
  OR EXISTS (
    SELECT 1 FROM resource r
    JOIN vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
    WHERE r.child_page_id = rsn_page.id
      AND (vcm.principal_id = current_rsn_user_id() OR vcm.is_public = true)
      AND 'resource.DELETE' = ANY(vcm.permissions)
  )
);