/**
 * Retrieves a tree of linked skills starting from a given skill ID.
 * @param user_id - The ID of the user requesting the skill tree
 * @param input_skill_id - The ID of the skill to start traversing from
 * @param direction - The direction to traverse ('upstream' or 'downstream', defaults to 'downstream')
 * @returns {Object} Returns a table with:
 * - skill_id - The ID of each skill in the tree
 * - skill_name - The name of each skill
 * - skill_emoji - The emoji associated with each skill
 * - skill_links - Array of objects containing link information {to: string, id: string}[]
 */
CREATE OR REPLACE FUNCTION public.get_linked_skills(
    user_id text,
    input_skill_id text,
    direction text DEFAULT 'downstream'
)
RETURNS TABLE(
    skill_id text,
    skill_name text,
    skill_emoji text,
    skill_links jsonb[]
)
LANGUAGE sql AS $$
WITH RECURSIVE traversal (skill_id, skill_name, skill_emoji, visited, path_links) AS (
    -- Base case: start from the input skill
    SELECT 
        s.id, 
        s._name,
        s.emoji,
        ARRAY[s.id],
        ARRAY[]::text[]
    FROM skill s
    WHERE s.id = input_skill_id

    UNION

    -- Recursive step: follow links based on direction
    SELECT 
        s2.id,
        s2._name,
        s2.emoji,
        visited || s2.id,
        path_links || sl.id
    FROM traversal t
    JOIN skill_link sl ON (
        (direction = 'downstream' AND sl.upstream_skill = t.skill_id)
        OR (direction = 'upstream' AND sl.downstream_skill = t.skill_id)
    )
    JOIN skill s2 ON (
        (direction = 'downstream' AND s2.id = sl.downstream_skill)
        OR (direction = 'upstream' AND s2.id = sl.upstream_skill)
    )
    WHERE s2.id <> ALL(t.visited)
), all_traversed_links AS (
    -- Collect all links that were traversed in any path
    SELECT DISTINCT unnest(path_links) as link_id
    FROM traversal
), unique_skills AS (
    -- Get unique skills and their valid path links
    SELECT DISTINCT ON (skill_id) 
        skill_id, 
        skill_name,
        skill_emoji
    FROM traversal
), skill_links_aggregated AS (
    -- Aggregate all skill links for each unique skill
    SELECT 
        us.skill_id,
        us.skill_name,
        us.skill_emoji,
        (
            SELECT COALESCE(array_agg(DISTINCT jsonb_build_object(
                'to', CASE 
                    WHEN direction = 'downstream' THEN sl.downstream_skill
                    ELSE sl.upstream_skill
                END,
                'id', sl.id
            )), ARRAY[]::jsonb[])
            FROM skill_link sl
            JOIN all_traversed_links atl ON sl.id = atl.link_id
            WHERE (
                (direction = 'downstream' AND sl.upstream_skill = us.skill_id)
                OR (direction = 'upstream' AND sl.downstream_skill = us.skill_id)
            )
        ) AS skill_links
    FROM unique_skills us
)
SELECT 
    sla.skill_id,
    sla.skill_name,
    sla.skill_emoji,
    sla.skill_links
FROM skill_links_aggregated sla;
$$;

/**
 * Retrieves a tree of linked skills with their scores and activity results.
 * @param user_id - The ID of the user requesting the skill tree
 * @param input_skill_id - The ID of the skill to start traversing from
 * @param direction - The direction to traverse ('upstream' or 'downstream', defaults to 'downstream')
 * @returns {Object} Returns a table with:
 * - skill_id - The ID of each skill in the tree
 * - skill_name - The name of each skill
 * - skill_emoji - The emoji associated with each skill
 * - skill_links - Array of objects containing link information {to: string, id: string}[]
 * - user_activity_result_ids - Array of activity result IDs associated with the user for this skill
 * - skill_score - The calculated score for the skill (float between 0 and 1)
 */
