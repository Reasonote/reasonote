-- Create the function to add skills to user skill set
CREATE OR REPLACE FUNCTION add_skills_to_user_skill_set(
    p_add_ids text[] DEFAULT NULL,
    p_add_skills jsonb DEFAULT NULL,
    p_add_skill_resources jsonb DEFAULT NULL,
    p_rsn_user_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_using_user_id text;
    v_skill_set record;
    v_all_ids text[] := COALESCE(p_add_ids, ARRAY[]::text[]);
    v_new_skills text[];
    v_existing_skill_set_skills text[];
    v_ids_to_add text[];
    v_skill_set_skills text[];
    v_skill_resource_ids text[];
    v_result jsonb;
BEGIN
    -- Get the current user ID if not provided
    v_using_user_id := COALESCE(p_rsn_user_id, auth.uid()::text);

    IF v_using_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Get or create the user's skill set
    SELECT * INTO v_skill_set FROM skill_set WHERE for_user = v_using_user_id LIMIT 1;
    
    IF v_skill_set IS NULL THEN
        INSERT INTO skill_set (for_user) VALUES (v_using_user_id)
        RETURNING * INTO v_skill_set;
    END IF;

    -- Add new skills if provided
    IF p_add_skills IS NOT NULL AND jsonb_array_length(p_add_skills) > 0 THEN
        WITH new_skills AS (
            INSERT INTO skill (_name, _description, emoji, for_user)
            SELECT 
                s->>'name',
                s->>'description',
                s->>'emoji',
                v_using_user_id
            FROM jsonb_array_elements(p_add_skills) s
            WHERE s->>'name' IS NOT NULL AND trim(s->>'name') != ''
            RETURNING id
        )
        SELECT array_agg(id) INTO v_new_skills FROM new_skills;
        
        v_all_ids := v_all_ids || v_new_skills;
    END IF;

    -- Get existing skill set skills
    SELECT array_agg(skill) INTO v_existing_skill_set_skills
    FROM skill_set_skill
    WHERE skill_set = v_skill_set.id;

    -- Filter out existing skills
    SELECT array_agg(id) INTO v_ids_to_add
    FROM unnest(v_all_ids) id
    WHERE id NOT IN (SELECT unnest(v_existing_skill_set_skills));

    -- Add new skills to skill set
    WITH new_skill_set_skills AS (
        INSERT INTO skill_set_skill (skill_set, skill)
        SELECT v_skill_set.id, unnest(v_ids_to_add)
        RETURNING id
    )
    SELECT array_agg(id) INTO v_skill_set_skills FROM new_skill_set_skills;

    -- Add skill resources if provided
    IF p_add_skill_resources IS NOT NULL AND jsonb_array_length(p_add_skill_resources) > 0 THEN
        WITH new_skill_resources AS (
            INSERT INTO skill_resource (skill_id, page_id, snip_id)
            SELECT 
                s.skill_id,
                r->>'pageId',
                r->>'snipId'
            FROM jsonb_array_elements(p_add_skill_resources) r
            CROSS JOIN unnest(v_all_ids) s(skill_id)
            RETURNING id
        )
        SELECT array_agg(id) INTO v_skill_resource_ids FROM new_skill_resources;
    END IF;

    -- Prepare the result
    v_result := jsonb_build_object(
        'skillSetId', v_skill_set.id,
        'skillSetSkillIds', v_skill_set_skills,
        'skillIds', v_all_ids,
        'skillResourceIds', v_skill_resource_ids
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION add_skills_to_user_skill_set TO authenticated;

-- Add a comment to the function
COMMENT ON FUNCTION add_skills_to_user_skill_set IS 'Adds skills to a user''s skill set, creating new skills and skill resources as needed.';