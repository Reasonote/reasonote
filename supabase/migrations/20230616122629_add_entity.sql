--------------------------------------------------------------------------
-- Add entity table
CREATE TABLE public.entity (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('enty')),
    CONSTRAINT entity__id__check_prefix CHECK (public.is_valid_typed_uuid('enty', id)),
    e_name text,
    e_type text,
    e_data jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);
-- Permissions
ALTER TABLE public.entity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity DELETE" ON public.entity FOR DELETE USING (true);
CREATE POLICY "entity INSERT" ON public.entity FOR
INSERT WITH CHECK (true);
CREATE POLICY "entity SELECT" ON public.entity FOR
SELECT USING (true);
CREATE POLICY "entity UPDATE" ON public.entity FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.entity TO anon;
GRANT ALL ON TABLE public.entity TO authenticated;
GRANT ALL ON TABLE public.entity TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.entity FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.entity FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
-- Descriptions
COMMENT ON TABLE public.entity IS 'A thing that exists.';
COMMENT ON COLUMN public.entity.e_name IS 'The name of the entity.';
-- END: Add entity table
--------------------------------------------------------------------------
--------------------------------------------------------------------------
-- BEGIN: Add PGVector
create extension vector with schema extensions;
-- END: Add PGVector
--------------------------------------------------------------------------
--------------------------------------------------------------------------
-- BEGIN: Add page table 
CREATE TABLE public.rsn_page (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('rsnpage')),
    CONSTRAINT rsnpage__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnpage', id)),
    _name text,
    metadata jsonb,
    body text,
    parent text REFERENCES public.rsn_page(id) ON DELETE CASCADE,
    body_length int GENERATED ALWAYS AS (length(body)) STORED,
    body_sha_256 text GENERATED ALWAYS AS (encode(sha256(body::bytea), 'hex')) STORED,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);
-- Comments for all fields
COMMENT ON TABLE public.rsn_page IS 'A page in reasonote.';
COMMENT ON COLUMN public.rsn_page._name IS 'The name of the page.';
COMMENT ON COLUMN public.rsn_page.metadata IS 'Metadata for the page.';
COMMENT ON COLUMN public.rsn_page.body IS 'The body of the page.';
COMMENT ON COLUMN public.rsn_page.parent IS 'The parent page.';
COMMENT ON COLUMN public.rsn_page.body_length IS 'The length of the body.';
COMMENT ON COLUMN public.rsn_page.body_sha_256 IS 'The SHA-256 of the body.';
COMMENT ON COLUMN public.rsn_page.created_date IS 'The date the page was created.';
COMMENT ON COLUMN public.rsn_page.updated_date IS 'The date the page was last updated.';
COMMENT ON COLUMN public.rsn_page.created_by IS 'The user that created the page.';
COMMENT ON COLUMN public.rsn_page.updated_by IS 'The user that last updated the page.';


-- Permissions
ALTER TABLE public.rsn_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsn_page DELETE" ON public.rsn_page FOR DELETE USING (true);
CREATE POLICY "rsn_page INSERT" ON public.rsn_page FOR
INSERT WITH CHECK (true);
CREATE POLICY "rsn_page SELECT" ON public.rsn_page FOR
SELECT USING (true);
CREATE POLICY "rsn_page UPDATE" ON public.rsn_page FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.rsn_page TO anon;
GRANT ALL ON TABLE public.rsn_page TO authenticated;
GRANT ALL ON TABLE public.rsn_page TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.rsn_page FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.rsn_page FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
-- Descriptions
COMMENT ON TABLE public.rsn_page IS 'A page in reasonote.';
--

CREATE TABLE public.rsn_page_vector (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('rsnpagev')),
    CONSTRAINT rsn_page_vector__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnpagev', id)),
    rsn_page_id typed_uuid REFERENCES public.rsn_page(id) ON DELETE CASCADE,
    rsn_page_offset int NOT NULL,
    embedding vector,
    raw_content text,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);
-- Comments for all fields
COMMENT ON TABLE public.rsn_page_vector IS 'The vector for a rsn_page.';
COMMENT ON COLUMN public.rsn_page_vector.rsn_page_id IS 'The page that this vector is for.';
COMMENT ON COLUMN public.rsn_page_vector.rsn_page_offset IS 'The offset of the vector in the page.';
COMMENT ON COLUMN public.rsn_page_vector.embedding IS 'The embedding of the vector.';
COMMENT ON COLUMN public.rsn_page_vector.raw_content IS 'The raw content of the vector.';
COMMENT ON COLUMN public.rsn_page_vector.created_date IS 'The date the vector was created.';
COMMENT ON COLUMN public.rsn_page_vector.updated_date IS 'The date the vector was last updated.';
COMMENT ON COLUMN public.rsn_page_vector.created_by IS 'The user that created the vector.';
COMMENT ON COLUMN public.rsn_page_vector.updated_by IS 'The user that last updated the vector.';

