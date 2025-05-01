


-----------------------------------------
-- BEGIN: Add chat_id to chat_message table
ALTER TABLE public.chat_message ADD COLUMN chat_id text NOT NULL REFERENCES public.chat(id) ON DELETE CASCADE;
ALTER TABLE public.chat_message ADD COLUMN bot_id text REFERENCES public.bot(id) ON DELETE SET NULL;
ALTER TABLE public.chat_message ADD COLUMN _role text;
ALTER TABLE public.chat_message ADD COLUMN function_call jsonb;
-- END: Add chat_id to chat_message table
-----------------------------------------

ALTER TABLE public.rsn_user ADD COLUMN _role text;


-----------------------------------------
-- BEGIN: make _type nullable
ALTER TABLE public.goal ALTER COLUMN _type DROP NOT NULL;
-- END: make _type nullable
-----------------------------------------


-----------------------------------------
-- BEGIN: Add skill table
CREATE TABLE public.skill (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('skill')),
    CONSTRAINT skill__id__check_prefix CHECK (public.is_valid_typed_uuid('skill', id)),
    _name text NOT NULL,
    _type text,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);
-- Permissions
ALTER TABLE public.skill ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill DELETE" ON public.skill FOR DELETE USING (true);
CREATE POLICY "skill INSERT" ON public.skill FOR
INSERT WITH CHECK (true);
CREATE POLICY "skill SELECT" ON public.skill FOR
SELECT USING (true);
CREATE POLICY "skill UPDATE" ON public.skill FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.skill TO anon;
GRANT ALL ON TABLE public.skill TO authenticated;
GRANT ALL ON TABLE public.skill TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.skill FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.skill FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
-- END: Add concept table
-----------------------------------------



CREATE TABLE public.user_skill (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usrskill')),
    CONSTRAINT user_skill__id__check_prefix CHECK (public.is_valid_typed_uuid('usrskill', id)),
    skill typed_uuid NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
    rsn_user typed_uuid NOT NULL REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);
-- Permissions
ALTER TABLE public.user_skill ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_skill DELETE" ON public.user_skill FOR DELETE USING (true);
CREATE POLICY "user_skill INSERT" ON public.user_skill FOR
INSERT WITH CHECK (true);
CREATE POLICY "user_skill SELECT" ON public.user_skill FOR
SELECT USING (true);
CREATE POLICY "user_skill UPDATE" ON public.user_skill FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.user_skill TO anon;
GRANT ALL ON TABLE public.user_skill TO authenticated;
GRANT ALL ON TABLE public.user_skill TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.user_skill FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.user_skill FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();



CREATE TABLE public.user_setting (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usrset')),
    CONSTRAINT user_setting__id__check_prefix CHECK (public.is_valid_typed_uuid('usrset', id)),
    rsn_user typed_uuid NOT NULL REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    metadata jsonb,
    ai_about_me text,
    ai_instructions text,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Permissions
ALTER TABLE public.user_setting ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_setting DELETE" ON public.user_setting FOR DELETE USING (true);
CREATE POLICY "user_setting INSERT" ON public.user_setting FOR
INSERT WITH CHECK (true);
CREATE POLICY "user_setting SELECT" ON public.user_setting FOR
SELECT USING (true);
CREATE POLICY "user_setting UPDATE" ON public.user_setting FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.user_setting TO anon;
GRANT ALL ON TABLE public.user_setting TO authenticated;
GRANT ALL ON TABLE public.user_setting TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.user_setting FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.user_setting FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();