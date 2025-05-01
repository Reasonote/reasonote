-- Delete old policies
DROP POLICY IF EXISTS skill_set__authenticated__delete ON public.skill_set;
DROP POLICY IF EXISTS skill_set__authenticated__insert ON public.skill_set;
DROP POLICY IF EXISTS skill_set__authenticated__select ON public.skill_set;
DROP POLICY IF EXISTS skill_set__authenticated__update ON public.skill_set;

DROP POLICY IF EXISTS skill_set_skill__authenticated__delete ON public.skill_set_skill;
DROP POLICY IF EXISTS skill_set_skill__authenticated__insert ON public.skill_set_skill;
DROP POLICY IF EXISTS skill_set_skill__authenticated__select ON public.skill_set_skill;
DROP POLICY IF EXISTS skill_set_skill__authenticated__update ON public.skill_set_skill;

-- Create new policies for skill_set
CREATE POLICY skill_set__authenticated__delete ON public.skill_set FOR DELETE TO authenticated USING (
    is_admin() OR
    CASE
        WHEN (for_user IS NOT NULL) THEN (for_user = (public.current_rsn_user_id())::text)
        ELSE true
    END
);
CREATE POLICY skill_set__authenticated__insert ON public.skill_set FOR INSERT TO authenticated WITH CHECK (
    is_admin() OR
    CASE
        WHEN (for_user IS NOT NULL) THEN (for_user = (public.current_rsn_user_id())::text)
        ELSE true
    END
);
CREATE POLICY skill_set__authenticated__select ON public.skill_set FOR SELECT TO authenticated USING (
    is_admin() OR
    CASE
        WHEN (for_user IS NOT NULL) THEN (for_user = (public.current_rsn_user_id())::text)
        ELSE true
    END
);
CREATE POLICY skill_set__authenticated__update ON public.skill_set FOR UPDATE TO authenticated USING (
    is_admin() OR
    CASE
        WHEN (for_user IS NOT NULL) THEN (for_user = (public.current_rsn_user_id())::text)
        ELSE true
    END
);

-- Create new policies for skill_set_skill
CREATE POLICY skill_set_skill__authenticated__delete ON public.skill_set_skill FOR DELETE TO authenticated USING (
    is_admin() OR
    CASE
        WHEN (skill_set IS NOT NULL) THEN ( SELECT (skill_set.for_user = (public.current_rsn_user_id())::text)
           FROM public.skill_set
          WHERE (skill_set.id = skill_set_skill.skill_set))
        ELSE true
    END
);
CREATE POLICY skill_set_skill__authenticated__insert ON public.skill_set_skill FOR INSERT TO authenticated WITH CHECK (
    is_admin() OR
    CASE
        WHEN (skill_set IS NOT NULL) THEN ( SELECT (skill_set.for_user = (public.current_rsn_user_id())::text)
           FROM public.skill_set
          WHERE (skill_set.id = skill_set_skill.skill_set))
        ELSE true
    END
);
CREATE POLICY skill_set_skill__authenticated__select ON public.skill_set_skill FOR SELECT TO authenticated USING (
    is_admin() OR
    CASE
        WHEN (skill_set IS NOT NULL) THEN ( SELECT (skill_set.for_user = (public.current_rsn_user_id())::text)
           FROM public.skill_set
          WHERE (skill_set.id = skill_set_skill.skill_set))
        ELSE true
    END
);
CREATE POLICY skill_set_skill__authenticated__update ON public.skill_set_skill FOR UPDATE TO authenticated USING (
    is_admin() OR
    CASE
        WHEN (skill_set IS NOT NULL) THEN ( SELECT (skill_set.for_user = (public.current_rsn_user_id())::text)
           FROM public.skill_set
          WHERE (skill_set.id = skill_set_skill.skill_set))
        ELSE true
    END
);
