DROP FUNCTION get_linked_skills_with_scores(
    user_id TEXT,
    input_skill_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION get_linked_skills_with_scores(
    user_id TEXT,
    input_skill_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    upstream_skill_id TEXT,
    skill_name TEXT,
    path_to TEXT[],
    path_to_links TEXT[],
    min_normalized_score_upstream DOUBLE PRECISION,
    max_normalized_score_upstream DOUBLE PRECISION,
    average_normalized_score_upstream DOUBLE PRECISION,
    activity_result_count_upstream BIGINT,
    all_scores DOUBLE PRECISION[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE linked_skills AS (
        SELECT
                s.id AS skill_id,
                ARRAY[]::text[] as path,
                ARRAY[]::text[] as skill_link_ids
        FROM skill s
        WHERE s.id = input_skill_id

        UNION ALL

        -- Recursive case
        SELECT 
            sl.upstream_skill,
            ls.path || sl.upstream_skill,
            ls.skill_link_ids || sl.id
        FROM 
            skill_link sl
        INNER JOIN 
            linked_skills ls ON sl.downstream_skill = ls.skill_id
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
            ARRAY_AGG(aus.score_normalized) AS path_scores
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
            skill_id,
            unnest(path_scores) AS score
        FROM
            skill_with_scores sws
    )
    SELECT
        sws.skill_id AS upstream_skill_id,
        s._name AS skill_name,
        ls.path AS path_to,
        ls.skill_link_ids AS path_to_links,
        MIN(us.score) AS min_normalized_score_upstream,
        MAX(us.score) AS max_normalized_score_upstream,
        AVG(us.score) AS average_normalized_score_upstream,
        COUNT(us.score) AS activity_result_count_upstream,
        ARRAY_REMOVE(ARRAY_AGG(us.score), NULL) AS all_scores
    FROM 
        skill_with_scores sws
    JOIN 
        linked_skills ls ON ls.skill_id = sws.skill_id 
    JOIN 
        skill s ON s.id = sws.skill_id
    LEFT JOIN
        unnested_scores us ON sws.skill_id = us.skill_id
    GROUP BY
        sws.skill_id, s._name, ls.path, ls.skill_link_ids
    ORDER BY
        ARRAY_LENGTH(ls.path, 1);
END;
$$ LANGUAGE plpgsql;