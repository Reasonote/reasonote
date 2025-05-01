-----------------------------------------------------------------
-- BEGIN: Add Integration & IntegrationToken Tables
CREATE TABLE public.integration (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('intgrtn')),
    CONSTRAINT integration__id__check_prefix CHECK (public.is_valid_typed_uuid('intgrtn', id)),
    _type text NOT NULL,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);
-- Permissions
ALTER TABLE public.integration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration DELETE" ON public.integration FOR DELETE USING (true);
CREATE POLICY "integration INSERT" ON public.integration FOR
INSERT WITH CHECK (true);
CREATE POLICY "integration SELECT" ON public.integration FOR
SELECT USING (true);
CREATE POLICY "integration UPDATE" ON public.integration FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.integration TO anon;
GRANT ALL ON TABLE public.integration TO authenticated;
GRANT ALL ON TABLE public.integration TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.integration FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.integration FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

--------------

CREATE TABLE public.integration_token (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('intgrtntkn')),
    CONSTRAINT integration_token__id__check_prefix CHECK (public.is_valid_typed_uuid('intgrtntkn', id)),
    integration_id typed_uuid NOT NULL REFERENCES public.integration(id) ON DELETE
    CASCADE,
        token text NOT NULL,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);
-- Permissions
ALTER TABLE public.integration_token ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_token DELETE" ON public.integration_token FOR DELETE USING (true);
CREATE POLICY "integration_token INSERT" ON public.integration_token FOR
INSERT WITH CHECK (true);
CREATE POLICY "integration_token SELECT" ON public.integration_token FOR
SELECT USING (true);
CREATE POLICY "integration_token UPDATE" ON public.integration_token FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.integration_token TO anon;
GRANT ALL ON TABLE public.integration_token TO authenticated;
GRANT ALL ON TABLE public.integration_token TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.integration_token FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.integration_token FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- END: Add Integration & IntegrationToken Tables
-----------------------------------------------------------------