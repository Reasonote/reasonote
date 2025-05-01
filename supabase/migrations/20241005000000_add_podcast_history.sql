-- Add podcast_id column to user_history table
ALTER TABLE public.user_history
ADD COLUMN podcast_id text;

-- Add foreign key constraint
ALTER TABLE public.user_history
ADD CONSTRAINT user_history_podcast_id_fkey
FOREIGN KEY (podcast_id) REFERENCES public.podcast(id) ON DELETE CASCADE;

-- Drop the existing unique constraint
ALTER TABLE public.user_history
DROP CONSTRAINT IF EXISTS user_history_unique_visit;

-- Add new unique constraints
ALTER TABLE public.user_history
ADD CONSTRAINT user_history_unique_skill_visit 
UNIQUE (rsn_user_id, skill_id_visited);

ALTER TABLE public.user_history
ADD CONSTRAINT user_history_unique_podcast_visit 
UNIQUE (rsn_user_id, podcast_id);

-- Add a more elegant check constraint to ensure exactly one of skill_id_visited or podcast_id is set
ALTER TABLE public.user_history
ADD CONSTRAINT user_history_xor_check
CHECK (
  (CASE WHEN skill_id_visited IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN podcast_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Update the comment on the table
COMMENT ON TABLE public.user_history IS 'Table to store user visit history for skills and podcasts. Users can insert, select, update, and delete their own records.';

-- Add comment on the new column
COMMENT ON COLUMN public.user_history.podcast_id IS 'The ID of the podcast that was visited';