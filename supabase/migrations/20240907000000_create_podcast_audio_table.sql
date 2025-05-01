-- Create podcast_audio table
CREATE TABLE IF NOT EXISTS podcast_audio (
  id text PRIMARY KEY DEFAULT generate_typed_uuid('podaudio'::text),
  podcast_line_id TEXT NOT NULL REFERENCES podcast_line(id) ON DELETE CASCADE,
  speed NUMERIC(3,2) NOT NULL,
  audio_file TEXT NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES public.rsn_user(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES public.rsn_user(id) ON DELETE SET NULL,
  UNIQUE(podcast_line_id, speed),
  CONSTRAINT podcast_id_check CHECK (is_valid_typed_uuid('podaudio'::text, id::typed_uuid))
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_podcast_audio_podcast_line_id_speed ON podcast_audio(podcast_line_id, speed);

-- Remove audio_file column from podcast_line if it exists
ALTER TABLE podcast_line DROP COLUMN IF EXISTS audio_file;

-- Descriptions
COMMENT ON TABLE podcast_audio IS 'A podcast audio is a audio for a podcast line.';
COMMENT ON COLUMN podcast_audio.id IS 'The ID of the podcast audio.';
COMMENT ON COLUMN podcast_audio.podcast_line_id IS 'The ID of the podcast line that this audio is for.';
COMMENT ON COLUMN podcast_audio.speed IS 'The speed of the audio.';
COMMENT ON COLUMN podcast_audio.audio_file IS 'The audio file for the podcast line.';
COMMENT ON COLUMN podcast_audio.created_date IS 'The date that this podcast audio was created.';
COMMENT ON COLUMN podcast_audio.updated_date IS 'The date that this podcast audio was last updated.';
COMMENT ON COLUMN podcast_audio.created_by IS 'The user that created this podcast audio.';
COMMENT ON COLUMN podcast_audio.updated_by IS 'The user that last updated this podcast audio.';

-- Add RLS policies
ALTER TABLE podcast_audio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "podcast_audio SELECT" ON podcast_audio
    FOR SELECT USING (
        podcast_line_id IN (
            SELECT id
            FROM podcast_line
            WHERE podcast_id IN (
                SELECT id
                FROM podcast
                WHERE
                    (created_by = (public.current_rsn_user_id())::text)
                    OR (for_user = (public.current_rsn_user_id())::text)
                    OR public.is_admin()
            )
        )
    );  

CREATE POLICY "podcast_audio INSERT" ON podcast_audio
    FOR INSERT WITH CHECK (
        podcast_line_id IN (
            SELECT id
            FROM podcast_line
            WHERE podcast_id IN (
                SELECT id
                FROM podcast
                WHERE
                    (created_by = (public.current_rsn_user_id())::text)
                    OR (for_user = (public.current_rsn_user_id())::text)
                    OR public.is_admin()
            )
        )
    );

CREATE POLICY "podcast_audio UPDATE" ON podcast_audio
    FOR UPDATE USING (
        podcast_line_id IN (
            SELECT id
            FROM podcast_line
            WHERE podcast_id IN (
                SELECT id
                FROM podcast
                WHERE
                    (created_by = (public.current_rsn_user_id())::text)
                    OR (for_user = (public.current_rsn_user_id())::text)
                    OR public.is_admin()
            )
        )
    );

CREATE POLICY "podcast_audio DELETE" ON podcast_audio
    FOR DELETE USING (
        podcast_line_id IN (
            SELECT id
            FROM podcast_line
            WHERE podcast_id IN (
                SELECT id
                FROM podcast
                WHERE
                    (created_by = (public.current_rsn_user_id())::text)
                    OR (for_user = (public.current_rsn_user_id())::text)
                    OR public.is_admin()
            )
        )
    );

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON podcast_audio FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON podcast_audio FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();




-------------

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storage.objects INSERT"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "storage.objects SELECT"
    ON storage.objects
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "storage.objects UPDATE"
    ON storage.objects
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "storage.objects DELETE"
    ON storage.objects
    FOR DELETE
    USING (auth.uid() IS NOT NULL);