-- Create the resource table
CREATE TABLE public.resource (
    id text DEFAULT public.generate_typed_uuid('rsrc'::text) NOT NULL,
    parent_skill_id text REFERENCES public.skill(id) ON DELETE SET NULL,
    parent_podcast_id text REFERENCES public.podcast(id) ON DELETE SET NULL,
    child_snip_id text REFERENCES public.snip(id) ON DELETE SET NULL,
    child_page_id text REFERENCES public.rsn_page(id) ON DELETE SET NULL,
    metadata jsonb,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT resource_id_check CHECK (public.is_valid_typed_uuid('rsrc'::text, (id)::public.typed_uuid)),
    CONSTRAINT resource_parent_exclusive CHECK (
        (CASE WHEN parent_skill_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN parent_podcast_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
    ),
    CONSTRAINT resource_content_source_exclusive CHECK (
        (CASE WHEN child_snip_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN child_page_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
    )
);

-- Add table comments
COMMENT ON TABLE public.resource IS 'A resource that can be associated with either a skill or a podcast.';
COMMENT ON COLUMN public.resource.id IS 'The unique identifier for the resource.';
COMMENT ON COLUMN public.resource.parent_skill_id IS 'The skill that this resource is associated with, if any.';
COMMENT ON COLUMN public.resource.parent_podcast_id IS 'The podcast that this resource is associated with, if any.';
COMMENT ON COLUMN public.resource.child_snip_id IS 'The snip that this resource references.';
COMMENT ON COLUMN public.resource.child_page_id IS 'The page that this resource references.';
COMMENT ON COLUMN public.resource.metadata IS 'Additional metadata for the resource.';
COMMENT ON COLUMN public.resource.created_date IS 'The date that this resource was created.';
COMMENT ON COLUMN public.resource.updated_date IS 'The date that this resource was last updated.';
COMMENT ON COLUMN public.resource.created_by IS 'The user that created this resource.';
COMMENT ON COLUMN public.resource.updated_by IS 'The user that last updated this resource.';

-- Add primary key
ALTER TABLE ONLY public.resource
    ADD CONSTRAINT resource_pkey PRIMARY KEY (id);

-- Add triggers for audit and logging
CREATE TRIGGER log_operation 
    AFTER INSERT OR DELETE OR UPDATE ON public.resource 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

CREATE TRIGGER run_tgr_apply_audit 
    BEFORE INSERT OR UPDATE ON public.resource 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Enable RLS
ALTER TABLE public.resource ENABLE ROW LEVEL SECURITY;

-- Add RLS policies 
CREATE POLICY "resource SELECT" ON public.resource
    FOR SELECT USING ((public.current_rsn_user_id())::text = created_by OR (public.is_admin()));

CREATE POLICY "resource INSERT" ON public.resource
    FOR INSERT WITH CHECK ((public.current_rsn_user_id())::text = created_by OR (public.is_admin()));

CREATE POLICY "resource UPDATE" ON public.resource
    FOR UPDATE USING ((public.current_rsn_user_id())::text = created_by OR (public.is_admin()));

CREATE POLICY "resource DELETE" ON public.resource
    FOR DELETE USING ((public.current_rsn_user_id())::text = created_by OR (public.is_admin()));

-- Grant permissions
GRANT ALL ON TABLE public.resource TO anon;
GRANT ALL ON TABLE public.resource TO authenticated;
GRANT ALL ON TABLE public.resource TO service_role;



-------------------------------------------------
-- Change `for_skill` to `for_skill_path` in podcast table
ALTER TABLE public.podcast DROP COLUMN for_skill;
ALTER TABLE public.podcast ADD COLUMN for_skill_path text[];