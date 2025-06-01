-----------------------------------------------------------------
-- BEGIN: Add Highlight Table and Integration Sync Fields
-----------------------------------------------------------------

-- Add sync management fields to existing integration table
ALTER TABLE integration ADD COLUMN IF NOT EXISTS sync_in_progress_since timestamp with time zone;
ALTER TABLE integration ADD COLUMN IF NOT EXISTS sync_error text;
ALTER TABLE integration ADD COLUMN IF NOT EXISTS sync_error_count integer DEFAULT 0;

-- Create highlight table
CREATE TABLE public.highlight (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('hlght')),
    CONSTRAINT highlight__id__check_prefix CHECK (public.is_valid_typed_uuid('hlght', id)),
    
    -- Core highlight content
    content text NOT NULL,
    note text,
    location text, -- page number, chapter, etc.
    highlighted_at timestamptz,
    tags text[], -- User-defined tags for organization
    
    -- Target references (one of these should be set, or none for standalone)
    target_url text,
    target_snip_id text REFERENCES public.snip(id) ON DELETE CASCADE,
    target_rsn_page_id text REFERENCES public.rsn_page(id) ON DELETE CASCADE,
    
    -- Source information
    source_integration_id text NOT NULL REFERENCES public.integration(id) ON DELETE CASCADE,
    source_external_id text, -- Provider's highlight ID (e.g., Readwise highlight ID)
    source_metadata jsonb, -- Book title, author, etc. (provider-agnostic)
    source_name text, -- Human-readable name of the source (book title, article title, etc.)
    
    -- Standard audit fields
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT highlight_target_check CHECK (
        (target_url IS NOT NULL)::int + 
        (target_snip_id IS NOT NULL)::int + 
        (target_rsn_page_id IS NOT NULL)::int <= 1
    ),
    CONSTRAINT highlight_source_external_id_unique UNIQUE (source_integration_id, source_external_id)
);

-- Add table comment
COMMENT ON TABLE public.highlight IS 'Highlights synced from external providers like Readwise, with optional targets in Reasonote';

-- Add column comments
COMMENT ON COLUMN public.highlight.content IS 'The highlighted text content';
COMMENT ON COLUMN public.highlight.note IS 'User note or annotation on the highlight';
COMMENT ON COLUMN public.highlight.location IS 'Location within source (page number, chapter, etc.)';
COMMENT ON COLUMN public.highlight.highlighted_at IS 'When the highlight was originally created';
COMMENT ON COLUMN public.highlight.tags IS 'User-defined tags for organization and filtering';
COMMENT ON COLUMN public.highlight.target_url IS 'URL target for the highlight';
COMMENT ON COLUMN public.highlight.target_snip_id IS 'Snip target for the highlight';
COMMENT ON COLUMN public.highlight.target_rsn_page_id IS 'Page target for the highlight';
COMMENT ON COLUMN public.highlight.source_integration_id IS 'Integration that provided this highlight';
COMMENT ON COLUMN public.highlight.source_external_id IS 'Provider-specific ID for deduplication';
COMMENT ON COLUMN public.highlight.source_metadata IS 'Provider metadata (book title, author, etc.)';

-- Permissions
ALTER TABLE public.highlight ENABLE ROW LEVEL SECURITY;

-- Highlights are accessible to users who:
-- 1. Own the source integration
-- 2. Own the target snip (inherit permissions)
-- 3. Own the target page (inherit permissions) 
-- 4. Created the highlight
CREATE POLICY "highlight SELECT" ON public.highlight FOR SELECT USING (
    -- Own the source integration
    (SELECT for_user FROM integration WHERE id = highlight.source_integration_id) = current_rsn_user_id()
    OR
    -- Own the target snip (inherit snip permissions)
    (target_snip_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM snip WHERE id = highlight.target_snip_id AND _owner = current_rsn_user_id()
    ))
    OR
    -- Own the target page (inherit page permissions)
    (target_rsn_page_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM rsn_page WHERE id = highlight.target_rsn_page_id AND created_by = current_rsn_user_id()
    ))
    OR
    -- Created the highlight
    created_by = current_rsn_user_id()
);

CREATE POLICY "highlight INSERT" ON public.highlight FOR INSERT WITH CHECK (
    -- Can only insert if you own the source integration
    (SELECT for_user FROM integration WHERE id = highlight.source_integration_id) = current_rsn_user_id()
);

CREATE POLICY "highlight UPDATE" ON public.highlight FOR UPDATE USING (
    -- Same access rules as SELECT
    (SELECT for_user FROM integration WHERE id = highlight.source_integration_id) = current_rsn_user_id()
    OR
    (target_snip_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM snip WHERE id = highlight.target_snip_id AND _owner = current_rsn_user_id()
    ))
    OR
    (target_rsn_page_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM rsn_page WHERE id = highlight.target_rsn_page_id AND created_by = current_rsn_user_id()
    ))
    OR
    created_by = current_rsn_user_id()
);

CREATE POLICY "highlight DELETE" ON public.highlight FOR DELETE USING (
    -- Same access rules as SELECT
    (SELECT for_user FROM integration WHERE id = highlight.source_integration_id) = current_rsn_user_id()
    OR
    (target_snip_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM snip WHERE id = highlight.target_snip_id AND _owner = current_rsn_user_id()
    ))
    OR
    (target_rsn_page_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM rsn_page WHERE id = highlight.target_rsn_page_id AND created_by = current_rsn_user_id()
    ))
    OR
    created_by = current_rsn_user_id()
);

-- Grant permissions
GRANT ALL ON TABLE public.highlight TO anon;
GRANT ALL ON TABLE public.highlight TO authenticated;
GRANT ALL ON TABLE public.highlight TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.highlight 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.highlight 
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- Add to table abbreviations for typed UUIDs
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) 
VALUES ('highlight', 'hlght');

-- END: Add Highlight Table and Integration Sync Fields
----------------------------------------------------------------- 