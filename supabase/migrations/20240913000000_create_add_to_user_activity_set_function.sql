-- Create the function to add activities to a user's activity set
CREATE OR REPLACE FUNCTION public.add_to_user_activity_set(add_ids text[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rsn_user_id text;
    activity_set_id text;
    activity_set_activities text[];
BEGIN
    -- Get the current user's ID
    rsn_user_id := public.current_rsn_user_id();

    -- Check if the user exists
    IF rsn_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not found!');
    END IF;

    -- Get the user's activity set
    SELECT id INTO activity_set_id
    FROM activity_set
    WHERE for_user = rsn_user_id;

    -- If the user doesn't have an activity set, create one
    IF activity_set_id IS NULL THEN
        INSERT INTO activity_set (for_user)
        VALUES (rsn_user_id)
        RETURNING id INTO activity_set_id;
    END IF;

    -- Add the activities to the user's activity set
    WITH inserted_activities AS (
        INSERT INTO activity_set_activity (activity_set, activity)
        SELECT activity_set_id, unnest(add_ids)
        ON CONFLICT (activity_set, activity) DO NOTHING
        RETURNING id
    )
    SELECT array_agg(id) INTO activity_set_activities
    FROM inserted_activities;

    -- Return the result
    RETURN json_build_object(
        'activitySetId', activity_set_id,
        'activitySetActivityIds', activity_set_activities,
        'activityIds', add_ids
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_to_user_activity_set(text[]) TO authenticated;