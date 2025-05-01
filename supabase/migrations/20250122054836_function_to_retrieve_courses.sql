CREATE OR REPLACE FUNCTION public.get_courses_for_user(p_principal_id text, p_course_id text DEFAULT NULL)
RETURNS TABLE (
    memauth_id text,
    principal_id text,
    principal_type agent_type,
    course_id text,
    access_level varchar,
    permissions varchar[],
    is_public boolean,
    course_name text,
    course_description text,
    course_root_skill text,
    course_created_date timestamptz,
    course_updated_date timestamptz,
    course_created_by text,
    course_updated_by text,
    course_cover_image_url text
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_courses AS (
        SELECT 
            ma.memauth_id,
            ma.principal_id,
            ma.principal_type,
            ma.course_id,
            ma.access_level,
            ma.permissions,
            ma.is_public,
            c._name AS course_name,
            c._description AS course_description,
            c.root_skill AS course_root_skill,
            c.created_date AS course_created_date,
            c.updated_date AS course_updated_date,
            c.created_by AS course_created_by,
            c.updated_by AS course_updated_by,
            c.cover_image_url AS course_cover_image_url,
            -- Rank rows: principal matches = 1, public = 2
            ROW_NUMBER() OVER (
                PARTITION BY c.id 
                ORDER BY 
                    CASE 
                        WHEN ma.principal_id = p_principal_id THEN 1
                        WHEN ma.is_public THEN 2
                        ELSE 3
                    END
            ) as rank
        FROM vw_course_memauth ma
        JOIN course c ON c.id = ma.course_id
        WHERE 
            (ma.principal_id = p_principal_id OR ma.is_public)
            AND (p_course_id IS NULL OR c.id = p_course_id)
        ORDER BY c.id, rank
    )
    SELECT DISTINCT ON (rc.course_id)
        rc.memauth_id,
        rc.principal_id,
        rc.principal_type,
        rc.course_id,
        rc.access_level,
        rc.permissions,
        rc.is_public,
        rc.course_name,
        rc.course_description,
        rc.course_root_skill,
        rc.course_created_date,
        rc.course_updated_date,
        rc.course_created_by,
        rc.course_updated_by,
        rc.course_cover_image_url
    FROM ranked_courses rc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_courses_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_courses_for_user TO anon;
GRANT EXECUTE ON FUNCTION public.get_courses_for_user TO service_role;

COMMENT ON FUNCTION public.get_courses_for_user IS 
'Gets course data along with memauth permissions for a given principal_id. 
Optionally filters by course_id if provided. 
Returns one row per course, prioritizing rows where principal_id matches over public rows.';
