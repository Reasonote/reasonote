---------------------------------------------------------------------
-- Create table `skill_set`
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('skill_set', 'skillset');
CREATE TABLE skill_set (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('skillset')),
    CONSTRAINT skill_set__id__check_prefix CHECK (public.is_valid_typed_uuid('skillset', id)),
    _name text,
    -- If this is a user's personal skill set, this will be the user's id
    for_user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    _description text,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE skill_set IS 'A set of skills';
COMMENT ON COLUMN skill_set.id IS 'The unique identifier for the skill set';
COMMENT ON COLUMN skill_set._name IS 'The name of the skill set';
COMMENT ON COLUMN skill_set.for_user IS 'If this is a user''s personal skill set, this will be the user''s id';
COMMENT ON COLUMN skill_set._description IS 'The description of the skill set';
COMMENT ON COLUMN skill_set.metadata IS 'The metadata for the skill set';
COMMENT ON COLUMN skill_set.created_date IS 'The date the skill set was created';
COMMENT ON COLUMN skill_set.updated_date IS 'The date the skill set was last updated';
COMMENT ON COLUMN skill_set.created_by IS 'The user that created the skill set';
COMMENT ON COLUMN skill_set.updated_by IS 'The user that last updated the skill set';

--------------------
-- Permissions
ALTER TABLE public.skill_set ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.skill_set TO authenticated;
CREATE POLICY skill_set__authenticated__insert ON public.skill_set FOR INSERT TO authenticated WITH CHECK (
    CASE
        -- Can only insert if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY skill_set__authenticated__select ON public.skill_set FOR SELECT TO authenticated USING (
    CASE
        -- Can only select if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY skill_set__authenticated__update ON public.skill_set FOR UPDATE TO authenticated USING (
    CASE
        -- Can only update if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY skill_set__authenticated__delete ON public.skill_set FOR DELETE TO authenticated USING (
    CASE
        -- Can only delete if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);

-- anon NO access
GRANT ALL ON TABLE public.skill_set TO anon;
CREATE POLICY skill_set__anon__insert ON public.skill_set FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY skill_set__anon__select ON public.skill_set FOR SELECT TO anon USING (false);
CREATE POLICY skill_set__anon__update ON public.skill_set FOR UPDATE TO anon USING (false);
CREATE POLICY skill_set__anon__delete ON public.skill_set FOR DELETE TO anon USING (false);

-- service_role ALL access
GRANT ALL ON TABLE public.skill_set TO service_role;
CREATE POLICY skill_set__service_role__insert ON public.skill_set FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY skill_set__service_role__select ON public.skill_set FOR SELECT TO service_role USING (true);
CREATE POLICY skill_set__service_role__update ON public.skill_set FOR UPDATE TO service_role USING (true);
CREATE POLICY skill_set__service_role__delete ON public.skill_set FOR DELETE TO service_role USING (true);

-------------------------
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
        OR
    UPDATE ON public.skill_set FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
        OR DELETE
        OR
    UPDATE ON public.skill_set FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

---------------------------------------------------------------------
-- Create table `skill_set_skill`
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('skill_set_skill', 'sklsetskl');

CREATE TABLE skill_set_skill (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('sklsetskl')),
    CONSTRAINT skill_set_skill__id__check_prefix CHECK (public.is_valid_typed_uuid('sklsetskl', id)),
    skill_set text REFERENCES public.skill_set(id) ON DELETE CASCADE,
    skill text REFERENCES public.skill(id) ON DELETE CASCADE,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE skill_set_skill IS 'A skill in a skill set';
COMMENT ON COLUMN skill_set_skill.id IS 'The unique identifier for the skill set skill';
COMMENT ON COLUMN skill_set_skill.skill_set IS 'The skill set the skill belongs to';
COMMENT ON COLUMN skill_set_skill.skill IS 'The skill';
COMMENT ON COLUMN skill_set_skill.metadata IS 'The metadata for the skill set skill';
COMMENT ON COLUMN skill_set_skill.created_date IS 'The date the skill set skill was created';
COMMENT ON COLUMN skill_set_skill.updated_date IS 'The date the skill set skill was last updated';
COMMENT ON COLUMN skill_set_skill.created_by IS 'The user that created the skill set skill';
COMMENT ON COLUMN skill_set_skill.updated_by IS 'The user that last updated the skill set skill';

--------------------
-- Permissions
ALTER TABLE public.skill_set_skill ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.skill_set_skill TO authenticated;
CREATE POLICY skill_set_skill__authenticated__insert ON public.skill_set_skill FOR INSERT TO authenticated WITH CHECK (
    CASE
        -- Can only insert if skill_set is the user's id.
        WHEN (skill_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM skill_set WHERE id = skill_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY skill_set_skill__authenticated__select ON public.skill_set_skill FOR SELECT TO authenticated USING (
    CASE
        -- Can only select if skill_set is the user's id.
        WHEN (skill_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM skill_set WHERE id = skill_set_skill.skill_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY skill_set_skill__authenticated__update ON public.skill_set_skill FOR UPDATE TO authenticated USING (
    CASE
        -- Can only update if skill_set is the user's id.
        WHEN (skill_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM skill_set WHERE id = skill_set_skill.skill_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY skill_set_skill__authenticated__delete ON public.skill_set_skill FOR DELETE TO authenticated USING (
    CASE
        -- Can only delete if skill_set is the user's id.
        WHEN (skill_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM skill_set WHERE id = skill_set_skill.skill_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);

-- anon NO access
GRANT ALL ON TABLE public.skill_set_skill TO anon;
CREATE POLICY skill_set_skill__anon__insert ON public.skill_set_skill FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY skill_set_skill__anon__select ON public.skill_set_skill FOR SELECT TO anon USING (false);
CREATE POLICY skill_set_skill__anon__update ON public.skill_set_skill FOR UPDATE TO anon USING (false);
CREATE POLICY skill_set_skill__anon__delete ON public.skill_set_skill FOR DELETE TO anon USING (false);

-- service_role ALL access
GRANT ALL ON TABLE public.skill_set_skill TO service_role;
CREATE POLICY skill_set_skill__service_role__insert ON public.skill_set_skill FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY skill_set_skill__service_role__select ON public.skill_set_skill FOR SELECT TO service_role USING (true);
CREATE POLICY skill_set_skill__service_role__update ON public.skill_set_skill FOR UPDATE TO service_role USING (true);
CREATE POLICY skill_set_skill__service_role__delete ON public.skill_set_skill FOR DELETE TO service_role USING (true);