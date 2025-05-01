-- Migration to create memauth views for entity types and update rsn_vec and rsn_vec_queue permissions
-- This migration creates permission views for all tables referenced in rsn_vec_config
-- and updates the permission policies for rsn_vec and rsn_vec_queue to respect these permissions

--------------------------------------------------------------------------------
-- Create permission views for each entity type
--------------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "rsn_vec SELECT" ON public.rsn_vec;
DROP POLICY IF EXISTS "rsn_vec INSERT" ON public.rsn_vec;
DROP POLICY IF EXISTS "rsn_vec UPDATE" ON public.rsn_vec;
DROP POLICY IF EXISTS "rsn_vec DELETE" ON public.rsn_vec;

DROP POLICY IF EXISTS "rsn_vec_queue SELECT" ON public.rsn_vec_queue;
DROP POLICY IF EXISTS "rsn_vec_queue INSERT" ON public.rsn_vec_queue;
DROP POLICY IF EXISTS "rsn_vec_queue UPDATE" ON public.rsn_vec_queue;
DROP POLICY IF EXISTS "rsn_vec_queue DELETE" ON public.rsn_vec_queue;

DROP POLICY IF EXISTS "skill SELECT" ON public.skill;
DROP POLICY IF EXISTS "skill INSERT" ON public.skill;
DROP POLICY IF EXISTS "skill UPDATE" ON public.skill;
DROP POLICY IF EXISTS "skill DELETE" ON public.skill;

DROP POLICY IF EXISTS "goal SELECT" ON public.goal;
DROP POLICY IF EXISTS "goal INSERT" ON public.goal;
DROP POLICY IF EXISTS "goal UPDATE" ON public.goal;
DROP POLICY IF EXISTS "goal DELETE" ON public.goal;

DROP POLICY IF EXISTS "rsn_page SELECT" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page INSERT" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page UPDATE" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page DELETE" ON public.rsn_page;

DROP POLICY IF EXISTS "snip SELECT" ON public.snip;
DROP POLICY IF EXISTS "snip INSERT" ON public.snip;
DROP POLICY IF EXISTS "snip UPDATE" ON public.snip;
DROP POLICY IF EXISTS "snip DELETE" ON public.snip;




-- Drop existing views
DROP VIEW IF EXISTS public.vw_entity_vec_permissions;
DROP VIEW IF EXISTS public.vw_goal_memauth;
DROP VIEW IF EXISTS public.vw_skill_memauth;
DROP VIEW IF EXISTS public.vw_rsn_page_memauth;
DROP VIEW IF EXISTS public.vw_snip_memauth;

-- View for goal permissions
CREATE OR REPLACE VIEW public.vw_goal_memauth AS
SELECT
  g.id as goal_id,
  g.created_by as principal_id,
  'user'::agent_type as principal_type,
  ARRAY['goal.SELECT', 'goal.INSERT', 'goal.UPDATE', 'goal.DELETE'] as permissions,
  false as is_public
FROM public.goal g
UNION ALL
SELECT
  g.id as goal_id,
  'anonymous' as principal_id,
  'user'::agent_type as principal_type,
  ARRAY[]::text[] as permissions,
  false as is_public
FROM public.goal g
WHERE public.is_admin();

COMMENT ON VIEW public.vw_goal_memauth IS 'Shows permissions for goals - currently only the creator has permissions';
GRANT SELECT ON TABLE public.vw_goal_memauth TO anon, authenticated, service_role;

-- View for skill permissions
CREATE OR REPLACE VIEW public.vw_skill_memauth AS
SELECT
  s.id as skill_id,
  s.created_by as principal_id,
  'user'::agent_type as principal_type,
  ARRAY['skill.SELECT', 'skill.INSERT', 'skill.UPDATE', 'skill.DELETE'] as permissions,
  false as is_public
FROM public.skill s
UNION ALL
SELECT
  s.id as skill_id,
  'anonymous' as principal_id,
  'user'::agent_type as principal_type,
  ARRAY[]::text[] as permissions,
  false as is_public
FROM public.skill s
WHERE public.is_admin();

