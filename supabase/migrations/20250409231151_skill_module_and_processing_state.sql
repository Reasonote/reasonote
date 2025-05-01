-- Create function to validate children_ids
CREATE OR REPLACE FUNCTION public.validate_skill_module_children_ids(p_children_ids text[])
RETURNS boolean AS $$
BEGIN
    IF p_children_ids IS NULL THEN
        RETURN true;
    END IF;

    -- Check each ID in the array
    FOR i IN 1..array_length(p_children_ids, 1) LOOP
        -- Check if ID starts with valid prefix
        IF NOT (p_children_ids[i] LIKE 'sklmod_%' OR p_children_ids[i] LIKE 'skill_%') THEN
            RETURN false;
        END IF;

        -- Check if ID exists in respective table
        IF p_children_ids[i] LIKE 'sklmod_%' THEN
            PERFORM 1 FROM public.skill_module WHERE id = p_children_ids[i];
            IF NOT FOUND THEN
                RETURN false;
            END IF;
        ELSE
            PERFORM 1 FROM public.skill WHERE id = p_children_ids[i];
            IF NOT FOUND THEN
                RETURN false;
            END IF;
        END IF;
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create skill_module table
CREATE TABLE public.skill_module (
    id text DEFAULT generate_typed_uuid('sklmod'::text) NOT NULL,
    _name text NOT NULL,
    position integer NOT NULL,
    root_skill_id text REFERENCES public.skill(id) ON DELETE CASCADE,
    children_ids text[] DEFAULT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by typed_uuid,
    updated_by typed_uuid,
    CONSTRAINT skill_module_pkey PRIMARY KEY (id),
    CONSTRAINT skill_module__id__check_prefix CHECK (is_valid_typed_uuid('sklmod'::text, id::typed_uuid)),
    CONSTRAINT skill_module_children_ids_check CHECK (validate_skill_module_children_ids(children_ids))
);

-- Add RLS policies
ALTER TABLE public.skill_module ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_module SELECT" ON public.skill_module
    FOR SELECT USING (true);

CREATE POLICY "skill_module INSERT" ON public.skill_module
    FOR INSERT WITH CHECK (((created_by)::text = (current_rsn_user_id())::text) OR is_admin());

CREATE POLICY "skill_module UPDATE" ON public.skill_module
    FOR UPDATE USING (((created_by)::text = (current_rsn_user_id())::text) OR is_admin());

CREATE POLICY "skill_module DELETE" ON public.skill_module
    FOR DELETE USING (((created_by)::text = (current_rsn_user_id())::text) OR is_admin());

-- Add audit trigger
CREATE TRIGGER run_tgr_apply_audit
    BEFORE INSERT OR UPDATE ON public.skill_module
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_apply_audit();

-- Grant permissions
GRANT ALL ON TABLE public.skill_module TO anon;
GRANT ALL ON TABLE public.skill_module TO authenticated;
GRANT ALL ON TABLE public.skill_module TO service_role;

-- Add helpful comment
COMMENT ON TABLE public.skill_module IS 'Stores module and submodule information for organizing lessons';
COMMENT ON COLUMN public.skill_module.children_ids IS 'Array of IDs referencing either skill_module (sklmod_ prefix) or skill (skill_ prefix) table';
COMMENT ON COLUMN public.skill_module.position IS 'Position of this module/submodule within its parent''s children';
COMMENT ON COLUMN public.skill_module._name IS 'Name of the module or submodule';

-- Create the skill_processing_state ENUM type
CREATE TYPE public.skill_processing_state AS ENUM (
    'CREATING_DAG',
    'DAG_CREATION_FAILED',
    'DAG_GENERATED',
    'CREATING_MODULES',
    'MODULE_CREATION_FAILED',
    'SUCCESS'
);

-- Add the processing_state column to the skill table, allowing NULL
ALTER TABLE public.skill 
    ADD COLUMN processing_state public.skill_processing_state;

-- Add comment explaining the processing_state column
COMMENT ON COLUMN public.skill.processing_state IS 'Tracks the current state of skill creation process. NULL indicates no processing has started.';

-- Grant permissions for the new type
GRANT USAGE ON TYPE public.skill_processing_state TO anon;
GRANT USAGE ON TYPE public.skill_processing_state TO authenticated;
GRANT USAGE ON TYPE public.skill_processing_state TO service_role; 