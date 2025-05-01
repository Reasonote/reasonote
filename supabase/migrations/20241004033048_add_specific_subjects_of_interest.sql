-- Add specific_subjects_of_interest column to user_skill table
ALTER TABLE public.user_skill
ADD COLUMN specifics text[] DEFAULT '{}';