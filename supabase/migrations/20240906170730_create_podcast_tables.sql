-- Create podcast table
CREATE TABLE public.podcast (
    id text PRIMARY KEY DEFAULT generate_typed_uuid('podcast'::text),
    for_skill text REFERENCES public.skill(id) ON DELETE SET NULL,
    for_user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    title text NOT NULL,
    topic text NOT NULL,
    podcast_type text NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    transcript jsonb,
    metadata jsonb,
    special_instructions text,
    outline jsonb,
    CONSTRAINT podcast_id_check CHECK (is_valid_typed_uuid('podcast'::text, id::typed_uuid))
);

CREATE TABLE public.podcast_line (
    id text PRIMARY KEY DEFAULT generate_typed_uuid('podline'::text),
    podcast_id text REFERENCES public.podcast(id) ON DELETE CASCADE,
    speaker text NOT NULL,
    dialogue text NOT NULL,
    dig_deeper_topics text[],
    line_number integer NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT podcast_line_id_check CHECK (is_valid_typed_uuid('podline'::text, id::typed_uuid))
);

-- Create a function to set the line number
CREATE OR REPLACE FUNCTION public.set_podcast_line_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_number := (
    -- This allows the number is always unique and sequential. -1 is so that the first line in a podcast is always 0.
    SELECT COALESCE(MAX(line_number), -1) + 1
    FROM public.podcast_line
    WHERE podcast_id = NEW.podcast_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set the line number
CREATE TRIGGER set_podcast_line_number_trigger
    BEFORE INSERT ON public.podcast_line
    FOR EACH ROW
    EXECUTE FUNCTION public.set_podcast_line_number();

-- Descriptions
COMMENT ON TABLE public.podcast IS 'A podcast is a collection of podcast lines that are used to create a podcast.';
COMMENT ON COLUMN public.podcast.id IS 'The ID of the podcast.';
COMMENT ON COLUMN public.podcast.for_skill IS 'The skill that the podcast is for.';
COMMENT ON COLUMN public.podcast.for_user IS 'The user that the podcast is for.';
COMMENT ON COLUMN public.podcast.title IS 'The title of the podcast.';
COMMENT ON COLUMN public.podcast.topic IS 'The topic of the podcast.';
COMMENT ON COLUMN public.podcast.podcast_type IS 'The type of podcast.';
COMMENT ON COLUMN public.podcast.created_date IS 'The date that this podcast was created.';
COMMENT ON COLUMN public.podcast.updated_date IS 'The date that this podcast was last updated.';

COMMENT ON TABLE public.podcast_line IS 'A podcast line is a line in a podcast.';
COMMENT ON COLUMN public.podcast_line.id IS 'The ID of the podcast line.';
COMMENT ON COLUMN public.podcast_line.podcast_id IS 'The ID of the podcast that this line is for.';
COMMENT ON COLUMN public.podcast_line.line_number IS 'The line number of this line in the podcast.';
COMMENT ON COLUMN public.podcast_line.speaker IS 'The speaker of this line.';
COMMENT ON COLUMN public.podcast_line.dialogue IS 'The dialogue of this line.';

-- Add indexes
CREATE INDEX podcast_line_podcast_id_idx ON public.podcast_line(podcast_id);
-- Add RLS policies
ALTER TABLE public.podcast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_line ENABLE ROW LEVEL SECURITY;


CREATE POLICY "podcast SELECT" ON public.podcast
    FOR SELECT USING (((created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));

CREATE POLICY "podcast INSERT" ON public.podcast
    FOR INSERT WITH CHECK (((created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));

CREATE POLICY "podcast UPDATE" ON public.podcast
    FOR UPDATE USING (((created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));

CREATE POLICY "podcast DELETE" ON public.podcast
    FOR DELETE USING (((created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));


-- Inherit policy from podcast table
CREATE POLICY "podcast_line SELECT"
    ON public.podcast_line
    AS PERMISSIVE
    FOR SELECT
    USING (
        podcast_id IN (
            SELECT id
            FROM public.podcast
            WHERE
                (created_by = (public.current_rsn_user_id())::text)
                OR (for_user = (public.current_rsn_user_id())::text)
                OR public.is_admin()
        )
    );

CREATE POLICY "podcast_line INSERT"
    ON public.podcast_line
    AS PERMISSIVE
    FOR INSERT
    WITH CHECK (
        podcast_id IN (
            SELECT id
            FROM public.podcast
            WHERE
                (created_by = (public.current_rsn_user_id())::text)
                OR (for_user = (public.current_rsn_user_id())::text)
                OR public.is_admin()
        )
    );

CREATE POLICY "podcast_line UPDATE"
    ON public.podcast_line
    AS PERMISSIVE
    FOR UPDATE
    USING (
        podcast_id IN (
            SELECT id
            FROM public.podcast
            WHERE
                (created_by = (public.current_rsn_user_id())::text)
                OR (for_user = (public.current_rsn_user_id())::text)
                OR public.is_admin()
        )
    );

CREATE POLICY "podcast_line DELETE"
    ON public.podcast_line
    AS PERMISSIVE
    FOR DELETE
    USING (
        podcast_id IN (
            SELECT id
            FROM public.podcast
            WHERE
                (created_by = (public.current_rsn_user_id())::text)
                OR (for_user = (public.current_rsn_user_id())::text)
                OR public.is_admin()
        )
    );


CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.podcast FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.podcast FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.podcast_line FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.podcast_line FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();