COMMENT ON VIEW public.vw_skill_memauth IS 'Shows permissions for skills - currently only the creator has permissions';
GRANT SELECT ON TABLE public.vw_skill_memauth TO anon, authenticated, service_role;

-- View for rsn_page permissions
CREATE OR REPLACE VIEW public.vw_rsn_page_memauth AS
-- Direct page permissions (created_by)
SELECT
  p.id as page_id,
  p.created_by as principal_id,
  'user'::agent_type as principal_type,
  ARRAY['rsn_page.SELECT', 'rsn_page.INSERT', 'rsn_page.UPDATE', 'rsn_page.DELETE'] as permissions,
  false as is_public
FROM public.rsn_page p
UNION ALL
-- Page permissions inherited through resource from course
SELECT
  p.id as page_id,
  vcm.principal_id,
  vcm.principal_type,
  array_remove(ARRAY[
    CASE WHEN 'resource.SELECT' = ANY(vcm.permissions) THEN 'rsn_page.SELECT' ELSE NULL END,
    CASE WHEN 'resource.INSERT' = ANY(vcm.permissions) THEN 'rsn_page.INSERT' ELSE NULL END,
    CASE WHEN 'resource.UPDATE' = ANY(vcm.permissions) THEN 'rsn_page.UPDATE' ELSE NULL END,
    CASE WHEN 'resource.DELETE' = ANY(vcm.permissions) THEN 'rsn_page.DELETE' ELSE NULL END
  ], NULL) as permissions,
  vcm.is_public
FROM public.rsn_page p
JOIN public.resource r ON r.child_page_id = p.id
JOIN public.vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
UNION ALL
-- Admin permissions
SELECT
  p.id as page_id,
  'anonymous' as principal_id,
  'user'::agent_type as principal_type,
  ARRAY[]::text[] as permissions,
  false as is_public
FROM public.rsn_page p
WHERE public.is_admin();

COMMENT ON VIEW public.vw_rsn_page_memauth IS 'Shows permissions for pages - includes permissions inherited from courses through resources';
GRANT SELECT ON TABLE public.vw_rsn_page_memauth TO anon, authenticated, service_role;

-- View for snip permissions
CREATE OR REPLACE VIEW public.vw_snip_memauth AS
-- Direct snip permissions (_owner)
SELECT
  s.id as snip_id,
  s._owner as principal_id,
  'user'::agent_type as principal_type,
  ARRAY['snip.SELECT', 'snip.INSERT', 'snip.UPDATE', 'snip.DELETE'] as permissions,
  false as is_public
FROM public.snip s
UNION ALL
-- Snip permissions inherited through resource from course
SELECT
  s.id as snip_id,
  vcm.principal_id,
  vcm.principal_type,
  array_remove(ARRAY[
    CASE WHEN 'resource.SELECT' = ANY(vcm.permissions) THEN 'snip.SELECT' ELSE NULL END,
    CASE WHEN 'resource.INSERT' = ANY(vcm.permissions) THEN 'snip.INSERT' ELSE NULL END,
    CASE WHEN 'resource.UPDATE' = ANY(vcm.permissions) THEN 'snip.UPDATE' ELSE NULL END,
    CASE WHEN 'resource.DELETE' = ANY(vcm.permissions) THEN 'snip.DELETE' ELSE NULL END
  ], NULL) as permissions,
  vcm.is_public
FROM public.snip s
JOIN public.resource r ON r.child_snip_id = s.id
JOIN public.vw_course_memauth vcm ON vcm.course_id = r.parent_course_id
UNION ALL
-- Admin permissions
SELECT
  s.id as snip_id,
  'anonymous' as principal_id,
  'user'::agent_type as principal_type,
  ARRAY[]::text[] as permissions,
  false as is_public
FROM public.snip s
WHERE public.is_admin();

COMMENT ON VIEW public.vw_snip_memauth IS 'Shows permissions for snips - includes permissions inherited from courses through resources';
GRANT SELECT ON TABLE public.vw_snip_memauth TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- Create a view that consolidates all entity permissions for rsn_vec reference
--------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_entity_vec_permissions AS
-- Goal permissions
SELECT
  'goal' as tablename,
  goal_id as entity_id,
  principal_id,
  principal_type,
  permissions,
  is_public