CREATE OR REPLACE FUNCTION public.get_linked_skills_with_scores_v2(
    user_id text,
    input_skill_id text,
    direction text DEFAULT 'downstream'
)
RETURNS TABLE(
    skill_id text,
    skill_name text,
    skill_emoji text,
    skill_links jsonb[],
    user_activity_result_ids text[],
    skill_score float
)
LANGUAGE sql AS $$
WITH RECURSIVE traversal (skill_id, skill_name, skill_emoji, visited, path_links) AS (
    -- Base case: start from the input skill
    SELECT 
        s.id, 
        s._name,
        s.emoji,
        ARRAY[s.id],
        ARRAY[]::text[]
    FROM skill s
    WHERE s.id = input_skill_id

    UNION

    -- Recursive step: follow links based on direction
    SELECT 
        s2.id,
        s2._name,
        s2.emoji,
        visited || s2.id,
        path_links || sl.id
    FROM traversal t
    JOIN skill_link sl ON (
        (direction = 'downstream' AND sl.upstream_skill = t.skill_id)
        OR (direction = 'upstream' AND sl.downstream_skill = t.skill_id)
    )
    JOIN skill s2 ON (
        (direction = 'downstream' AND s2.id = sl.downstream_skill)
        OR (direction = 'upstream' AND s2.id = sl.upstream_skill)
    )
    WHERE s2.id <> ALL(t.visited)
), direct_scores AS (
    -- Get direct scores from activity results for each skill
    SELECT 
        t.skill_id,
        AVG(uar.score) as direct_score,
        COUNT(uar.id) as score_count
    FROM traversal t
    LEFT JOIN activity_skill askl ON askl.skill = t.skill_id
    LEFT JOIN user_activity_result uar ON uar.activity = askl.activity 
        AND uar._user = user_id
    GROUP BY t.skill_id
), traversal_nodes AS (
    -- For each node, find all nodes reachable in the specified direction
    WITH RECURSIVE node_traversal(source_id, node_id) AS (
        -- Base: each node can reach itself
        SELECT 
            t.skill_id as source_id,
            t.skill_id as node_id
        FROM traversal t
        
        UNION
        
        -- Recursive: follow links in specified direction
        SELECT
            nt.source_id,
            CASE 
                WHEN direction = 'downstream' THEN sl.downstream_skill
                ELSE sl.upstream_skill
            END as node_id
        FROM node_traversal nt
        JOIN skill_link sl ON (
            direction = 'downstream' AND sl.upstream_skill = nt.node_id
            OR
            direction = 'upstream' AND sl.downstream_skill = nt.node_id
        )
    )
    SELECT
        source_id,
        array_agg(DISTINCT node_id) as reachable_nodes
    FROM node_traversal
    GROUP BY source_id
), aggregated_scores AS (
    -- Calculate scores using only reachable nodes
    SELECT 
        tn.source_id as skill_id,
        (
            SELECT COALESCE(AVG(ds.direct_score), 0)
            FROM unnest(tn.reachable_nodes) as r(node_id)
            LEFT JOIN direct_scores ds ON ds.skill_id = r.node_id
        ) as score
    FROM traversal_nodes tn
), all_traversed_links AS (
    -- Collect all links that were traversed in any path
    SELECT DISTINCT unnest(path_links) as link_id
    FROM traversal
), unique_skills AS (
    -- Get unique skills and their valid path links
    SELECT DISTINCT ON (skill_id) 
        skill_id, 
        skill_name,
        skill_emoji
    FROM traversal
), skill_links_aggregated AS (
    -- Aggregate all skill links for each unique skill
    SELECT 
        us.skill_id,
        us.skill_name,
        us.skill_emoji,
        (
            SELECT COALESCE(array_agg(DISTINCT jsonb_build_object(
                'to', CASE 
                    WHEN direction = 'downstream' THEN sl.downstream_skill
                    ELSE sl.upstream_skill
                END,
                'id', sl.id
            )), ARRAY[]::jsonb[])
            FROM skill_link sl
            JOIN all_traversed_links atl ON sl.id = atl.link_id
            WHERE (
                (direction = 'downstream' AND sl.upstream_skill = us.skill_id)
                OR (direction = 'upstream' AND sl.downstream_skill = us.skill_id)
            )
        ) AS skill_links
    FROM unique_skills us
)
SELECT 
    sla.skill_id,
    sla.skill_name,
    sla.skill_emoji,
    sla.skill_links,
    (
        SELECT COALESCE(array_agg(uar.id), ARRAY[]::text[])
        FROM user_activity_result uar
        JOIN activity_skill askl ON askl.activity = uar.activity
        WHERE uar._user = user_id
          AND askl.skill = sla.skill_id
    ) AS user_activity_result_ids,
    COALESCE(ags.score, 0) as skill_score
FROM skill_links_aggregated sla
LEFT JOIN aggregated_scores ags ON ags.skill_id = sla.skill_id;
$$;