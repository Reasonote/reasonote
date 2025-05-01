create table partial_skill (
    id text DEFAULT public.generate_typed_uuid('prtskl'::text) NOT NULL,
    created_date timestamp with time zone default now(),
    updated_date timestamp with time zone default now(),
    user_input text not null,
    skill_name text not null,
    skill_description text not null,
    emoji text not null,
    user_level text not null check (user_level in ('beginner', 'intermediate', 'advanced')),
    goals text[] default array[]::text[],
    pages text[] default array[]::text[],
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT partial_skill_pkey PRIMARY KEY (id),
    CONSTRAINT partial_skill_id_check CHECK (id LIKE 'prtskl_%')
);

-- Enable Row Level Security
ALTER TABLE public.partial_skill ENABLE ROW LEVEL SECURITY;

-- Course RLS Policies
CREATE POLICY "partial_skill SELECT" ON public.partial_skill
    FOR SELECT USING (
        created_by = current_rsn_user_id()::text
    );

CREATE POLICY "partial_skill INSERT" ON public.partial_skill
    FOR INSERT WITH CHECK (
        created_by = current_rsn_user_id()::text
    );

CREATE POLICY "partial_skill UPDATE" ON public.partial_skill
    FOR UPDATE USING (
        created_by = current_rsn_user_id()::text
    );

CREATE POLICY "partial_skill DELETE" ON public.partial_skill
    FOR DELETE USING (
        created_by = current_rsn_user_id()::text
    );

    --
-- Name: partial_skill log_operation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.partial_skill FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


--
-- Name: partial_skill run_tgr_apply_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.partial_skill FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();