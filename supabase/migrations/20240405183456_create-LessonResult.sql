------------------------------------------
CREATE TABLE public.user_lesson_result (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usrlsnres')),
    CONSTRAINT user_lesson_instance__id__check_prefix CHECK (public.is_valid_typed_uuid('usrlsnres', id)),
    lesson text REFERENCES public.lesson(id) ON DELETE SET NULL,
    _user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.user_lesson_result IS 'A user''s result for an lesson';
COMMENT ON COLUMN public.user_lesson_result.id IS 'The unique identifier for the user lesson result';
COMMENT ON COLUMN public.user_lesson_result.lesson IS 'The lesson that the user lesson result is for';
COMMENT ON COLUMN public.user_lesson_result._user IS 'The user that the user lesson result is for';
COMMENT ON COLUMN public.user_lesson_result.metadata IS 'The metadata of the user lesson result';
COMMENT ON COLUMN public.user_lesson_result.created_date IS 'The date the user lesson result was created';
COMMENT ON COLUMN public.user_lesson_result.updated_date IS 'The date the user lesson result was last updated';
COMMENT ON COLUMN public.user_lesson_result.created_by IS 'The user that created the user lesson result';
COMMENT ON COLUMN public.user_lesson_result.updated_by IS 'The user that last updated the user lesson result';

-- Permissions
ALTER TABLE public.user_lesson_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_lesson_result DELETE" ON public.user_lesson_result
    FOR DELETE USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());
CREATE POLICY "user_lesson_result INSERT" ON public.user_lesson_result FOR
    INSERT WITH CHECK (created_by = current_rsn_user_id() or _user = current_rsn_user_id());
CREATE POLICY "user_lesson_result SELECT" ON public.user_lesson_result FOR
    SELECT USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());
CREATE POLICY "user_lesson_result UPDATE" ON public.user_lesson_result FOR
    UPDATE USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());

GRANT ALL ON TABLE public.user_lesson_result TO anon;
GRANT ALL ON TABLE public.user_lesson_result TO authenticated;
GRANT ALL ON TABLE public.user_lesson_result TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit
BEFORE 
INSERT 
OR UPDATE 
    ON public.user_lesson_result 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
AFTER
INSERT 
OR DELETE 
OR UPDATE 
    ON public.user_lesson_result 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

----------------------------------------------------

CREATE TABLE public.lesson_session (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('lsnsess')),
    CONSTRAINT user_lesson_instance__id__check_prefix CHECK (public.is_valid_typed_uuid('lsnsess', id)),
    lesson text REFERENCES public.lesson(id) ON DELETE SET NULL,
    _user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.lesson_session IS 'A user''s session for an lesson';
COMMENT ON COLUMN public.lesson_session.id IS 'The unique identifier for the user lesson session';
COMMENT ON COLUMN public.lesson_session.lesson IS 'The lesson that the user lesson session is for';
COMMENT ON COLUMN public.lesson_session._user IS 'The user that the user lesson session is for';
COMMENT ON COLUMN public.lesson_session.metadata IS 'The metadata of the user lesson session';
COMMENT ON COLUMN public.lesson_session.created_date IS 'The date the user lesson session was created';
COMMENT ON COLUMN public.lesson_session.updated_date IS 'The date the user lesson session was last updated';
COMMENT ON COLUMN public.lesson_session.created_by IS 'The user that created the user lesson session';
COMMENT ON COLUMN public.lesson_session.updated_by IS 'The user that last updated the user lesson session';


-- Permissions
ALTER TABLE public.lesson_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_session DELETE" ON public.lesson_session
    FOR DELETE USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());

CREATE POLICY "lesson_session INSERT" ON public.lesson_session FOR
    INSERT WITH CHECK (created_by = current_rsn_user_id() or _user = current_rsn_user_id());

CREATE POLICY "lesson_session SELECT" ON public.lesson_session FOR
    SELECT USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());

CREATE POLICY "lesson_session UPDATE" ON public.lesson_session FOR
    UPDATE USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());

GRANT ALL ON TABLE public.lesson_session TO anon;
GRANT ALL ON TABLE public.lesson_session TO authenticated;
GRANT ALL ON TABLE public.lesson_session TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit
BEFORE
INSERT
OR UPDATE
    ON public.lesson_session
    FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
AFTER
INSERT
OR DELETE
OR UPDATE
    ON public.lesson_session
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


----------------------------------------------------

ALTER TABLE lesson ADD COLUMN slides jsonb;

ALTER TABLE public.lesson ADD CONSTRAINT slides_is_correct_shape CHECK (slides IS NULL OR jsonb_matches_schema('{
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id": {
                "type": "string"
            },
            "title": {
                "type": "string"
            },
            "content": {
                "type": "string"
            }
        },
        "required": [
            "id",
            "title",
            "content"
        ]
    }
}', slides));

ALTER TABLE public.lesson ADD COLUMN activity_stubs jsonb;

ALTER TABLE public.lesson ADD CONSTRAINT activity_stubs_is_correct_shape CHECK (activity_stubs IS NULL OR jsonb_matches_schema('{
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id": {
                "type": "string"
            },
            "name": {
                "type": "string"
            },
            "subject": {
                "type": "string"
            },
            "description": {
                "type": "string"
            },
            "type": {
                "type": "string"
            },
            "metadata": {
                "type": "object"
            }
        },
        "required": [
            "id",
            "subject",
            "type"
        ]
    }
}', activity_stubs));


ALTER TABLE lesson ADD COLUMN root_skill_path TEXT[];

ALTER TABLE user_activity_result ADD COLUMN lesson_session_id TEXT REFERENCES lesson_session(id) ON DELETE SET NULL;