FROM public.vw_goal_memauth
UNION ALL
-- Skill permissions
SELECT
  'skill' as tablename,
  skill_id as entity_id,
  principal_id,
  principal_type,
  permissions,
  is_public
FROM public.vw_skill_memauth
UNION ALL
-- RSN Page permissions
SELECT
  'rsn_page' as tablename,
  page_id as entity_id,
  principal_id,
  principal_type,
  permissions,
  is_public
FROM public.vw_rsn_page_memauth
UNION ALL
-- Snip permissions
SELECT
  'snip' as tablename,
  snip_id as entity_id,
  principal_id,
  principal_type,
  permissions,
  is_public
FROM public.vw_snip_memauth;

COMMENT ON VIEW public.vw_entity_vec_permissions IS 'Consolidated permissions view for all vectorizable entities';
GRANT SELECT ON TABLE public.vw_entity_vec_permissions TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- Update permissions for rsn_vec and rsn_vec_queue tables
--------------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "rsn_vec SELECT" ON public.rsn_vec;
DROP POLICY IF EXISTS "rsn_vec INSERT" ON public.rsn_vec;
DROP POLICY IF EXISTS "rsn_vec UPDATE" ON public.rsn_vec;
DROP POLICY IF EXISTS "rsn_vec DELETE" ON public.rsn_vec;

-- Create new policies based on parent entity permissions
CREATE POLICY "rsn_vec SELECT" ON public.rsn_vec FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_entity_vec_permissions vep
    WHERE 
      vep.tablename = rsn_vec.tablename AND
      vep.entity_id = rsn_vec._ref_id AND
      (
        vep.principal_id = current_rsn_user_id() OR
        vep.is_public = true
      ) AND
      (vep.tablename || '.SELECT') = ANY(vep.permissions)
  )
  OR public.is_admin()
  OR EXISTS (
    -- If user created the parent record, they can see its vectors
    SELECT 1
    FROM (
      SELECT id, created_by FROM public.goal WHERE tablename = 'goal'
      UNION ALL
      SELECT id, created_by FROM public.skill WHERE tablename = 'skill'
      UNION ALL
      SELECT id, created_by FROM public.rsn_page WHERE tablename = 'rsn_page'
      UNION ALL
      SELECT id, _owner as created_by FROM public.snip WHERE tablename = 'snip'
    ) as parent_entities
    WHERE parent_entities.id = rsn_vec._ref_id AND parent_entities.created_by = current_rsn_user_id()
  )
);

CREATE POLICY "rsn_vec INSERT" ON public.rsn_vec FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR
  public.is_admin()
);

CREATE POLICY "rsn_vec UPDATE" ON public.rsn_vec FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_entity_vec_permissions vep
    WHERE 
      vep.tablename = rsn_vec.tablename AND
      vep.entity_id = rsn_vec._ref_id AND
      (
        vep.principal_id = current_rsn_user_id() OR
        vep.is_public = true
      ) AND
      (vep.tablename || '.UPDATE') = ANY(vep.permissions)
  )
  OR public.is_admin()
  OR EXISTS (
    -- If user created the parent record, they can update its vectors
    SELECT 1
    FROM (
      SELECT id, created_by FROM public.goal WHERE tablename = 'goal'
      UNION ALL
      SELECT id, created_by FROM public.skill WHERE tablename = 'skill'
      UNION ALL
      SELECT id, created_by FROM public.rsn_page WHERE tablename = 'rsn_page'
      UNION ALL
      SELECT id, _owner as created_by FROM public.snip WHERE tablename = 'snip'
    ) as parent_entities
    WHERE parent_entities.id = rsn_vec._ref_id AND parent_entities.created_by = current_rsn_user_id()
  )
);

