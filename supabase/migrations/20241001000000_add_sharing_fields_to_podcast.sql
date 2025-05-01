-- Step 1: Add the column allowing NULL initially
ALTER TABLE public.podcast
ADD COLUMN is_shared_version BOOLEAN DEFAULT FALSE,
ADD COLUMN original_podcast_id TEXT;

-- Step 2: Update existing rows
UPDATE public.podcast
SET is_shared_version = FALSE
WHERE is_shared_version IS NULL;

-- Step 3: Alter the column to be NOT NULL
ALTER TABLE public.podcast
ALTER COLUMN is_shared_version SET NOT NULL;

-- Add a foreign key constraint
ALTER TABLE public.podcast
ADD CONSTRAINT fk_original_podcast
FOREIGN KEY (original_podcast_id)
REFERENCES public.podcast(id);

-- Update RLS policies to allow read access for shared podcasts
CREATE POLICY "Allow read access to shared podcasts" ON public.podcast
FOR SELECT
USING (is_shared_version = TRUE);

-- Update existing policies to include the new condition
ALTER POLICY "podcast SELECT" ON public.podcast
USING (
  (created_by = (public.current_rsn_user_id())::text) OR 
  (for_user = (public.current_rsn_user_id())::text) OR 
  public.is_admin() OR
  (is_shared_version = TRUE)
);

-- Update the function to clone a podcast, its lines, and corresponding audio
CREATE OR REPLACE FUNCTION clone_podcast(orig_pod_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_podcast_id TEXT;
BEGIN
  -- Clone the podcast
  INSERT INTO public.podcast (
    for_skill, for_user, title, topic, podcast_type, 
    transcript, metadata, special_instructions, outline,
    is_shared_version, original_podcast_id
  )
  SELECT 
    p.for_skill, p.for_user, p.title, p.topic, p.podcast_type, 
    p.transcript, p.metadata, p.special_instructions, p.outline,
    TRUE, p.id
  FROM public.podcast p
  WHERE p.id = orig_pod_id
  RETURNING id INTO new_podcast_id;

  -- Clone the podcast lines and their corresponding audio
  WITH new_lines AS (
    INSERT INTO public.podcast_line (
      podcast_id, speaker, dialogue, dig_deeper_topics, line_number
    )
    SELECT 
      new_podcast_id, speaker, dialogue, dig_deeper_topics, line_number
    FROM public.podcast_line
    WHERE podcast_id = orig_pod_id
    RETURNING id, line_number
  )
  INSERT INTO public.podcast_audio (
    podcast_line_id, speed, audio_file
  )
  SELECT 
    nl.id, pa.speed, pa.audio_file
  FROM public.podcast_audio pa
  JOIN public.podcast_line pl ON pa.podcast_line_id = pl.id
  JOIN new_lines nl ON pl.line_number = nl.line_number
  WHERE pl.podcast_id = orig_pod_id;

  RETURN new_podcast_id;
END;
$$;

-- Update RLS policies for podcast_line
ALTER POLICY "podcast_line SELECT" ON public.podcast_line
USING (
  podcast_id IN (
    SELECT id FROM public.podcast
    WHERE (created_by = (public.current_rsn_user_id())::text) OR 
          (for_user = (public.current_rsn_user_id())::text) OR 
          public.is_admin() OR
          (is_shared_version = TRUE)
  )
);

ALTER POLICY "podcast_line INSERT" ON public.podcast_line
WITH CHECK (
  podcast_id IN (
    SELECT id FROM public.podcast
    WHERE (created_by = (public.current_rsn_user_id())::text) OR 
          (for_user = (public.current_rsn_user_id())::text) OR 
          public.is_admin()
  )
);

ALTER POLICY "podcast_line UPDATE" ON public.podcast_line
USING (
  podcast_id IN (
    SELECT id FROM public.podcast
    WHERE (created_by = (public.current_rsn_user_id())::text) OR 
          (for_user = (public.current_rsn_user_id())::text) OR 
          public.is_admin()
  )
);

ALTER POLICY "podcast_line DELETE" ON public.podcast_line
USING (
  podcast_id IN (
    SELECT id FROM public.podcast
    WHERE (created_by = (public.current_rsn_user_id())::text) OR 
          (for_user = (public.current_rsn_user_id())::text) OR 
          public.is_admin()
  )
);

-- Update RLS policies for podcast_audio
ALTER POLICY "podcast_audio SELECT" ON public.podcast_audio
USING (
  podcast_line_id IN (
    SELECT id FROM public.podcast_line
    WHERE podcast_id IN (
      SELECT id FROM public.podcast
      WHERE (created_by = (public.current_rsn_user_id())::text) OR 
            (for_user = (public.current_rsn_user_id())::text) OR 
            public.is_admin() OR
            (is_shared_version = TRUE)
    )
  )
);

ALTER POLICY "podcast_audio INSERT" ON public.podcast_audio
WITH CHECK (
  podcast_line_id IN (
    SELECT id FROM public.podcast_line
    WHERE podcast_id IN (
      SELECT id FROM public.podcast
      WHERE (created_by = (public.current_rsn_user_id())::text) OR 
            (for_user = (public.current_rsn_user_id())::text) OR 
            public.is_admin()
    )
  )
);

ALTER POLICY "podcast_audio UPDATE" ON public.podcast_audio
USING (
  podcast_line_id IN (
    SELECT id FROM public.podcast_line
    WHERE podcast_id IN (
      SELECT id FROM public.podcast
      WHERE (created_by = (public.current_rsn_user_id())::text) OR 
            (for_user = (public.current_rsn_user_id())::text) OR 
            public.is_admin()
    )
  )
);

ALTER POLICY "podcast_audio DELETE" ON public.podcast_audio
USING (
  podcast_line_id IN (
    SELECT id FROM public.podcast_line
    WHERE podcast_id IN (
      SELECT id FROM public.podcast
      WHERE (created_by = (public.current_rsn_user_id())::text) OR 
            (for_user = (public.current_rsn_user_id())::text) OR 
            public.is_admin()
    )
  )
);


-- Update podcast_audio to add the `podcast_id/` prefix to the audio file, based on the podcast_line_id
UPDATE public.podcast_audio pa
  SET audio_file = CONCAT(pl.podcast_id, '/', pa.audio_file)
  FROM public.podcast_line pl
  WHERE pa.podcast_line_id = pl.id;