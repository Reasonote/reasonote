ALTER TABLE public.snip DROP COLUMN extracting;
-- Create success, failed, pending enum
CREATE TYPE extraction_state AS ENUM ('pending', 'processing', 'success', 'failed');
ALTER TABLE public.snip ADD COLUMN extraction_state extraction_state DEFAULT 'pending';
ALTER TABLE public.snip ADD COLUMN extraction_info JSONB;
ALTER TABLE public.snip ADD COLUMN extraction_error TEXT;
ALTER TABLE snip ADD COLUMN page_id TEXT;

-- Whenever a snip moves to the success state, if it doesn't have a page, create one.
CREATE OR REPLACE FUNCTION create_page_from_snip() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.page_id IS NULL AND NEW.text_content IS NOT NULL AND NEW.extraction_state = 'success' THEN
    -- Insert and select
    INSERT INTO rsn_page (_name, body) VALUES (NEW._name, NEW.text_content) RETURNING id INTO NEW.page_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_page_from_snip_trigger
  BEFORE INSERT OR UPDATE ON snip
  FOR EACH ROW
  EXECUTE FUNCTION create_page_from_snip();


-- Create skill_resource
CREATE TABLE public.skill_resource (
    id text DEFAULT public.generate_typed_uuid('sklrsrc'::text) NOT NULL,
    skill_id text REFERENCES public.skill(id) ON DELETE SET NULL,
    snip_id text REFERENCES public.snip(id) ON DELETE SET NULL,
    page_id text REFERENCES public.rsn_page(id) ON DELETE SET NULL,
    metadata jsonb,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT skill_resource_pkey PRIMARY KEY (id),
    CONSTRAINT skill_resource_id_check CHECK (public.is_valid_typed_uuid('sklrsrc'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.skill_resource.id IS 'The unique identifier for the skill resource.';
COMMENT ON COLUMN public.skill_resource.skill_id IS 'The skill that this skill resource is associated with.';
COMMENT ON COLUMN public.skill_resource.snip_id IS 'The snip that this skill resource is associated with.';
COMMENT ON COLUMN public.skill_resource.page_id IS 'The page that this skill resource is associated with.';
COMMENT ON COLUMN public.skill_resource.metadata IS 'The metadata for the skill resource.';
COMMENT ON COLUMN public.skill_resource.created_date IS 'The date that this skill resource was created.';
COMMENT ON COLUMN public.skill_resource.updated_date IS 'The date that this skill resource was last updated.';
COMMENT ON COLUMN public.skill_resource.created_by IS 'The user that created this skill resource.';
COMMENT ON COLUMN public.skill_resource.updated_by IS 'The user that last updated this skill resource.';
COMMENT ON TABLE public.skill_resource IS 'A skill resource is a resource that is associated with a skill.';

-- Permissions
ALTER TABLE public.skill_resource ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_resource DELETE" ON public.skill_resource FOR DELETE USING (
    ((current_rsn_user_id())::text = (created_by)::text)
);

CREATE POLICY "skill_resource INSERT" ON public.skill_resource FOR
    INSERT WITH CHECK (
        ((current_rsn_user_id())::text = (created_by)::text)
    );

CREATE POLICY "skill_resource SELECT" ON public.skill_resource FOR
    SELECT USING (
        ((current_rsn_user_id())::text = (created_by)::text)
    );

CREATE POLICY "skill_resource UPDATE" ON public.skill_resource FOR
    UPDATE USING (
        ((current_rsn_user_id())::text = (created_by)::text)
    );

GRANT ALL ON TABLE public.skill_resource TO anon;
GRANT ALL ON TABLE public.skill_resource TO authenticated;
GRANT ALL ON TABLE public.skill_resource TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.skill_resource FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.skill_resource FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
