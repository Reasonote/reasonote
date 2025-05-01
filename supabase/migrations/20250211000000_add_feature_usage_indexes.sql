-- Add indexes for feature usage queries
CREATE INDEX IF NOT EXISTS idx_user_lesson_result_user_date 
ON public.user_lesson_result (_user, created_date);

CREATE INDEX IF NOT EXISTS idx_podcast_creator_date 
ON public.podcast (created_by, created_date);

CREATE INDEX IF NOT EXISTS idx_user_activity_result_user_date 
ON public.user_activity_result (_user, created_date);

-- Add index for license lookups
CREATE INDEX IF NOT EXISTS idx_rsn_user_sysdata_auth_id 
ON public.rsn_user_sysdata (auth_id); 