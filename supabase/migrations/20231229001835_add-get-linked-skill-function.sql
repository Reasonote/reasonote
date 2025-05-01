CREATE OR REPLACE FUNCTION get_linked_skills_with_path(skill_id TEXT, direction VARCHAR)
RETURNS TABLE(linked_skill_id TEXT, path_to_linked_skill TEXT[], skill_link_ids TEXT[]) AS $$
WITH RECURSIVE linked_skills AS (
    SELECT 
        CASE 
            WHEN direction = 'GET_UPSTREAM' THEN upstream_skill
            WHEN direction = 'GET_DOWNSTREAM' THEN downstream_skill
        END AS skill,
        ARRAY[]::TEXT[] AS path,
        ARRAY[]::TEXT[] AS link_ids
    FROM skill_link
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
        ls.link_ids || sl.id
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

CREATE OR REPLACE FUNCTION get_user_skill_scores(
    user_id text,
    skill_ids text[],
    start_date timestamp with time zone DEFAULT NULL,
    end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
    skill_id text,
    average_normalized_score double precision,
    max_normalized_score double precision,
    min_normalized_score double precision
) AS $$
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
    WHERE
        s.id = ANY(skill_ids)
    GROUP BY
        s.id;
END;
$$ LANGUAGE plpgsql;
