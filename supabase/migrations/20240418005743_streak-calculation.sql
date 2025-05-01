
-- A function which will look *backwards* at the `user_activity_result` table.
-- And determine how many days in a row they've done more than 3 activities.
-- This is not a trigger, a normal function.
CREATE OR REPLACE FUNCTION calculate_current_streak(user_id text, input_skill_id text)
RETURNS INTEGER AS $$
DECLARE
    last_activity_date DATE := NULL;  -- Stores the date of the last recorded activity
    current_streak INTEGER := 0;
    this_date DATE;  -- Temporary variable to hold each date as we loop through
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

    -- Loop through each day's activity count in descending order, starting from the most recent
    FOR activity_count, this_date IN
        SELECT COUNT(*), DATE(uar.created_date) AS activity_date
        FROM public.user_activity_result uar
        LEFT JOIN public.activity_skill ask ON uar.activity = ask.activity
        WHERE uar._user = user_id
        AND (
            input_skill_id IS NULL OR  -- No skill filtering if skill_id is not provided
            ask.skill IN (SELECT us.skill_id FROM upstream_skills us)  -- Filter activities by all upstream skills if provided
        )
        GROUP BY DATE(uar.created_date)
        ORDER BY DATE(uar.created_date) DESC
    LOOP
        -- If this is the first iteration, just initialize last_activity_date
        IF last_activity_date IS NULL THEN
            last_activity_date := this_date;
            -- If the first day already has more than three activities, start the streak
            IF activity_count > 3 THEN
                current_streak := 1;
            END IF;
        ELSE
            -- Check if this date is consecutive to the last date (previous day)
            IF last_activity_date - this_date = 1 THEN
                IF activity_count > 3 THEN
                    current_streak := current_streak + 1;  -- Increment the streak
                ELSE
                    -- If less than three activities, break the streak
                    EXIT;
                END IF;
            ELSE
                -- If days are not consecutive, break the loop as the streak is broken
                EXIT;
            END IF;
        END IF;
        last_activity_date := this_date;  -- Update the last_activity_date to current date in loop
    END LOOP;

    -- Drop temporary table
    DROP TABLE upstream_skills;

    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;