CREATE POLICY "rsn_vec DELETE" ON public.rsn_vec FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_entity_vec_permissions vep
    WHERE 
      vep.tablename = rsn_vec.tablename AND
      vep.entity_id = rsn_vec._ref_id AND
      (
        vep.principal_id = current_rsn_user_id() OR
        vep.is_public = true
      ) AND
      (vep.tablename || '.DELETE') = ANY(vep.permissions)
  )
  OR public.is_admin()
  OR EXISTS (
    -- If user created the parent record, they can delete its vectors
    SELECT 1
    FROM (
      SELECT id, created_by FROM public.goal WHERE tablename = 'goal'
      UNION ALL
      SELECT id, created_by FROM public.skill WHERE tablename = 'skill'
      UNION ALL
      SELECT id, created_by FROM public.rsn_page WHERE tablename = 'rsn_page'
      UNION ALL
      SELECT id, _owner as created_by FROM public.snip WHERE tablename = 'snip'
    ) as parent_entities
    WHERE parent_entities.id = rsn_vec._ref_id AND parent_entities.created_by = current_rsn_user_id()
  )
);

-- Update permissions for rsn_vec_queue table
DROP POLICY IF EXISTS "rsn_vec_queue SELECT" ON public.rsn_vec_queue;
DROP POLICY IF EXISTS "rsn_vec_queue INSERT" ON public.rsn_vec_queue;
DROP POLICY IF EXISTS "rsn_vec_queue UPDATE" ON public.rsn_vec_queue;
DROP POLICY IF EXISTS "rsn_vec_queue DELETE" ON public.rsn_vec_queue;

CREATE POLICY "rsn_vec_queue SELECT" ON public.rsn_vec_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_entity_vec_permissions vep
    WHERE 
      vep.tablename = rsn_vec_queue.tablename AND
      vep.entity_id = rsn_vec_queue._ref_id AND
      (
        vep.principal_id = current_rsn_user_id() OR
        vep.is_public = true
      ) AND
      (vep.tablename || '.SELECT') = ANY(vep.permissions)
  )
  OR public.is_admin()
  OR EXISTS (
    -- If user created the parent record, they can see its queue items
    SELECT 1
    FROM (
      SELECT id, created_by FROM public.goal WHERE tablename = 'goal'
      UNION ALL
      SELECT id, created_by FROM public.skill WHERE tablename = 'skill'
      UNION ALL
      SELECT id, created_by FROM public.rsn_page WHERE tablename = 'rsn_page'
      UNION ALL
      SELECT id, _owner as created_by FROM public.snip WHERE tablename = 'snip'
    ) as parent_entities
    WHERE parent_entities.id = rsn_vec_queue._ref_id AND parent_entities.created_by = current_rsn_user_id()
  )
);

CREATE POLICY "rsn_vec_queue INSERT" ON public.rsn_vec_queue FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR
  public.is_admin()
);

CREATE POLICY "rsn_vec_queue UPDATE" ON public.rsn_vec_queue FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_entity_vec_permissions vep
    WHERE 
      vep.tablename = rsn_vec_queue.tablename AND
      vep.entity_id = rsn_vec_queue._ref_id AND
      (
        vep.principal_id = current_rsn_user_id() OR
        vep.is_public = true
      ) AND
      (vep.tablename || '.UPDATE') = ANY(vep.permissions)
  )
  OR public.is_admin()
  OR EXISTS (
    -- If user created the parent record, they can update its queue items
    SELECT 1
    FROM (
      SELECT id, created_by FROM public.goal WHERE tablename = 'goal'
      UNION ALL
      SELECT id, created_by FROM public.skill WHERE tablename = 'skill'
      UNION ALL
      SELECT id, created_by FROM public.rsn_page WHERE tablename = 'rsn_page'
      UNION ALL
      SELECT id, _owner as created_by FROM public.snip WHERE tablename = 'snip'
    ) as parent_entities
    WHERE parent_entities.id = rsn_vec_queue._ref_id AND parent_entities.created_by = current_rsn_user_id()
  )
);

