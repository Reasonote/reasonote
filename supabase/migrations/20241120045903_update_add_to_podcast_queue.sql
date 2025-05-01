DROP FUNCTION IF EXISTS public.add_to_podcast_queue;

CREATE OR REPLACE FUNCTION public.add_to_podcast_queue(p_topic text, p_special_instructions text, p_podcast_type text, p_desired_position double precision DEFAULT NULL::double precision, p_for_skill_path text[] DEFAULT NULL::text[], p_from_podcast_id text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_new_podcast_id TEXT;
    v_for_user TEXT;
    v_position FLOAT;
    v_max_position FLOAT;
BEGIN
    -- Get the current user
    v_for_user := public.current_rsn_user_id();

    -- Create a new podcast based on the given topic
    INSERT INTO public.podcast (
        for_user,
        title,
        topic,
        special_instructions,
        podcast_type,
        created_by,
        updated_by,
        for_skill_path
    ) VALUES (
        v_for_user,
        p_topic,
        p_topic,
        p_special_instructions,
        p_podcast_type,
        v_for_user,
        v_for_user,
        p_for_skill_path
    ) RETURNING id INTO v_new_podcast_id;

    IF p_from_podcast_id IS NOT NULL THEN
        -- Create duplicate resources for every resource that references the original podcast
        INSERT INTO public.resource (
            parent_podcast_id,
            child_snip_id,
            child_page_id,
            metadata,
            created_by,
            updated_by
        )
        SELECT 
            v_new_podcast_id,
            r.child_snip_id,
            r.child_page_id,
            r.metadata,
            v_for_user,
            v_for_user
        FROM public.resource r
        WHERE r.parent_podcast_id = p_from_podcast_id;
    END IF;

    -- Determine position
    IF p_desired_position IS NULL THEN
        SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
        FROM public.podcast_queue_item
        WHERE for_user = v_for_user;
    ELSE
        -- Find the position of the item immediately after the desired position
        SELECT position INTO v_max_position
        FROM public.podcast_queue_item
        WHERE for_user = v_for_user AND position > p_desired_position
        ORDER BY position ASC
        LIMIT 1;

        IF v_max_position IS NULL THEN
            v_position := p_desired_position + 1;
        ELSE
            v_position := (p_desired_position + v_max_position) / 2;
        END IF;
    END IF;

    -- Add the new podcast to the queue
    INSERT INTO public.podcast_queue_item (for_user, podcast_id, position)
    VALUES (v_for_user, v_new_podcast_id, v_position);

    RETURN v_new_podcast_id;
END;
$function$