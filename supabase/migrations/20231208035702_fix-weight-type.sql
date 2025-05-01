ALTER TABLE public.activity_skill ALTER COLUMN _weight TYPE double precision;
ALTER TABLE public.skill_link ALTER COLUMN _weight TYPE double precision;
ALTER TABLE public.activity_skill DROP COLUMN _name;


------------------------------------------
CREATE TABLE public.user_activity_result (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usractinst')),
    CONSTRAINT user_activity_instance__id__check_prefix CHECK (public.is_valid_typed_uuid('usractinst', id)),
    activity text REFERENCES public.activity(id) ON DELETE SET NULL,
    _user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    -- The score out of 100
    score float CHECK (score >= 0 AND score <= 100),
    -- The score normalized to a value between 0 and 1
    score_normalized float GENERATED ALWAYS AS (score / 100.0) STORED,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.user_activity_result IS 'A user''s result for an activity';
COMMENT ON COLUMN public.user_activity_result.id IS 'The unique identifier for the user activity result';
COMMENT ON COLUMN public.user_activity_result.activity IS 'The activity that the user activity result is for';
COMMENT ON COLUMN public.user_activity_result._user IS 'The user that the user activity result is for';
COMMENT ON COLUMN public.user_activity_result.score IS 'The score out of 100';
COMMENT ON COLUMN public.user_activity_result.score_normalized IS 'The score normalized to a value between 0 and 1';
COMMENT ON COLUMN public.user_activity_result.metadata IS 'The metadata of the user activity result';
COMMENT ON COLUMN public.user_activity_result.created_date IS 'The date the user activity result was created';
COMMENT ON COLUMN public.user_activity_result.updated_date IS 'The date the user activity result was last updated';
COMMENT ON COLUMN public.user_activity_result.created_by IS 'The user that created the user activity result';
COMMENT ON COLUMN public.user_activity_result.updated_by IS 'The user that last updated the user activity result';

-- Permissions
ALTER TABLE public.user_activity_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_activity_result DELETE" ON public.user_activity_result FOR DELETE USING (true);
CREATE POLICY "user_activity_result INSERT" ON public.user_activity_result FOR
INSERT WITH CHECK (true);
CREATE POLICY "user_activity_result SELECT" ON public.user_activity_result FOR
SELECT USING (true);
CREATE POLICY "user_activity_result UPDATE" ON public.user_activity_result FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.user_activity_result TO anon;
GRANT ALL ON TABLE public.user_activity_result TO authenticated;
GRANT ALL ON TABLE public.user_activity_result TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.user_activity_result FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.user_activity_result FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


-----------------------------------

CREATE TABLE user_activity_feedback (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usractfb')),
    CONSTRAINT user_activity_feedback__id__check_prefix CHECK (public.is_valid_typed_uuid('usractfb', id)),
    activity text REFERENCES public.activity(id) ON DELETE CASCADE,
    _value float CHECK (_value >= -1 AND _value <= 1),
    _description text,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.user_activity_feedback IS 'A user''s feedback for an activity';
COMMENT ON COLUMN public.user_activity_feedback.id IS 'The unique identifier for the user activity feedback';
COMMENT ON COLUMN public.user_activity_feedback.activity IS 'The activity that the user activity feedback is for';
COMMENT ON COLUMN public.user_activity_feedback._value IS 'The value of the user activity feedback -- a number between -1 and 1. -1 is negative feedback, 0 is neutral feedback, and 1 is positive feedback';
COMMENT ON COLUMN public.user_activity_feedback._description IS 'The feedback of the user activity feedback';
COMMENT ON COLUMN public.user_activity_feedback.metadata IS 'The metadata of the user activity feedback';
COMMENT ON COLUMN public.user_activity_feedback.created_date IS 'The date the user activity feedback was created';
COMMENT ON COLUMN public.user_activity_feedback.updated_date IS 'The date the user activity feedback was last updated';
COMMENT ON COLUMN public.user_activity_feedback.created_by IS 'The user that created the user activity feedback';
COMMENT ON COLUMN public.user_activity_feedback.updated_by IS 'The user that last updated the user activity feedback';

-- Permissions
ALTER TABLE public.user_activity_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_activity_feedback DELETE" ON public.user_activity_feedback FOR DELETE USING (true);
CREATE POLICY "user_activity_feedback INSERT" ON public.user_activity_feedback FOR
INSERT WITH CHECK (true);
CREATE POLICY "user_activity_feedback SELECT" ON public.user_activity_feedback FOR
SELECT USING (true);
CREATE POLICY "user_activity_feedback UPDATE" ON public.user_activity_feedback FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.user_activity_feedback TO anon;
GRANT ALL ON TABLE public.user_activity_feedback TO authenticated;
GRANT ALL ON TABLE public.user_activity_feedback TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
        OR
    UPDATE ON public.user_activity_feedback FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
        OR DELETE
        OR
    UPDATE ON public.user_activity_feedback FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