CREATE POLICY "rsn_vec_queue DELETE" ON public.rsn_vec_queue FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_entity_vec_permissions vep
    WHERE 
      vep.tablename = rsn_vec_queue.tablename AND
      vep.entity_id = rsn_vec_queue._ref_id AND
      (
        vep.principal_id = current_rsn_user_id() OR
        vep.is_public = true
      ) AND
      (vep.tablename || '.DELETE') = ANY(vep.permissions)
  )
  OR public.is_admin()
  OR EXISTS (
    -- If user created the parent record, they can delete its queue items
    SELECT 1
    FROM (
      SELECT id, created_by FROM public.goal WHERE tablename = 'goal'
      UNION ALL
      SELECT id, created_by FROM public.skill WHERE tablename = 'skill'
      UNION ALL
      SELECT id, created_by FROM public.rsn_page WHERE tablename = 'rsn_page'
      UNION ALL
      SELECT id, _owner as created_by FROM public.snip WHERE tablename = 'snip'
    ) as parent_entities
    WHERE parent_entities.id = rsn_vec_queue._ref_id AND parent_entities.created_by = current_rsn_user_id()
  )
);



-- Migration to update entity tables to use their memauth views for permission checks
-- This ensures consistent permission handling between entities and their vector representations
-- INSERT policies are relaxed to only require authentication

--------------------------------------------------------------------------------
-- Update skill table policies to use vw_skill_memauth
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "skill SELECT" ON public.skill;
DROP POLICY IF EXISTS "skill INSERT" ON public.skill;
DROP POLICY IF EXISTS "skill UPDATE" ON public.skill;
DROP POLICY IF EXISTS "skill DELETE" ON public.skill;

CREATE POLICY "skill SELECT" ON public.skill FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_skill_memauth vsm
    WHERE 
      vsm.skill_id = skill.id AND
      (
        vsm.principal_id = current_rsn_user_id() OR
        vsm.is_public = true
      ) AND
      'skill.SELECT' = ANY(vsm.permissions)
  )
  OR public.is_admin()
  OR (skill.created_by = current_rsn_user_id())
);

CREATE POLICY "skill INSERT" ON public.skill FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR
  public.is_admin()
);

CREATE POLICY "skill UPDATE" ON public.skill FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_skill_memauth vsm
    WHERE 
      vsm.skill_id = skill.id AND
      (
        vsm.principal_id = current_rsn_user_id() OR
        vsm.is_public = true
      ) AND
      'skill.UPDATE' = ANY(vsm.permissions)
  )
  OR public.is_admin()
  OR (skill.created_by = current_rsn_user_id())
);

CREATE POLICY "skill DELETE" ON public.skill FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_skill_memauth vsm
    WHERE 
      vsm.skill_id = skill.id AND
      (
        vsm.principal_id = current_rsn_user_id() OR
        vsm.is_public = true
      ) AND
      'skill.DELETE' = ANY(vsm.permissions)
  )
  OR public.is_admin()
  OR (skill.created_by = current_rsn_user_id())
);

--------------------------------------------------------------------------------
-- Update goal table policies to use vw_goal_memauth
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "goal SELECT" ON public.goal;
DROP POLICY IF EXISTS "goal INSERT" ON public.goal;
DROP POLICY IF EXISTS "goal UPDATE" ON public.goal;
DROP POLICY IF EXISTS "goal DELETE" ON public.goal;

CREATE POLICY "goal SELECT" ON public.goal FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_goal_memauth vgm
    WHERE 
      vgm.goal_id = goal.id AND
      (
        vgm.principal_id = current_rsn_user_id() OR
        vgm.is_public = true
      ) AND
      'goal.SELECT' = ANY(vgm.permissions)
  )
  OR public.is_admin()
  OR (goal.created_by = current_rsn_user_id())
);

CREATE POLICY "goal INSERT" ON public.goal FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR
  public.is_admin()
);

CREATE POLICY "goal UPDATE" ON public.goal FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_goal_memauth vgm
    WHERE 
      vgm.goal_id = goal.id AND
      (
        vgm.principal_id = current_rsn_user_id() OR
        vgm.is_public = true
      ) AND
      'goal.UPDATE' = ANY(vgm.permissions)
  )
  OR public.is_admin()
  OR (goal.created_by = current_rsn_user_id())
);

