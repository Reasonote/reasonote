-- Create podcast_queue_item table
CREATE TABLE public.podcast_queue_item (
    id TEXT PRIMARY KEY DEFAULT generate_typed_uuid('podqitem'),
    for_user TEXT NOT NULL REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    podcast_id TEXT NOT NULL REFERENCES public.podcast(id) ON DELETE CASCADE,
    position FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (for_user, position)
);

-- Add RLS policies
ALTER TABLE public.podcast_queue_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "podcast_queue_item SELECT"
    ON public.podcast_queue_item FOR SELECT
    USING (((for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));

CREATE POLICY "podcast_queue_item INSERT"
    ON public.podcast_queue_item FOR INSERT
    WITH CHECK (for_user = (public.current_rsn_user_id())::text OR public.is_admin());

CREATE POLICY "podcast_queue_item UPDATE"
    ON public.podcast_queue_item FOR UPDATE
    USING (for_user = (public.current_rsn_user_id())::text OR public.is_admin());

CREATE POLICY "podcast_queue_item DELETE"
    ON public.podcast_queue_item FOR DELETE
    USING (for_user = (public.current_rsn_user_id())::text OR public.is_admin());

-- Add an index for better performance
CREATE INDEX idx_podcast_queue_item_user_position
ON public.podcast_queue_item (for_user, position);

-- Function to add a podcast to the queue
CREATE OR REPLACE FUNCTION public.add_to_podcast_queue(
    p_podcast_id TEXT,
    p_topic TEXT,
    p_special_instructions TEXT,
    p_podcast_type TEXT,
    p_desired_position FLOAT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        updated_by
    ) VALUES (
        v_for_user,
        p_topic,
        p_topic,
        p_special_instructions,
        p_podcast_type,
        v_for_user,
        v_for_user
    ) RETURNING id INTO v_new_podcast_id;

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
$$;

-- Function to pop the next podcast from the queue
CREATE OR REPLACE FUNCTION public.pop_from_podcast_queue()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_podcast_id TEXT;
    v_for_user TEXT;
BEGIN
    -- Start an explicit transaction
    BEGIN
        -- Get the current user
        v_for_user := public.current_rsn_user_id();

        -- Get the next podcast in the queue and delete it
        DELETE FROM public.podcast_queue_item
        WHERE id = (
            SELECT id
            FROM public.podcast_queue_item
            WHERE for_user = v_for_user
            ORDER BY position ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING podcast_id INTO v_next_podcast_id;

        -- If we get here without errors, the transaction will be committed
    EXCEPTION
        WHEN OTHERS THEN
            -- If an error occurs, the transaction will be rolled back
            RAISE;
    END;

    RETURN v_next_podcast_id;
END;
$$;

-- Function for reordering queue items
CREATE OR REPLACE FUNCTION public.reorder_podcast_queue_item(
    p_item_id TEXT,
    p_new_position FLOAT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_for_user TEXT;
    v_current_position FLOAT;
    v_next_position FLOAT;
BEGIN
    v_for_user := public.current_rsn_user_id();

    -- Get the current position of the item
    SELECT position INTO v_current_position
    FROM public.podcast_queue_item
    WHERE id = p_item_id AND for_user = v_for_user;

    IF v_current_position IS NULL THEN
        RAISE EXCEPTION 'Item not found or not owned by the current user';
    END IF;

    -- Find the position of the item immediately after the new position
    SELECT position INTO v_next_position
    FROM public.podcast_queue_item
    WHERE for_user = v_for_user AND position > p_new_position
    ORDER BY position ASC
    LIMIT 1;

    -- Calculate the new position
    IF v_next_position IS NULL THEN
        v_next_position := p_new_position + 1;
    ELSE
        v_next_position := (p_new_position + v_next_position) / 2;
    END IF;

    -- Update the item's position
    UPDATE public.podcast_queue_item
    SET position = v_next_position
    WHERE id = p_item_id AND for_user = v_for_user;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.podcast_queue_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_podcast_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.pop_from_podcast_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_podcast_queue_item TO authenticated;
