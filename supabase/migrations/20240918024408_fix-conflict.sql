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


CREATE OR REPLACE FUNCTION public.generate_typed_uuid(type_prefix text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$    
    BEGIN
        IF type_prefix IS NULL THEN
            RAISE EXCEPTION 'generate_typed_uuid must have a type_prefix passed to it.';
        ELSE
            IF strpos(type_prefix, '_') = 0 THEN  
                RETURN type_prefix || '_' || extensions.uuid_generate_v4();
            ELSE
                RAISE EXCEPTION 'generate_typed_uuid must have a type_prefix passed to it that does not contain an underscore. Got this: %', type_prefix;
            END IF;
        END IF;     
    END;                  
$function$
;

CREATE OR REPLACE FUNCTION public.tgr_log_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        _id uuid;
        _diff jsonb;
    BEGIN
        
        IF TG_OP = 'DELETE' THEN 
            _id = OLD.id;
        ELSE 
            _id = NEW.id;
        END IF;
        
        SELECT * 
        INTO _diff
        FROM json_diff_values(row_to_json(NEW.*), row_to_json(OLD.*));
        
        INSERT INTO public.operation_log (id, table_name, trigger_name, operation_when, operation_type, operation_level, entity_id, jsonb_diff, rsn_user_id, event_date)
        VALUES(extensions.uuid_generate_v4(), TG_TABLE_NAME, TG_NAME, TG_WHEN, TG_OP, TG_LEVEL, _id, _diff, current_rsn_user_id(), (now() AT TIME ZONE 'utc'::text));
        
        RETURN NEW;
    
    EXCEPTION 
        WHEN OTHERS THEN 
        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
        RETURN NEW;
    END;
$function$
;