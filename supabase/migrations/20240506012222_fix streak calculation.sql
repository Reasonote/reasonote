CREATE OR REPLACE FUNCTION calculate_current_streak(user_id text, input_skill_id text)
RETURNS INTEGER AS $$
DECLARE
    check_date DATE := CURRENT_DATE;  -- Start checking from the current date, renamed variable
    current_streak INTEGER := 0;
    activity_count INTEGER;
    skill RECORD;  -- Variable to store each skill fetched in the loop
BEGIN
    -- Temporary table to store upstream skill IDs
    CREATE TEMP TABLE upstream_skills (skill_id text);

    -- Populate temporary table with upstream skill IDs from the provided skill_id
    IF input_skill_id IS NOT NULL THEN
        FOR skill IN SELECT skill_id FROM public.get_linked_skills_with_scores(user_id, input_skill_id) LOOP
            INSERT INTO upstream_skills VALUES (skill.skill_id);
        END LOOP;
    END IF;

    -- Loop through each day's activity count in descending order, starting from the current date
    FOR activity_count IN
        SELECT COUNT(*)
        FROM public.user_activity_result uar
        LEFT JOIN public.activity_skill ask ON uar.activity = ask.activity
        WHERE uar._user = user_id
        AND DATE(uar.created_date) = check_date
        AND (
            input_skill_id IS NULL OR  -- No skill filtering if skill_id is not provided
            ask.skill IN (SELECT skill_id FROM upstream_skills)  -- Filter activities by all upstream skills if provided
        )
    LOOP
        -- If the activity count for the current day is more than three, increment the streak
        IF activity_count > 3 THEN
            current_streak := current_streak + 1;
        ELSE
            -- If less than three activities, break the streak
            EXIT;
        END IF;
        -- Move to the previous day
        check_date := check_date - 1;

        -- Check if there are any activities at all the previous day to maintain the streak
        IF NOT EXISTS (
            SELECT 1
            FROM public.user_activity_result uar
            WHERE uar._user = user_id
            AND DATE(uar.created_date) = check_date
        ) THEN
            EXIT;  -- Exit if no activities found on the previous day, breaking the streak
        END IF;
    END LOOP;

    -- Drop temporary table
    DROP TABLE upstream_skills;

    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;
