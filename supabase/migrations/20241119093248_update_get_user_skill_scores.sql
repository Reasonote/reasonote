DROP FUNCTION IF EXISTS public.get_user_skill_scores(text, text[], timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION public.get_user_skill_scores(
    user_id text, 
    skill_ids text[], 
    start_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
    end_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
    ignore_activity_ids text[] DEFAULT NULL::text[]
)
 RETURNS TABLE(
    skill_id text, 
    average_normalized_score double precision, 
    max_normalized_score double precision, 
    min_normalized_score double precision
)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS skill_id,
        AVG(uar.score_normalized) AS average_normalized_score,
        MAX(uar.score_normalized) AS max_normalized_score,
        MIN(uar.score_normalized) AS min_normalized_score
    FROM
        skill s
    LEFT JOIN activity_skill ak ON s.id = ak.skill
    LEFT JOIN user_activity_result uar ON ak.activity = uar.activity
        AND uar._user = user_id
        AND (start_date IS NULL OR uar.created_date >= start_date)
        AND (end_date IS NULL OR uar.created_date <= end_date)
        -- Add condition to ignore specified activity IDs
        AND (ignore_activity_ids IS NULL OR uar.activity != ALL(ignore_activity_ids))
    WHERE
        s.id = ANY(skill_ids)
    GROUP BY
        s.id;
END;
$function$;

-- Update function comment
COMMENT ON FUNCTION public.get_user_skill_scores IS 'Gets skill scores for specified skills, with optional date range and activity exclusion filters.'; 