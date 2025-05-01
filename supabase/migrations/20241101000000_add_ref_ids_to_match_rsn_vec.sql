-- Drop the existing function first
DROP FUNCTION IF EXISTS public.match_rsn_vec(vector, double precision, integer, integer, text, text, text[]);

-- Create the new function with the additional parameter
CREATE OR REPLACE FUNCTION public.match_rsn_vec(
    match_embedding vector, 
    match_threshold double precision, 
    match_count integer, 
    min_content_length integer, 
    filter_tablename text DEFAULT NULL::text, 
    filter_colname text DEFAULT NULL::text, 
    filter_colpath text[] DEFAULT NULL::text[],
    filter_ref_ids text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
    id text, 
    raw_content text, 
    similarity double precision, 
    _ref_id text, 
    result_tablename text, 
    result_colname text, 
    result_colpath text[]
)
LANGUAGE plpgsql
AS $function$ #variable_conflict use_variable
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            rsn_vec.id,
            rsn_vec.raw_content,
            rsn_vec.embedding,
            rsn_vec._ref_id,
            rsn_vec.tablename,
            rsn_vec.colname,
            rsn_vec.colpath
        FROM 
            rsn_vec
        WHERE
            length(rsn_vec.raw_content) >= min_content_length
            AND (rsn_vec.tablename = filter_tablename OR filter_tablename IS NULL)
            AND (rsn_vec.colname = filter_colname OR filter_colname IS NULL)
            AND (rsn_vec.colpath = filter_colpath OR filter_colpath IS NULL)
            AND (rsn_vec._ref_id = ANY(filter_ref_ids) OR filter_ref_ids IS NULL)
    ),
    similarity_calc AS (
        SELECT 
            *,
            (filtered_data.embedding <#> match_embedding) * -1 AS similarity
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
        similarity_calc.colpath as result_colpath
    FROM 
        similarity_calc
    WHERE
        similarity_calc.similarity > match_threshold
    ORDER BY 
        similarity_calc.similarity DESC
    LIMIT 
        match_count;
END;
$function$; 