CREATE OR REPLACE FUNCTION get_linked_skills_with_path(skill_id TEXT, direction VARCHAR)
RETURNS TABLE(linked_skill_id TEXT, path_to_linked_skill TEXT[], skill_link_ids TEXT[]) AS $$
WITH RECURSIVE linked_skills AS (
    SELECT 
        CASE 
            WHEN direction = 'GET_UPSTREAM' THEN upstream_skill
            WHEN direction = 'GET_DOWNSTREAM' THEN downstream_skill
        END AS skill,
        ARRAY[]::TEXT[] AS path,
        ARRAY[sl.id]::TEXT[] AS link_ids -- Include the id of the first link
    FROM skill_link sl
    WHERE 
        (direction = 'GET_UPSTREAM' AND downstream_skill = skill_id) OR 
        (direction = 'GET_DOWNSTREAM' AND upstream_skill = skill_id)

    UNION ALL

    SELECT 
        CASE 
            WHEN direction = 'GET_UPSTREAM' THEN sl.upstream_skill
            WHEN direction = 'GET_DOWNSTREAM' THEN sl.downstream_skill
        END,
        ls.path || CASE 
            WHEN direction = 'GET_UPSTREAM' THEN sl.downstream_skill
            WHEN direction = 'GET_DOWNSTREAM' THEN sl.upstream_skill
        END,
        ls.link_ids || sl.id -- Accumulate link ids
    FROM skill_link sl
    INNER JOIN linked_skills ls ON 
        (direction = 'GET_UPSTREAM' AND sl.downstream_skill = ls.skill) OR 
        (direction = 'GET_DOWNSTREAM' AND sl.upstream_skill = ls.skill)
    WHERE NOT (CASE 
            WHEN direction = 'GET_UPSTREAM' THEN sl.downstream_skill
            WHEN direction = 'GET_DOWNSTREAM' THEN sl.upstream_skill
        END = ANY(ls.path))
)
SELECT skill AS linked_skill_id, path || skill AS path_to_linked_skill, link_ids AS skill_link_ids FROM linked_skills;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_linked_skills_with_path(skill_id TEXT, direction VARCHAR) IS 'Returns a table of linked skills, the path to them from the given skill, and the IDs of the skill links in the same order as the path.';


CREATE OR REPLACE FUNCTION get_user_skill_scores_with_children(
    user_id text,
    skill_ids text[],
    start_date timestamp with time zone DEFAULT NULL,
    end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
    skill_id text,
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
        LATERAL get_linked_skills_with_path(skill_id_array.skill_id, 'GET_DOWNSTREAM')
    )
    SELECT
        s.id AS skill_id,
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