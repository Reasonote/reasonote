DROP FUNCTION IF EXISTS get_user_skill_scores_with_children(text, text[], timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION get_user_skill_scores_with_children(
    user_id text,
    skill_ids text[],
    start_date timestamp with time zone DEFAULT NULL,
    end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
    skill_id text,
    skill_name text,
    average_normalized_score double precision,
    max_normalized_score double precision,
    min_normalized_score double precision,
    average_normalized_score_children double precision,
    max_normalized_score_children double precision,
    min_normalized_score_children double precision,
    activity_result_count bigint,
    activity_result_count_children bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH child_skills AS (
        SELECT DISTINCT linked_skill_id
        FROM unnest(skill_ids) AS skill_id_array(skill_id),
        LATERAL get_linked_skills_with_path(skill_id_array.skill_id, 'GET_UPSTREAM')
    )
    SELECT
        s.id AS skill_id,
        s._name AS skill_name,
        AVG(uar.score_normalized) AS average_normalized_score,
        MAX(uar.score_normalized) AS max_normalized_score,
        MIN(uar.score_normalized) AS min_normalized_score,
        COALESCE((SELECT AVG(uar_children.score_normalized)
                  FROM user_activity_result uar_children
                  JOIN activity_skill ak_children ON ak_children.activity = uar_children.activity
                  WHERE ak_children.skill = ANY(ARRAY(SELECT linked_skill_id FROM child_skills))
                    AND uar_children._user = user_id
                    AND (start_date IS NULL OR uar_children.created_date >= start_date)
                    AND (end_date IS NULL OR uar_children.created_date <= end_date)), 0) AS average_normalized_score_children,
        COALESCE((SELECT MAX(uar_children.score_normalized)
                  FROM user_activity_result uar_children
                  JOIN activity_skill ak_children ON ak_children.activity = uar_children.activity
                  WHERE ak_children.skill = ANY(ARRAY(SELECT linked_skill_id FROM child_skills))
                    AND uar_children._user = user_id
                    AND (start_date IS NULL OR uar_children.created_date >= start_date)
                    AND (end_date IS NULL OR uar_children.created_date <= end_date)), 0) AS max_normalized_score_children,
        COALESCE((SELECT MIN(uar_children.score_normalized)
                  FROM user_activity_result uar_children
                  JOIN activity_skill ak_children ON ak_children.activity = uar_children.activity
                  WHERE ak_children.skill = ANY(ARRAY(SELECT linked_skill_id FROM child_skills))
                    AND uar_children._user = user_id
                    AND (start_date IS NULL OR uar_children.created_date >= start_date)
                    AND (end_date IS NULL OR uar_children.created_date <= end_date)), 0) AS min_normalized_score_children,
        COALESCE((SELECT COUNT(*)
                  FROM user_activity_result uar_parent
                  JOIN activity_skill ak_parent ON ak_parent.activity = uar_parent.activity
                  WHERE ak_parent.skill = s.id
                    AND uar_parent._user = user_id
                    AND (start_date IS NULL OR uar_parent.created_date >= start_date)
                    AND (end_date IS NULL OR uar_parent.created_date <= end_date)), 0) AS activity_result_count,
        COALESCE((SELECT COUNT(*)
                  FROM user_activity_result uar_children_count
                  JOIN activity_skill ak_children_count ON ak_children_count.activity = uar_children_count.activity
                  WHERE ak_children_count.skill = ANY(ARRAY(SELECT linked_skill_id FROM child_skills))
                    AND uar_children_count._user = user_id
                    AND (start_date IS NULL OR uar_children_count.created_date >= start_date)
                    AND (end_date IS NULL OR uar_children_count.created_date <= end_date)), 0) AS activity_result_count_children
    FROM
        skill s
    LEFT JOIN activity_skill ak ON s.id = ak.skill
    LEFT JOIN user_activity_result uar ON ak.activity = uar.activity
        AND uar._user = user_id
        AND (start_date IS NULL OR uar.created_date >= start_date)
        AND (end_date IS NULL OR uar.created_date <= end_date)
    WHERE
        s.id = ANY(skill_ids)
    GROUP BY
        s.id;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION get_linked_skills_with_scores(
    user_id TEXT,
    input_skill_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    upstream_skill_id TEXT,
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
        -- Base case
        SELECT 
            sl.upstream_skill AS skill_id,
            ARRAY[sl.upstream_skill] AS path,
            ARRAY[sl.id] AS skill_link_ids
        FROM 
            skill_link sl
        WHERE 
            sl.downstream_skill = input_skill_id

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
        JOIN
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
        ls.path AS path_to,
        ls.skill_link_ids AS path_to_links,
        MIN(us.score) AS min_normalized_score_upstream,
        MAX(us.score) AS max_normalized_score_upstream,
        AVG(us.score) AS average_normalized_score_upstream,
        COUNT(us.score) AS activity_result_count_upstream,
        ARRAY_AGG(us.score) AS all_scores
    FROM 
        skill_with_scores sws
    JOIN 
        linked_skills ls ON ls.skill_id = sws.skill_id 
    LEFT JOIN
        unnested_scores us ON sws.skill_id = us.skill_id
    GROUP BY
        sws.skill_id, ls.path, ls.skill_link_ids
    ORDER BY
        ARRAY_LENGTH(ls.path, 1);
END;
$$ LANGUAGE plpgsql;