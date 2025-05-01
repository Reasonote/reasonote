-- Add tags column to user_activity_feedback table
ALTER TABLE public.user_activity_feedback
ADD COLUMN _tags TEXT[] NULL DEFAULT NULL;

-- Add description for the tags column
COMMENT ON COLUMN public.user_activity_feedback._tags IS 'Array of feedback tags describing the type of feedback (e.g., "unclear_instructions", "technical_issue", etc.)';
