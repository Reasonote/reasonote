-- Create user_history table
CREATE TABLE public.user_history (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('usrhist')),
    CONSTRAINT user_history__id__check_prefix CHECK (public.is_valid_typed_uuid('usrhist', id)),
    rsn_user_id text REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    skill_id_visited text REFERENCES public.skill(id) ON DELETE CASCADE,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by text NOT NULL REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    updated_by text NOT NULL REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    CONSTRAINT user_history_unique_visit UNIQUE (rsn_user_id, skill_id_visited)
);

-- Add comments
COMMENT ON TABLE public.user_history IS 'Table to store user visit history for skills';
COMMENT ON COLUMN public.user_history.rsn_user_id IS 'The ID of the user who visited the skill';
COMMENT ON COLUMN public.user_history.skill_id_visited IS 'The ID of the skill that was visited';
COMMENT ON COLUMN public.user_history.created_date IS 'The timestamp when the skill was visited';
COMMENT ON COLUMN public.user_history.updated_date IS 'The timestamp when the skill was visited';
COMMENT ON COLUMN public.user_history.created_by IS 'The user who created the record';
COMMENT ON COLUMN public.user_history.updated_by IS 'The user who updated the record';

-- Set up RLS
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "user_history INSERT" ON public.user_history 
    FOR INSERT WITH CHECK (current_rsn_user_id() = rsn_user_id);

CREATE POLICY "user_history SELECT" ON public.user_history 
    FOR SELECT USING (current_rsn_user_id() = rsn_user_id);

-- Grant permissions
GRANT ALL ON TABLE public.user_history TO authenticated;
GRANT ALL ON TABLE public.user_history TO service_role;

-- Add to table abbreviations
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) 
VALUES ('user_history', 'usrhist');

-- Add trigger for logging operations
CREATE TRIGGER tgr_log_operation_user_history
    AFTER INSERT OR DELETE OR UPDATE ON public.user_history
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- Create trigger to automatically update the updated_date column
CREATE TRIGGER tgr_apply_audit_user_history
    BEFORE UPDATE ON public.user_history
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_apply_audit();