-- Create Analyzers
CREATE TABLE public.analyzer (
    id text DEFAULT public.generate_typed_uuid('analyzer'::text) NOT NULL,
    _name text,
    _description text,
    ai_prompt text,
    ai_jsonschema jsonb,
    metadata jsonb,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT analyzer_pkey PRIMARY KEY (id),
    CONSTRAINT analyzer_id_check CHECK (public.is_valid_typed_uuid('analyzer'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.analyzer.id IS 'The unique identifier for the analyzer.';
COMMENT ON COLUMN public.analyzer._name IS 'The name of the analyzer.';
COMMENT ON COLUMN public.analyzer._description IS 'The description of the analyzer.';
COMMENT ON COLUMN public.analyzer.ai_prompt IS 'The prompt for the AI to use when analyzing a document.';
COMMENT ON COLUMN public.analyzer.ai_jsonschema IS 'The JSON schema output for the analyzer, passed to the AI.';
COMMENT ON COLUMN public.analyzer.metadata IS 'The metadata for the analyzer.';
COMMENT ON COLUMN public.analyzer.created_date IS 'The date that this analyzer was created.';
COMMENT ON COLUMN public.analyzer.updated_date IS 'The date that this analyzer was last updated.';
COMMENT ON COLUMN public.analyzer.created_by IS 'The user that created this analyzer.';
COMMENT ON COLUMN public.analyzer.updated_by IS 'The user that last updated this analyzer.';
COMMENT ON TABLE public.analyzer IS 'An analyzer is a tool that can be used to analyze a document or a set of documents.';

-- Permissions
ALTER TABLE public.analyzer ENABLE ROW LEVEL SECURITY;

-- Only creator can do anything.
CREATE POLICY "analyzer DELETE" ON public.analyzer FOR DELETE USING (
    ((current_rsn_user_id())::text = (created_by)::text)
);
CREATE POLICY "analyzer INSERT" ON public.analyzer FOR
    INSERT WITH CHECK (
        ((current_rsn_user_id())::text = (created_by)::text)
    );
CREATE POLICY "analyzer SELECT" ON public.analyzer FOR
    SELECT USING (
        ((current_rsn_user_id())::text = (created_by)::text)
    );
CREATE POLICY "analyzer UPDATE" ON public.analyzer FOR
    UPDATE USING (
        ((current_rsn_user_id())::text = (created_by)::text)
    );

GRANT ALL ON TABLE public.analyzer TO anon;
GRANT ALL ON TABLE public.analyzer TO authenticated;
GRANT ALL ON TABLE public.analyzer TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.analyzer FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.analyzer FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

---------------------------------------------------------------------------------------


CREATE TABLE public.lesson (
    id text DEFAULT public.generate_typed_uuid('lesson'::text) NOT NULL,
    _name text,
    _summary text,
    for_user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    metadata jsonb,
    root_skill text NOT NULL REFERENCES public.skill(id),
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT lesson_pkey PRIMARY KEY (id),
    CONSTRAINT lesson_id_check CHECK (public.is_valid_typed_uuid('lesson'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.lesson.id IS 'The unique identifier for the lesson.';
COMMENT ON COLUMN public.lesson._name IS 'The name of the lesson.';
COMMENT ON COLUMN public.lesson._summary IS 'The summary of the lesson.';
COMMENT ON COLUMN public.lesson.metadata IS 'The metadata for the lesson.';
COMMENT ON COLUMN public.lesson.created_date IS 'The date that this lesson was created.';
COMMENT ON COLUMN public.lesson.updated_date IS 'The date that this lesson was last updated.';
COMMENT ON COLUMN public.lesson.created_by IS 'The user that created this lesson.';
COMMENT ON COLUMN public.lesson.updated_by IS 'The user that last updated this lesson.';
COMMENT ON TABLE public.lesson IS 'A lesson is a group of skills, activities, and configuration for a specific learning goal..';

ALTER TABLE public.lesson ADD CONSTRAINT lesson_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;
ALTER TABLE public.lesson ADD CONSTRAINT lesson_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;


-- Permissions
ALTER TABLE public.lesson ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson DELETE" ON public.lesson FOR DELETE USING (true);
CREATE POLICY "lesson INSERT" ON public.lesson FOR
    INSERT WITH CHECK (true);
CREATE POLICY "lesson SELECT" ON public.lesson FOR
    SELECT USING (true);
CREATE POLICY "lesson UPDATE" ON public.lesson FOR
    UPDATE USING (true);

GRANT ALL ON TABLE public.lesson TO anon;
GRANT ALL ON TABLE public.lesson TO authenticated;
GRANT ALL ON TABLE public.lesson TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.lesson FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.lesson FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


---------------------------------------------------------------------------------------


CREATE TABLE public.lesson_activity (
    id text DEFAULT public.generate_typed_uuid('lsnact'::text) NOT NULL,
    lesson text REFERENCES public.lesson(id) ON DELETE CASCADE,
    activity text REFERENCES public.activity(id) ON DELETE CASCADE,
    metadata jsonb,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT lesson_activity_pkey PRIMARY KEY (id),
    CONSTRAINT lesson_activity_id_check CHECK (public.is_valid_typed_uuid('lsnact'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.lesson_activity.id IS 'The unique identifier for the lesson activity.';
COMMENT ON COLUMN public.lesson_activity.lesson IS 'The corresponding lesson.';
COMMENT ON COLUMN public.lesson_activity.activity IS 'The activity.';
COMMENT ON COLUMN public.lesson_activity.metadata IS 'The metadata for the lesson activity.';
COMMENT ON COLUMN public.lesson_activity.created_date IS 'The date that this lesson activity was created.';
COMMENT ON COLUMN public.lesson_activity.updated_date IS 'The date that this lesson activity was last updated.';
COMMENT ON COLUMN public.lesson_activity.created_by IS 'The user that created this lesson activity.';
COMMENT ON COLUMN public.lesson_activity.updated_by IS 'The user that last updated this lesson activity.';
COMMENT ON TABLE public.lesson_activity IS 'The link between an lesson and an activity.';

-- Permissions
ALTER TABLE public.lesson_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_activity DELETE" ON public.lesson_activity FOR DELETE USING (true);
CREATE POLICY "lesson_activity INSERT" ON public.lesson_activity FOR
    INSERT WITH CHECK (true);
CREATE POLICY "lesson_activity SELECT" ON public.lesson_activity FOR
    SELECT USING (true);
CREATE POLICY "lesson_activity UPDATE" ON public.lesson_activity FOR
    UPDATE USING (true);

GRANT ALL ON TABLE public.lesson_activity TO anon;
GRANT ALL ON TABLE public.lesson_activity TO authenticated;
GRANT ALL ON TABLE public.lesson_activity TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.lesson_activity FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.lesson_activity FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


------------------------------------------------------------------------------------

ALTER TABLE public.user_setting ADD COLUMN feelings jsonb;
ALTER TABLE public.user_setting ADD CONSTRAINT user_setting_feelings_formatting CHECK (feelings IS NULL OR jsonb_matches_schema('{
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "subject_name": {
                "type": "string"
            },
            "subject_type": {
                "type": "string"
            },
            "feeling": {
                "type": "string"
            }
        }
    }
}', feelings));