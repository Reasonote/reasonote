CREATE OR REPLACE FUNCTION public.tgr_apply_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        current_user_id text;
        is_super bool;
        is_user_admin bool;
        now_time timestamptz;
    BEGIN
        -- Get current user id and time once to avoid multiple function calls
        current_user_id := current_rsn_user_id();
        now_time := (now() at time zone 'utc');
        
        -- Check if current role is postgres
        is_super := (current_user = 'postgres');
        
        -- Check if current user is admin
        is_user_admin := (SELECT is_admin());

        /*
            On update we allow admins/superusers to override all audit fields if they wish.
        */
        IF TG_OP = 'UPDATE' THEN
            BEGIN
                -- Handle created_by
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.created_by IS NOT NULL AND 
                    NEW.created_by != OLD.created_by
                ) THEN
                    NEW.created_by = OLD.created_by;
                END IF;

                -- Handle created_date
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.created_date IS NOT NULL AND 
                    NEW.created_date != OLD.created_date AND
                    ABS(EXTRACT(EPOCH FROM (NEW.created_date - OLD.created_date))) > 5
                ) THEN
                    NEW.created_date = OLD.created_date;
                END IF;

                -- Handle updated_by
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.updated_by IS NOT NULL AND 
                    NEW.updated_by != current_user_id
                ) THEN
                    NEW.updated_by = current_user_id;
                END IF;

                -- Handle updated_date
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.updated_date IS NOT NULL AND
                    ABS(EXTRACT(EPOCH FROM (NEW.updated_date - now_time))) > 5
                ) THEN
                    NEW.updated_date = now_time;
                END IF;
            END;
        END IF;

        /*
         On insert, set the audit fields unless the user is admin/super
         and explicitly provided different values
        */
        IF TG_OP = 'INSERT' THEN
            BEGIN
                -- Handle created_by
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.created_by IS NOT NULL AND 
                    NEW.created_by != current_user_id
                ) THEN
                    NEW.created_by = current_user_id;
                END IF;

                -- Handle created_date
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.created_date IS NOT NULL AND
                    ABS(EXTRACT(EPOCH FROM (NEW.created_date - now_time))) > 5
                ) THEN
                    NEW.created_date = now_time;
                END IF;

                -- Handle updated_by
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.updated_by IS NOT NULL AND 
                    NEW.updated_by != current_user_id
                ) THEN
                    NEW.updated_by = current_user_id;
                END IF;

                -- Handle updated_date
                IF NOT (
                    (is_super OR is_user_admin) AND 
                    NEW.updated_date IS NOT NULL AND
                    ABS(EXTRACT(EPOCH FROM (NEW.updated_date - now_time))) > 5
                ) THEN
                    NEW.updated_date = now_time;
                END IF;
            END;
        END IF;

        RETURN NEW;
    END;
$function$;

COMMENT ON FUNCTION public.tgr_apply_audit IS 'Applies audit fields (created_by, created_date, updated_by, updated_date) to tables. Allows admin and superusers to override all audit fields, including dates if the provided values differ by more than 5 seconds.';