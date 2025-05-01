-- Add practice_score column to user_skill_sysdata table
ALTER TABLE public.user_skill_sysdata 
ADD COLUMN practice_score integer DEFAULT 0 NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.user_skill_sysdata.practice_score IS 'Stores the user''s practice score (0-100) for a specific skill';