CREATE POLICY "goal DELETE" ON public.goal FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_goal_memauth vgm
    WHERE 
      vgm.goal_id = goal.id AND
      (
        vgm.principal_id = current_rsn_user_id() OR
        vgm.is_public = true
      ) AND
      'goal.DELETE' = ANY(vgm.permissions)
  )
  OR public.is_admin()
  OR (goal.created_by = current_rsn_user_id())
);

--------------------------------------------------------------------------------
-- Update rsn_page table policies to use vw_rsn_page_memauth
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rsn_page SELECT" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page INSERT" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page UPDATE" ON public.rsn_page;
DROP POLICY IF EXISTS "rsn_page DELETE" ON public.rsn_page;

CREATE POLICY "rsn_page SELECT" ON public.rsn_page FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_rsn_page_memauth vrpm
    WHERE 
      vrpm.page_id = rsn_page.id AND
      (
        vrpm.principal_id = current_rsn_user_id() OR
        vrpm.is_public = true
      ) AND
      'rsn_page.SELECT' = ANY(vrpm.permissions)
  )
  OR
  public.is_admin()
  OR
  created_by = current_rsn_user_id()
);

CREATE POLICY "rsn_page INSERT" ON public.rsn_page FOR INSERT
WITH CHECK (
  current_rsn_user_id() IS NOT NULL OR
  public.is_admin()
);

CREATE POLICY "rsn_page UPDATE" ON public.rsn_page FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_rsn_page_memauth vrpm
    WHERE 
      vrpm.page_id = rsn_page.id AND
      (
        vrpm.principal_id = current_rsn_user_id() OR
        vrpm.is_public = true
      ) AND
      'rsn_page.UPDATE' = ANY(vrpm.permissions)
  )
  OR public.is_admin()
  OR (rsn_page.created_by = current_rsn_user_id())
);

CREATE POLICY "rsn_page DELETE" ON public.rsn_page FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_rsn_page_memauth vrpm
    WHERE 
      vrpm.page_id = rsn_page.id AND
      (
        vrpm.principal_id = current_rsn_user_id() OR
        vrpm.is_public = true
      ) AND
      'rsn_page.DELETE' = ANY(vrpm.permissions)
  )
  OR public.is_admin()
  OR (rsn_page.created_by = current_rsn_user_id())
);

--------------------------------------------------------------------------------
-- Update snip table policies to use vw_snip_memauth
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "snip SELECT" ON public.snip;
DROP POLICY IF EXISTS "snip INSERT" ON public.snip;
DROP POLICY IF EXISTS "snip UPDATE" ON public.snip;
DROP POLICY IF EXISTS "snip DELETE" ON public.snip;

CREATE POLICY "snip SELECT" ON public.snip FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_snip_memauth vsm
    WHERE 
      vsm.snip_id = snip.id AND
      (
        vsm.principal_id = current_rsn_user_id() OR
        vsm.is_public = true
      ) AND
      'snip.SELECT' = ANY(vsm.permissions)
  )
  OR public.is_admin()
  OR (snip._owner = current_rsn_user_id())
);

CREATE POLICY "snip INSERT" ON public.snip FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR
  public.is_admin()
);

CREATE POLICY "snip UPDATE" ON public.snip FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_snip_memauth vsm
    WHERE 
      vsm.snip_id = snip.id AND
      (
        vsm.principal_id = current_rsn_user_id() OR
        vsm.is_public = true
      ) AND
      'snip.UPDATE' = ANY(vsm.permissions)
  )
  OR public.is_admin()
  OR (snip._owner = current_rsn_user_id())
);

CREATE POLICY "snip DELETE" ON public.snip FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vw_snip_memauth vsm
    WHERE 
      vsm.snip_id = snip.id AND
      (
        vsm.principal_id = current_rsn_user_id() OR
        vsm.is_public = true
      ) AND
      'snip.DELETE' = ANY(vsm.permissions)
  )
  OR public.is_admin()
  OR (snip._owner = current_rsn_user_id())
); 