-- Permissions
ALTER TABLE public.rsn_page_vector ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsn_page_vector DELETE" ON public.rsn_page_vector FOR DELETE USING (true);
CREATE POLICY "rsn_page_vector INSERT" ON public.rsn_page_vector FOR
INSERT WITH CHECK (true);
CREATE POLICY "rsn_page_vector SELECT" ON public.rsn_page_vector FOR
SELECT USING (true);
CREATE POLICY "rsn_page_vector UPDATE" ON public.rsn_page_vector FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.rsn_page_vector TO anon;
GRANT ALL ON TABLE public.rsn_page_vector TO authenticated;
GRANT ALL ON TABLE public.rsn_page_vector TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.rsn_page_vector FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.rsn_page_vector FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
-- Descriptions
COMMENT ON TABLE public.rsn_page_vector IS 'The vector for a rsn_page.';
-- END: Add rsn page table
--------------------------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA extensions TO postgres;


-- Function which will fetch all child pages of a given page
CREATE OR REPLACE FUNCTION get_child_pages(
    parent_page_ids text[]
) RETURNS TABLE (
    id text,
    _name text,
    metadata jsonb,
    body text,
    parent text,
    body_length int,
    body_sha_256 text,
    created_date timestamptz,
    updated_date timestamptz,
    created_by text,
    updated_by text
) LANGUAGE plpgsql AS $$ #variable_conflict use_variable
BEGIN RETURN QUERY
    WITH RECURSIVE child_pages AS (
        SELECT rsn_page.*
            FROM rsn_page
            WHERE rsn_page.id = ANY(parent_page_ids)

        UNION ALL

        SELECT rsn_page.*
        FROM rsn_page
        INNER JOIN child_pages ON rsn_page.parent = child_pages.id
    )
    SELECT child_pages.id, child_pages._name, child_pages.metadata, child_pages.body, child_pages.parent, 
           child_pages.body_length, child_pages.body_sha_256, child_pages.created_date, 
           child_pages.updated_date, child_pages.created_by, child_pages.updated_by
    FROM child_pages;
END;
$$;


-- Function: match_rsn_page_vectors
-- This function is used to find vectors in the 'rsn_page_vector' table
-- that are similar to a given embedding vector.
-- It uses a similarity metric and several other conditions for the search.
-- Note: The similarity is computed based on the embedding and the match_threshold.
CREATE OR REPLACE FUNCTION match_rsn_page_vectors(
    -- The target embedding vector for similarity matching
    embedding vector,
    -- Minimum threshold for similarity match
    match_threshold float,
    -- Limit the number of results returned
    match_count int,
    -- Minimum length of raw_content for a valid match
    min_content_length int,
    -- Array of page IDs to specifically search within (Optional)
    rsn_page_ids text[] DEFAULT NULL,
    -- Flag to allow searching within child pages (Optional)
    allow_child_pages boolean DEFAULT TRUE
) RETURNS TABLE (
    id text,
    raw_content text,
    similarity float,
    rsn_page_id text
) LANGUAGE plpgsql AS $$ #variable_conflict use_variable
BEGIN
    -- Begin the query to find similar vectors
    RETURN QUERY WITH page_ids AS (
        SELECT t.id FROM unnest(rsn_page_ids) AS t(id)
        UNION ALL
        SELECT get_child_pages.id FROM get_child_pages(rsn_page_ids) WHERE allow_child_pages
    )
    SELECT 
        -- Select relevant columns from the 'rsn_page_vector' table
        rsn_page_vector.id,
        rsn_page_vector.raw_content,
        -- Compute similarity score based on the distance between vectors
        (rsn_page_vector.embedding <#> embedding) * -1 as similarity,
        -- Include the page ID related to the vector
        rsn_page_vector.rsn_page_id  
    FROM rsn_page_vector
    -- Join with our temporary table containing relevant page IDs
    INNER JOIN page_ids ON rsn_page_vector.id = page_ids.id
    WHERE 
        -- Filter out vectors with insufficient content length
        length(rsn_page_vector.raw_content) >= min_content_length 
        -- Apply the threshold filter for similarity
        AND (rsn_page_vector.embedding <#> embedding) * -1 > match_threshold
    -- Order the results by similarity score
    ORDER BY similarity
    -- Limit the number of results
    LIMIT match_count;

END;
$$;