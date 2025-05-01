
CREATE TABLE public.rsn_user_sysdata (
    id public.typed_uuid PRIMARY KEY GENERATED ALWAYS AS (('rsnusrsys_'::text || (auth_id)::text)) STORED,
    rsn_user_id public.typed_uuid GENERATED ALWAYS AS (('rsnusr_'::text || (auth_id)::text)) STORED,
    auth_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extra_license_info JSONB,
    CONSTRAINT rsn_user_sysdata__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnusrsys'::text, id)),
    CONSTRAINT rsn_user_sysdata__rsn_user_id__check_prefix CHECK (public.is_valid_typed_uuid('rsnusr'::text, rsn_user_id))
);

ALTER TABLE public.rsn_user_sysdata OWNER TO postgres;
ALTER TABLE public.rsn_user_sysdata ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.rsn_user_sysdata TO anon;
GRANT ALL ON TABLE public.rsn_user_sysdata TO authenticated;
GRANT ALL ON TABLE public.rsn_user_sysdata TO service_role;

CREATE POLICY "rsn_user_sysdata INSERT" ON public.rsn_user_sysdata FOR INSERT WITH CHECK (false);
CREATE POLICY "rsn_user_sysdata UPDATE" ON public.rsn_user_sysdata FOR UPDATE USING (false);
CREATE POLICY "rsn_user_sysdata DELETE" ON public.rsn_user_sysdata FOR DELETE USING (public.current_rsn_user_id() = rsn_user_id);
CREATE POLICY "rsn_user_sysdata SELECT" ON public.rsn_user_sysdata FOR SELECT USING (public.current_rsn_user_id() = rsn_user_id);

-- Trigger the function every time a user is created
-- Remove the trigger that syncs auth.users with rsn_user
CREATE OR REPLACE function public.tgr_handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = public
as $$

begin
    -- Insert a row into public.rsn_user
    -- Setting the auth_id to the new user's id.
    insert into public.rsn_user (auth_id)
        values (new.id);

    insert into public.rsn_user_sysdata (auth_id)
        values (new.id);

    -- Return the auth user row.
    return new;
end;
$$
;

-- update the rsn_user to have the beta access