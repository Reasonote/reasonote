

CREATE TABLE public.skill_link (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('sklconn')),
    CONSTRAINT skill_link__id__check_prefix CHECK (public.is_valid_typed_uuid('sklconn', id)),
    _type text,
    _weight float,
    downstream_skill text REFERENCES public.skill(id) ON DELETE SET NULL,
    upstream_skill text REFERENCES public.skill(id) ON DELETE SET NULL,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);
-- Comments
COMMENT ON TABLE public.skill_link IS 'Table holding connections between skills';
COMMENT ON COLUMN public.skill_link.id IS 'Unique identifier for the skill connection';
COMMENT ON COLUMN public.skill_link._type IS 'Type of the skill connection';
COMMENT ON COLUMN public.skill_link._weight IS 'Weight of the skill connection';
COMMENT ON COLUMN public.skill_link.downstream_skill IS 'Reference to the downstream skill in the skill connection';
COMMENT ON COLUMN public.skill_link.upstream_skill IS 'Reference to the upstream skill in the skill connection';
COMMENT ON COLUMN public.skill_link.metadata IS 'Metadata associated with the skill connection';
COMMENT ON COLUMN public.skill_link.created_date IS 'Timestamp when the skill connection was created';
COMMENT ON COLUMN public.skill_link.updated_date IS 'Timestamp when the skill connection was last updated';
COMMENT ON COLUMN public.skill_link.created_by IS 'User who created the skill connection';
COMMENT ON COLUMN public.skill_link.updated_by IS 'User who last updated the skill connection';


-- Permissions
ALTER TABLE public.skill_link ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_link DELETE" ON public.skill_link FOR DELETE USING (true);
CREATE POLICY "skill_link INSERT" ON public.skill_link FOR
INSERT WITH CHECK (true);
CREATE POLICY "skill_link SELECT" ON public.skill_link FOR
SELECT USING (true);
CREATE POLICY "skill_link UPDATE" ON public.skill_link FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.skill_link TO anon;
GRANT ALL ON TABLE public.skill_link TO authenticated;
GRANT ALL ON TABLE public.skill_link TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.skill_link FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.skill_link FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();