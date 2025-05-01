
CREATE TABLE public.activity (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('actvty')),
    CONSTRAINT activity__id__check_prefix CHECK (public.is_valid_typed_uuid('actvty', id)),
    _name text NOT NULL,
    _type text,
    type_config jsonb,
    source text,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);
-- Comments
COMMENT ON TABLE public.activity IS 'An activity can be anything the user could engage in as an isolated experience -- a level of a video game, a page in a book, a chapter in a course, etc.';
COMMENT ON COLUMN public.activity.id IS 'The unique identifier for the activity';
COMMENT ON COLUMN public.activity._name IS 'The name of the activity';
COMMENT ON COLUMN public.activity._type IS 'The type of the activity (CURRENT OPTIONS: "flashcard" | "fill-in-the-blank" | "multiple-choice" | "teach-the-ai")';
COMMENT ON COLUMN public.activity.type_config IS 'The configuration for the activity type';
COMMENT ON COLUMN public.activity.source IS 'The source of the activity (CURRENT OPTIONS: "ai-generated" | "manual")';
COMMENT ON COLUMN public.activity.metadata IS 'The metadata of the activity';
COMMENT ON COLUMN public.activity.created_date IS 'The date the activity was created';
COMMENT ON COLUMN public.activity.updated_date IS 'The date the activity was last updated';
COMMENT ON COLUMN public.activity.created_by IS 'The user that created the activity';
COMMENT ON COLUMN public.activity.updated_by IS 'The user that last updated the activity';


-- Permissions
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity DELETE" ON public.activity FOR DELETE USING (true);
CREATE POLICY "activity INSERT" ON public.activity FOR INSERT WITH CHECK (true);
CREATE POLICY "activity SELECT" ON public.activity FOR SELECT USING (true);
CREATE POLICY "activity UPDATE" ON public.activity FOR UPDATE USING (true);

GRANT ALL ON TABLE public.activity TO anon;
GRANT ALL ON TABLE public.activity TO authenticated;
GRANT ALL ON TABLE public.activity TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

---------------------------------------------


CREATE TABLE public.activity_skill (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('actvskl')),
    CONSTRAINT activity_skill__id__check_prefix CHECK (public.is_valid_typed_uuid('actvskl', id)),
    _name text NOT NULL,
    _type text,
    _weight integer,
    activity text REFERENCES public.activity(id) ON DELETE CASCADE,
    skill text REFERENCES public.skill(id) ON DELETE CASCADE,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);
-- Comments
COMMENT ON TABLE public.activity_skill IS 'A skill that is part of an activity';
COMMENT ON COLUMN public.activity_skill.id IS 'The unique identifier for the activity skill';
COMMENT ON COLUMN public.activity_skill._name IS 'The name of the activity skill';
COMMENT ON COLUMN public.activity_skill._type IS 'The type of the activity skill ("ai-generated" and "manual")';
COMMENT ON COLUMN public.activity_skill._weight IS 'The weight of the activity skill';
COMMENT ON COLUMN public.activity_skill.activity IS 'The activity that the skill is part of';
COMMENT ON COLUMN public.activity_skill.skill IS 'The skill that is part of the activity';
COMMENT ON COLUMN public.activity_skill.metadata IS 'The metadata of the activity skill';
COMMENT ON COLUMN public.activity_skill.created_date IS 'The date the activity skill was created';
COMMENT ON COLUMN public.activity_skill.updated_date IS 'The date the activity skill was last updated';
COMMENT ON COLUMN public.activity_skill.created_by IS 'The user that created the activity skill';
COMMENT ON COLUMN public.activity_skill.updated_by IS 'The user that last updated the activity skill';

-- Permissions
ALTER TABLE public.activity_skill ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_skill DELETE" ON public.activity_skill FOR DELETE USING (true);
CREATE POLICY "activity_skill INSERT" ON public.activity_skill FOR
INSERT WITH CHECK (true);
CREATE POLICY "activity_skill SELECT" ON public.activity_skill FOR
SELECT USING (true);
CREATE POLICY "activity_skill UPDATE" ON public.activity_skill FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.activity_skill TO anon;
GRANT ALL ON TABLE public.activity_skill TO authenticated;
GRANT ALL ON TABLE public.activity_skill TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.activity_skill FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.activity_skill FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();