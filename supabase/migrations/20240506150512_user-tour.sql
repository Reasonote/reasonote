-- Enum for tour status
CREATE TYPE public.user_tour_status AS ENUM (
    'IN_PROGRESS',
    'COMPLETED'
);

CREATE TABLE public.user_tour (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usertour')),
    CONSTRAINT user_lesson_instance__id__check_prefix CHECK (public.is_valid_typed_uuid('usertour', id)),
    tour_name text,
    _user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    metadata jsonb,
    tour_status public.user_tour_status,
    tour_state jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.user_tour IS 'User tour completion tracking';
COMMENT ON COLUMN public.user_tour.id IS 'Primary key';
COMMENT ON COLUMN public.user_tour.tour_name IS 'Name of the tour';
COMMENT ON COLUMN public.user_tour._user IS 'User ID';
COMMENT ON COLUMN public.user_tour.metadata IS 'Metadata';
COMMENT ON COLUMN public.user_tour.created_date IS 'Created date';
COMMENT ON COLUMN public.user_tour.updated_date IS 'Updated date';
COMMENT ON COLUMN public.user_tour.created_by IS 'Created by';
COMMENT ON COLUMN public.user_tour.updated_by IS 'Updated by';

-- Permissions
ALTER TABLE public.user_tour ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tour DELETE" ON public.user_tour
    FOR DELETE USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());
CREATE POLICY "user_tour INSERT" ON public.user_tour FOR
    INSERT WITH CHECK (created_by = current_rsn_user_id() or _user = current_rsn_user_id());
CREATE POLICY "user_tour SELECT" ON public.user_tour FOR
    SELECT USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());
CREATE POLICY "user_tour UPDATE" ON public.user_tour FOR
    UPDATE USING (created_by = current_rsn_user_id() or _user = current_rsn_user_id());

GRANT ALL ON TABLE public.user_tour TO anon;
GRANT ALL ON TABLE public.user_tour TO authenticated;
GRANT ALL ON TABLE public.user_tour TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit
BEFORE 
INSERT 
OR UPDATE 
    ON public.user_tour 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
AFTER
INSERT 
OR DELETE 
OR UPDATE 
    ON public.user_tour 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();