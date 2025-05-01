----------------------------------------------------------------------------
-- Add position-based ordering to lesson_activity table
----------------------------------------------------------------------------

-- Add position column to lesson_activity (as nullable initially)
ALTER TABLE public.lesson_activity 
ADD COLUMN "position" double precision;

-- Create unique constraint on lesson + position
ALTER TABLE public.lesson_activity
ADD CONSTRAINT lesson_activity_lesson_position_key UNIQUE (lesson, position);

-- Create index for faster position lookups
CREATE INDEX idx_lesson_activity_position 
ON public.lesson_activity (lesson, position);

-- Helper function to add an activity to a lesson at a specific position
CREATE OR REPLACE FUNCTION public.lesson_activity_add(
    p_lesson_id text,
    p_activity_id text,
    p_metadata jsonb DEFAULT NULL,
    p_desired_position double precision DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_lesson_activity_id TEXT;
    v_position FLOAT;
    v_max_position FLOAT;
    v_current_user TEXT;
BEGIN
    -- Get current user
    v_current_user := public.current_rsn_user_id();

    -- Determine position
    IF p_desired_position IS NULL THEN
        -- If no position specified, add to end
        SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
        FROM public.lesson_activity
        WHERE lesson = p_lesson_id;
    ELSE
        -- Find the position of the next item
        SELECT position INTO v_max_position
        FROM public.lesson_activity
        WHERE lesson = p_lesson_id AND position > p_desired_position
        ORDER BY position ASC
        LIMIT 1;

        IF v_max_position IS NULL THEN
            v_position := p_desired_position;
        ELSE
            v_position := (p_desired_position + v_max_position) / 2;
        END IF;
    END IF;

    -- Insert the new lesson_activity
    INSERT INTO public.lesson_activity (
        lesson,
        activity,
        metadata,
        position,
        created_by,
        updated_by
    ) VALUES (
        p_lesson_id,
        p_activity_id,
        p_metadata,
        v_position,
        v_current_user,
        v_current_user
    ) RETURNING id INTO v_new_lesson_activity_id;

    RETURN v_new_lesson_activity_id;
END;
$$;

-- Helper function to reorder an activity within a lesson
CREATE OR REPLACE FUNCTION public.lesson_activity_reorder(
    p_lesson_activity_id text,
    p_new_position double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson_id TEXT;
    v_current_position FLOAT;
    v_next_position FLOAT;
    v_current_user TEXT;
BEGIN
    v_current_user := public.current_rsn_user_id();

    -- Get the current position and lesson
    SELECT position, lesson INTO v_current_position, v_lesson_id
    FROM public.lesson_activity
    WHERE id = p_lesson_activity_id;

    IF v_current_position IS NULL THEN
        RAISE EXCEPTION 'Lesson activity not found';
    END IF;

    -- Find the position of the next item
    SELECT position INTO v_next_position
    FROM public.lesson_activity
    WHERE lesson = v_lesson_id 
    AND position > p_new_position
    ORDER BY position ASC
    LIMIT 1;

    -- Calculate the new position
    IF v_next_position IS NULL THEN
        v_next_position := p_new_position + 1;
    ELSE
        v_next_position := (p_new_position + v_next_position) / 2;
    END IF;

    -- Update the position
    UPDATE public.lesson_activity
    SET position = v_next_position,
        updated_by = v_current_user,
        updated_date = now()
    WHERE id = p_lesson_activity_id;
END;
$$;

-- Helper function to remove an activity from a lesson
CREATE OR REPLACE FUNCTION public.lesson_activity_remove(
    p_lesson_activity_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user TEXT;
BEGIN
    v_current_user := public.current_rsn_user_id();
    
    -- Delete the lesson_activity
    DELETE FROM public.lesson_activity
    WHERE id = p_lesson_activity_id;
END;
$$;


COMMENT ON COLUMN public.lesson_activity.position IS 'The position of this activity within the lesson'; 