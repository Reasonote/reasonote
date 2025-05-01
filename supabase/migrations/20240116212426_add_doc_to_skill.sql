CREATE TABLE public.skill_page (
  id text DEFAULT public.generate_typed_uuid('sklpage'::text) NOT NULL,
  skill_id TEXT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  rsn_page_id TEXT NOT NULL REFERENCES rsn_page(id) ON DELETE CASCADE,
  created_by text,
  updated_by text,
  created_date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comments
COMMENT ON TABLE public.skill_page IS 'A page for a skill';
COMMENT ON COLUMN public.skill_page.id IS 'The unique identifier for the skill page';
COMMENT ON COLUMN public.skill_page.skill_id IS 'The skill that the skill page is for';
COMMENT ON COLUMN public.skill_page.rsn_page_id IS 'The rsn_page that the skill page is for';
COMMENT ON COLUMN public.skill_page.created_by IS 'The user that created the skill page';
COMMENT ON COLUMN public.skill_page.updated_by IS 'The user that last updated the skill page';
COMMENT ON COLUMN public.skill_page.created_date IS 'The date the skill page was created';
COMMENT ON COLUMN public.skill_page.updated_date IS 'The date the skill page was last updated';

-- Permissions
ALTER TABLE public.skill_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_page DELETE" ON public.skill_page FOR DELETE USING (true);
CREATE POLICY "skill_page INSERT" ON public.skill_page FOR
    INSERT WITH CHECK (true);
CREATE POLICY "skill_page SELECT" ON public.skill_page FOR
    SELECT USING (true);
CREATE POLICY "skill_page UPDATE" ON public.skill_page FOR
    UPDATE USING (true);

GRANT ALL ON TABLE public.skill_page TO anon;
GRANT ALL ON TABLE public.skill_page TO authenticated;
GRANT ALL ON TABLE public.skill_page TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.skill_page FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.skill_page FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();



---------------------------------
---------------------------------
---------------------------------

CREATE OR REPLACE FUNCTION public.get_skill_pages(skillid TEXT, parentskillids TEXT[] DEFAULT NULL)
RETURNS TABLE(id TEXT, skill_id TEXT, rsn_page_id TEXT, page_id TEXT, page_name TEXT, page_body TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH skill_pages AS (
        SELECT sp.id, sp.skill_id, sp.rsn_page_id
        FROM skill_page sp
        WHERE sp.skill_id = skillId
        OR (parentSkillIds IS NOT NULL AND sp.skill_id = ANY(parentSkillIds))
    )
    SELECT sp.id, sp.skill_id, sp.rsn_page_id, rp.id, rp._name, rp.body
    FROM skill_pages sp
    JOIN rsn_page rp ON sp.rsn_page_id = rp.id;
END; $$
LANGUAGE plpgsql;