CREATE OR REPLACE FUNCTION public.get_downstream_skills_with_scores(
    user_id text, 
    input_skill_id text, 
    start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, 
    end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS TABLE(
    skill_id text, 
    skill_name text, 
    path_from text[], 
    path_from_links text[], 
    min_normalized_score_downstream double precision, 
    max_normalized_score_downstream double precision, 
    average_normalized_score_downstream double precision, 
    stddev_normalized_score_downstream double precision, 
    activity_result_count_downstream bigint, 
    all_scores double precision[], 
    num_downstream_skills bigint,
    level_on_parent text,
    level_path text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE linked_skills AS (
        -- Base case: start with the input skill
        SELECT
            s.id AS skill_id,
            ARRAY[]::text[] as path,
            ARRAY[]::text[] as skill_link_ids,
            NULL::text AS level_on_parent,
            ARRAY[]::text[] as level_path
        FROM skill s
        WHERE s.id = input_skill_id

        UNION ALL

        -- Recursive case: get downstream skills
        SELECT 
            sl.downstream_skill,
            ls.path || sl.downstream_skill,
            ls.skill_link_ids || sl.id,
            (sl.metadata::jsonb ->> 'levelOnParent')::text AS level_on_parent,
            ls.level_path || (sl.metadata::jsonb ->> 'levelOnParent')::text AS level_path
        FROM
            skill_link sl
        INNER JOIN 
            linked_skills ls ON sl.upstream_skill = ls.skill_id
    ),
    all_user_scores AS (
        SELECT
            askl.skill,
            uar.score_normalized
        FROM
            activity_skill askl
        JOIN
            user_activity_result uar ON askl.activity = uar.activity
        WHERE 
            uar._user = user_id
            AND (start_date IS NULL OR uar.created_date >= start_date)
            AND (end_date IS NULL OR uar.created_date <= end_date)
    ),
    skill_with_scores AS (
        SELECT
            ls.skill_id,
            ARRAY_AGG(aus.score_normalized) AS path_scores,
            -- Exclude self from count by subtracting 1
            COUNT(DISTINCT lss.skill_id) - 1 AS num_downstream_skills
        FROM
            linked_skills ls
        JOIN
            linked_skills lss ON lss.path @> ls.path
        LEFT JOIN
            all_user_scores aus ON aus.skill = lss.skill_id
        GROUP BY
            ls.skill_id
    ),
    unnested_scores AS (
        SELECT
            sws.skill_id,
            unnest(path_scores) AS score
        FROM
            skill_with_scores sws
    )
    SELECT
        sws.skill_id,
        s._name AS skill_name,
        ls.path AS path_from,
        ls.skill_link_ids AS path_from_links,
        MIN(us.score) AS min_normalized_score_downstream,
        MAX(us.score) AS max_normalized_score_downstream,
        AVG(us.score) AS average_normalized_score_downstream,
        STDDEV(us.score) AS stddev_normalized_score_downstream,
        COUNT(us.score) AS activity_result_count_downstream,
        ARRAY_REMOVE(ARRAY_AGG(us.score), NULL) AS all_scores,
        sws.num_downstream_skills,
        ls.level_on_parent AS level_on_parent,
        ls.level_path AS level_path
    FROM 
        skill_with_scores sws
    JOIN 
        linked_skills ls ON ls.skill_id = sws.skill_id 
    JOIN 
        skill s ON s.id = sws.skill_id
    LEFT JOIN
        unnested_scores us ON sws.skill_id = us.skill_id
    GROUP BY
        sws.skill_id, s._name, ls.path, ls.skill_link_ids, sws.num_downstream_skills, ls.level_on_parent, ls.level_path
    ORDER BY
        ARRAY_LENGTH(ls.path, 1);
END;
$$;

COMMENT ON FUNCTION public.get_downstream_skills_with_scores IS 'Gets all skills downstream from the input skill, along with user scores and path information.'; 