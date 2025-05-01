-- Add the new vector column
ALTER TABLE public.rsn_vec 
ADD COLUMN embedding_openai_text_embedding_3_small vector(1536);

-- Add an HNSW index for the new vector column
CREATE INDEX ON public.rsn_vec 
    USING hnsw (embedding_openai_text_embedding_3_small vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Drop the old version of the function without embedding_column
DROP FUNCTION IF EXISTS public.match_rsn_vec(vector, double precision, integer, integer, text, text, text[], text[]);

CREATE OR REPLACE FUNCTION public.match_rsn_vec(
    match_embedding vector,
    match_threshold double precision,
    match_count integer,
    min_content_length integer,
    filter_tablename text DEFAULT NULL::text,
    filter_colname text DEFAULT NULL::text,
    filter_colpath text[] DEFAULT NULL::text[],
    filter_ref_ids text[] DEFAULT NULL::text[],
    embedding_column text DEFAULT 'embedding'::text
)
RETURNS TABLE(
    id text,
    raw_content text,
    similarity double precision,
    _ref_id text,
    result_tablename text,
    result_colname text,
    result_colpath text[],
    content_offset integer
)
LANGUAGE plpgsql
AS $function$ #variable_conflict use_variable
DECLARE
    query text;
BEGIN
    query := format(
        'WITH filtered_data AS (
            SELECT 
                rsn_vec.id,
                rsn_vec.raw_content,
                rsn_vec.%I as embedding_to_compare,
                rsn_vec._ref_id,
                rsn_vec.tablename,
                rsn_vec.colname,
                rsn_vec.colpath,
                rsn_vec.content_offset
            FROM 
                rsn_vec
            WHERE
                length(rsn_vec.raw_content) >= $1
                AND (rsn_vec.tablename = $2 OR $2 IS NULL)
                AND (rsn_vec.colname = $3 OR $3 IS NULL)
                AND (rsn_vec.colpath = $4 OR $4 IS NULL)
                AND (rsn_vec._ref_id = ANY($5) OR $5 IS NULL)
        ),
        similarity_calc AS (
            SELECT 
                *,
                (embedding_to_compare <#> $6) * -1 AS similarity
            FROM 
                filtered_data
        )
        SELECT 
            similarity_calc.id,
            similarity_calc.raw_content,
            similarity_calc.similarity,
            similarity_calc._ref_id,
            similarity_calc.tablename as result_tablename,
            similarity_calc.colname as result_colname,
            similarity_calc.colpath as result_colpath,
            similarity_calc.content_offset
        FROM 
            similarity_calc
        WHERE
            similarity_calc.similarity > $7
        ORDER BY 
            similarity_calc.similarity DESC
        LIMIT 
            $8',
        embedding_column
    );

    RETURN QUERY EXECUTE query 
    USING 
        min_content_length,
        filter_tablename,
        filter_colname,
        filter_colpath,
        filter_ref_ids,
        match_embedding,
        match_threshold,
        match_count;
END;
$function$;