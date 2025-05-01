----------------------------------------------------------------------------
-- Add indices to improve query performance across core tables
----------------------------------------------------------------------------

-- Add index on the underlying memauth table for lesson-specific queries
CREATE INDEX IF NOT EXISTS idx_memauth_lesson
ON public.memauth (resource_entity_id, resource_entity_type, principal_id)
WHERE resource_entity_type = 'lesson';

-- Add index to help with permission lookups
CREATE INDEX IF NOT EXISTS idx_access_level_permission_lesson
ON public.access_level_permission (entity_type, access_level, permission_code)
WHERE entity_type = 'lesson';

-- Add index for the lesson table creator lookups
CREATE INDEX IF NOT EXISTS idx_lesson_created_by
ON public.lesson (created_by);

-- Add index for the lesson table for_user lookups
CREATE INDEX IF NOT EXISTS idx_lesson_for_user
ON public.lesson (for_user);

-- Activity table indices
CREATE INDEX IF NOT EXISTS idx_activity_created_by 
ON public.activity (created_by);

CREATE INDEX IF NOT EXISTS idx_activity_generated_for_user 
ON public.activity (generated_for_user);

-- Lesson Activity table indices
CREATE INDEX IF NOT EXISTS idx_lesson_activity_lesson 
ON public.lesson_activity (lesson);

CREATE INDEX IF NOT EXISTS idx_lesson_activity_activity 
ON public.lesson_activity (activity);

CREATE INDEX IF NOT EXISTS idx_lesson_activity_created_by 
ON public.lesson_activity (created_by);

-- User Activity Result indices
CREATE INDEX IF NOT EXISTS idx_user_activity_result_activity 
ON public.user_activity_result (activity);

CREATE INDEX IF NOT EXISTS idx_user_activity_result_user 
ON public.user_activity_result (_user);

CREATE INDEX IF NOT EXISTS idx_user_activity_result_lesson_session 
ON public.user_activity_result (lesson_session_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_result_created_by 
ON public.user_activity_result ((created_by::text));

-- Create a partial index for non-skipped activities
CREATE INDEX IF NOT EXISTS idx_user_activity_result_not_skipped 
ON public.user_activity_result (activity, _user) 
WHERE skipped = false;

-- Create index for score queries
CREATE INDEX IF NOT EXISTS idx_user_activity_result_score 
ON public.user_activity_result (activity, score);

-- Memauth table indices (in addition to existing ones)
CREATE INDEX IF NOT EXISTS idx_memauth_principal_user 
ON public.memauth (principal_user_id) 
WHERE principal_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memauth_principal_bot 
ON public.memauth (principal_bot_id) 
WHERE principal_bot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memauth_principal_group 
ON public.memauth (principal_group_id) 
WHERE principal_group_id IS NOT NULL;

-- Create index for public resource lookups
CREATE INDEX IF NOT EXISTS idx_memauth_public_resources 
ON public.memauth (resource_entity_type, resource_entity_id) 
WHERE is_public = true;

-- Lesson table indices (in addition to existing ones)
CREATE INDEX IF NOT EXISTS idx_lesson_root_skill 
ON public.lesson (root_skill);

CREATE INDEX IF NOT EXISTS idx_lesson_chapter 
ON public.lesson (chapter);

-- Create partial index for initial assessment lessons
CREATE INDEX IF NOT EXISTS idx_lesson_initial_assessment 
ON public.lesson (root_skill, for_user) 
WHERE lesson_type = 'initial-assessment-lesson'; 



----------------------------------------------------------------------------
-- Add id indices to improve query performance across core tables
----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_lesson_id ON public.lesson (id);
CREATE INDEX IF NOT EXISTS idx_activity_id ON public.activity (id);
CREATE INDEX IF NOT EXISTS idx_user_activity_result_id ON public.user_activity_result (id);
CREATE INDEX IF NOT EXISTS idx_memauth_id ON public.memauth (id);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_id ON public.lesson_activity (id);


CREATE INDEX IF NOT EXISTS idx_memauth_activity_principal_public
ON memauth (resource_entity_type, resource_entity_id, principal_id, is_public);

CREATE INDEX IF NOT EXISTS idx_alp_activity_access
ON access_level_permission (entity_type, (upper(access_level)));


CREATE INDEX IF NOT EXISTS idx_alp_activity_access_no_upper
ON access_level_permission (entity_type, access_level);
