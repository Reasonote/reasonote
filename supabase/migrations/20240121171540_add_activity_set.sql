CREATE TABLE public.activity_set (
    id text DEFAULT public.generate_typed_uuid('actvtyset'::text) NOT NULL,
    _name text,
    for_user text,
    _description text,
    metadata jsonb,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT activity_set_pkey PRIMARY KEY (id),
    CONSTRAINT activity_set_id_check CHECK (public.is_valid_typed_uuid('actvtyset'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.activity_set.id IS 'The unique identifier for the activity set.';
COMMENT ON COLUMN public.activity_set._name IS 'The name of the activity set.';
COMMENT ON COLUMN public.activity_set.for_user IS 'The user that this activity set is for.';
COMMENT ON COLUMN public.activity_set._description IS 'The description of the activity set.';
COMMENT ON COLUMN public.activity_set.metadata IS 'The metadata for the activity set.';
COMMENT ON COLUMN public.activity_set.created_date IS 'The date that this activity set was created.';
COMMENT ON COLUMN public.activity_set.updated_date IS 'The date that this activity set was last updated.';
COMMENT ON COLUMN public.activity_set.created_by IS 'The user that created this activity set.';
COMMENT ON COLUMN public.activity_set.updated_by IS 'The user that last updated this activity set.';
COMMENT ON TABLE public.activity_set IS 'A set of activities.';


ALTER TABLE public.activity_set ADD CONSTRAINT activity_set_for_user_fkey FOREIGN KEY (for_user) REFERENCES public.rsn_user(id) ON DELETE SET NULL;
ALTER TABLE public.activity_set ADD CONSTRAINT activity_set_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;
ALTER TABLE public.activity_set ADD CONSTRAINT activity_set_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;


-- Permissions
ALTER TABLE public.activity_set ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_set DELETE" ON public.activity_set FOR DELETE USING (true);
CREATE POLICY "activity_set INSERT" ON public.activity_set FOR
    INSERT WITH CHECK (true);
CREATE POLICY "activity_set SELECT" ON public.activity_set FOR
    SELECT USING (true);
CREATE POLICY "activity_set UPDATE" ON public.activity_set FOR
    UPDATE USING (true);

GRANT ALL ON TABLE public.activity_set TO anon;
GRANT ALL ON TABLE public.activity_set TO authenticated;
GRANT ALL ON TABLE public.activity_set TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.activity_set FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.activity_set FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


---------------------------------------------------------------------------------------


CREATE TABLE public.activity_set_activity (
    id text DEFAULT public.generate_typed_uuid('actsetact'::text) NOT NULL,
    activity_set text REFERENCES public.activity_set(id) ON DELETE CASCADE,
    activity text REFERENCES public.activity(id) ON DELETE CASCADE,
    metadata jsonb,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT activity_set_activity_pkey PRIMARY KEY (id),
    CONSTRAINT activity_set_activity_id_check CHECK (public.is_valid_typed_uuid('actsetact'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.activity_set_activity.id IS 'The unique identifier for the activity set activity.';
COMMENT ON COLUMN public.activity_set_activity.activity_set IS 'The corresponding set.';
COMMENT ON COLUMN public.activity_set_activity.activity IS 'The activity.';
COMMENT ON COLUMN public.activity_set_activity.metadata IS 'The metadata for the activity set activity.';
COMMENT ON COLUMN public.activity_set_activity.created_date IS 'The date that this activity set activity was created.';
COMMENT ON COLUMN public.activity_set_activity.updated_date IS 'The date that this activity set activity was last updated.';
COMMENT ON COLUMN public.activity_set_activity.created_by IS 'The user that created this activity set activity.';
COMMENT ON COLUMN public.activity_set_activity.updated_by IS 'The user that last updated this activity set activity.';
COMMENT ON TABLE public.activity_set_activity IS 'The link between an activity set and an activity.';

-- Permissions
ALTER TABLE public.activity_set_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_set_activity DELETE" ON public.activity_set_activity FOR DELETE USING (true);
CREATE POLICY "activity_set_activity INSERT" ON public.activity_set_activity FOR
    INSERT WITH CHECK (true);
CREATE POLICY "activity_set_activity SELECT" ON public.activity_set_activity FOR
    SELECT USING (true);
CREATE POLICY "activity_set_activity UPDATE" ON public.activity_set_activity FOR
    UPDATE USING (true);

GRANT ALL ON TABLE public.activity_set_activity TO anon;
GRANT ALL ON TABLE public.activity_set_activity TO authenticated;
GRANT ALL ON TABLE public.activity_set_activity TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.activity_set_activity FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.activity_set_activity FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


---------------------------------------------------------------------------------------