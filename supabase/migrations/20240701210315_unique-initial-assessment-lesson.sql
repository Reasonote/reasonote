
-- Delete duplicate lessons that are initial assessment lessons and have the same root skill id for the same user
-- This may cause some issues but it is better to have unique initial assessment lessons.
WITH ranked_lessons AS (
    SELECT
        id,
        root_skill,
        for_user,
        ROW_NUMBER() OVER (PARTITION BY root_skill, for_user ORDER BY created_date DESC) AS rn
    FROM lesson
    WHERE lesson_type = 'initial-assessment-lesson'
)
DELETE FROM lesson
WHERE id IN (
    SELECT id
    FROM ranked_lessons
    WHERE rn > 1
);

-- Lessons with the same root skill id for the same user that are initial assessment lessons should be unique
CREATE UNIQUE INDEX unique_initial_assessment_lesson 
    ON lesson (root_skill, for_user) 
    WHERE lesson_type = 'initial-assessment-lesson';