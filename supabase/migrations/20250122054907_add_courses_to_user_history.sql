-- Add course_id column
ALTER TABLE public.user_history
ADD COLUMN course_id text;

-- Add foreign key constraint
ALTER TABLE public.user_history
ADD CONSTRAINT user_history_course_id_fkey
FOREIGN KEY (course_id) REFERENCES public.course(id) ON DELETE CASCADE;

-- Add comment for the new column
COMMENT ON COLUMN public.user_history.course_id IS 'The ID of the course that was visited';

-- Drop the old XOR constraint
ALTER TABLE public.user_history
DROP CONSTRAINT user_history_xor_check;

-- Add new XOR constraint that ensures exactly one of skill_id_visited, podcast_id, or course_id is set
ALTER TABLE public.user_history
ADD CONSTRAINT user_history_xor_check CHECK (
  (
    CASE WHEN skill_id_visited IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN podcast_id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN course_id IS NOT NULL THEN 1 ELSE 0 END
  ) = 1
);

-- Add unique constraint for course visits
ALTER TABLE public.user_history
ADD CONSTRAINT user_history_unique_course_visit UNIQUE (rsn_user_id, course_id);
