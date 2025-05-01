-- Create references table
CREATE TABLE public.reference (
    id text DEFAULT generate_typed_uuid('ref'::text) NOT NULL,
    raw_content text NOT NULL,
    is_exact boolean NOT NULL DEFAULT false,
    rsn_vec_id text NOT NULL REFERENCES public.rsn_vec(id) ON DELETE SET NULL,
    _ref_id text NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT references_pkey PRIMARY KEY (id),
    CONSTRAINT references__id__check_prefix CHECK (is_valid_typed_uuid('ref'::text, id::typed_uuid))
);

-- Add RLS policies
ALTER TABLE public.reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reference SELECT" ON public.reference
    FOR SELECT USING (true);

CREATE POLICY "reference INSERT" ON public.reference
    FOR INSERT WITH CHECK (true);

CREATE POLICY "reference UPDATE" ON public.reference
    FOR UPDATE USING (true);

CREATE POLICY "reference DELETE" ON public.reference
    FOR DELETE USING (true);

-- Add audit trigger
CREATE TRIGGER run_tgr_apply_audit
    BEFORE INSERT OR UPDATE ON public.reference
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_apply_audit();

-- Grant permissions
GRANT ALL ON TABLE public.reference TO anon;
GRANT ALL ON TABLE public.reference TO authenticated;
GRANT ALL ON TABLE public.reference TO service_role;

-- Add helpful comment
COMMENT ON TABLE public.reference IS 'Stores exact references from rsn_vecs';

-- Add reference_ids and rsn_vec_ids columns to skill table
ALTER TABLE public.skill
    ADD COLUMN reference_ids text[] DEFAULT NULL,
    ADD COLUMN rsn_vec_ids text[] DEFAULT NULL;

-- Create function to validate reference_ids
CREATE OR REPLACE FUNCTION validate_skill_arrays()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate reference_ids
    IF NEW.reference_ids IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM unnest(NEW.reference_ids) AS ref_id
            LEFT JOIN public.reference ON reference.id = ref_id
            WHERE reference.id IS NULL
        ) THEN
            RAISE EXCEPTION 'Invalid reference_id found in reference_ids array';
        END IF;
    END IF;

    -- Validate rsn_vec_ids
    IF NEW.rsn_vec_ids IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM unnest(NEW.rsn_vec_ids) AS rsn_vec_id
            LEFT JOIN public.rsn_vec ON rsn_vec.id = rsn_vec_id
            WHERE rsn_vec.id IS NULL
        ) THEN
            RAISE EXCEPTION 'Invalid rsn_vec_id found in rsn_vec_ids array';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate arrays before insert or update
CREATE TRIGGER validate_skill_arrays_trigger
    BEFORE INSERT OR UPDATE ON public.skill
    FOR EACH ROW
    EXECUTE FUNCTION validate_skill_arrays();
