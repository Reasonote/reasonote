-- Add UPDATE policy
CREATE POLICY "user_history UPDATE" ON public.user_history 
    FOR UPDATE USING (current_rsn_user_id() = rsn_user_id);

-- Add DELETE policy
CREATE POLICY "user_history DELETE" ON public.user_history 
    FOR DELETE USING (current_rsn_user_id() = rsn_user_id);

-- Update comment on the table to reflect the new permissions
COMMENT ON TABLE public.user_history IS 'Table to store user visit history for skills. Users can insert, select, update, and delete their own records.';