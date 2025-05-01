----------------------------------------------------------------------------
-- TEST SETUP
----------------------------------------------------------------------------
-- Create temporary tables for verification and logging
CREATE TEMP TABLE temp_migration_verification (
    key text PRIMARY KEY,
    value text
);

CREATE TEMP TABLE temp_migration_log (
    timestamp timestamptz DEFAULT now(),
    operation text,
    details jsonb
);

-- Create test data
DO $$
DECLARE
    v_test_lesson_id text;
    v_test_activity_id text;
    v_test_activity_2_id text;
    v_test_activity_3_id text;
    v_test_lesson_activity_id text;
BEGIN
    -- Create test activities for the stubs
    INSERT INTO activity (_name, _type)
    VALUES ('Test Activity 1', 'multiple-choice')
    RETURNING id INTO v_test_activity_id;

    INSERT INTO activity (_name, _type)
    VALUES ('Test Activity 2', 'flashcard')
    RETURNING id INTO v_test_activity_2_id;

    INSERT INTO activity (_name, _type)
    VALUES ('Test Activity 3', 'fill-in-blank')
    RETURNING id INTO v_test_activity_3_id;

    -- Create test lesson with both slides and stubs
    INSERT INTO lesson (_name, slides, activity_stubs) VALUES (
        'Migration Test Lesson',
        ('[
            {
                "id": "test_slide_1",
                "title": "Test Slide 1",
                "emoji": "1️⃣",
                "content": "Content 1"
            },
            {
                "id": "test_slide_2",
                "title": "Test Slide 2",
                "emoji": "2️⃣",
                "content": "Content 2"
            },
            {
                "id": "test_slide_3",
                "title": "Test Slide 3",
                "emoji": "3️⃣",
                "content": "Content 3"
            }
        ]')::jsonb,
        (format('[
            {
                "id": "test_stub_1",
                "type": "multiple-choice",
                "subject": "Test Subject 1",
                "metadata": {
                    "activityId": "%1$s",
                    "testData": true,
                    "order": 1
                }
            },
            {
                "id": "test_stub_2",
                "type": "multiple-choice",
                "subject": "Test Subject 2",
                "metadata": {
                    "activityId": "%1$s",
                    "testData": true,
                    "order": 2
                }
            },
            {
                "id": "test_stub_3",
                "type": "flashcard",
                "subject": "Test Subject 3",
                "metadata": {
                    "activityId": "%2$s",
                    "testData": true,
                    "order": 3
                }
            },
            {
                "id": "test_stub_4",
                "type": "fill-in-blank",
                "subject": "Test Subject 4",
                "metadata": {
                    "activityId": "%3$s",
                    "testData": true,
                    "order": 4
                }
            }
        ]', v_test_activity_id, v_test_activity_2_id, v_test_activity_3_id))::jsonb
    ) RETURNING id INTO v_test_lesson_id;

    -- Create pre-existing lesson_activity to test merging
    INSERT INTO lesson_activity (lesson, activity, metadata)
    VALUES (
        v_test_lesson_id,
        v_test_activity_id,
        '{"originalData": true}'
    ) RETURNING id INTO v_test_lesson_activity_id;

    -- Store all IDs for verification
    INSERT INTO temp_migration_verification (key, value) VALUES
        ('test_lesson_id', v_test_lesson_id),
        ('test_activity_id', v_test_activity_id),
        ('test_activity_2_id', v_test_activity_2_id),
        ('test_activity_3_id', v_test_activity_3_id),
        ('test_lesson_activity_id', v_test_lesson_activity_id);
END;
$$;

----------------------------------------------------------------------------
-- MAIN MIGRATION
----------------------------------------------------------------------------
-- Helper function for creating slide activities
CREATE OR REPLACE FUNCTION temp_create_slide_activity(
    p_slide jsonb,
    p_lesson_id text,
    p_created_by text
) RETURNS text AS $$
DECLARE
    v_activity_id text;
BEGIN
    INSERT INTO public.activity (
        _name, _type, type_config, source, created_by, updated_by
    ) VALUES (
        p_slide->>'title',
        'slide',
        jsonb_build_object(
            'type', 'slide',
            'title', p_slide->>'title',
            'version', '0.0.0',
            'titleEmoji', p_slide->>'emoji',
            'markdownContent', p_slide->>'content'
        ),
        'migration',
        p_created_by,
        p_created_by
    ) RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Main migration
DO $$
DECLARE
    v_lesson record;
    v_slide jsonb;
    v_activity_id text;
    v_position float;
    v_activity_stub jsonb;
    v_existing_lesson_activity record;
BEGIN
    -- Process each lesson
    FOR v_lesson IN 
        SELECT id, slides, activity_stubs, created_by 
        FROM lesson 
        WHERE slides IS NOT NULL OR activity_stubs IS NOT NULL
    LOOP
        -- Before processing each lesson, clear existing positions
        UPDATE lesson_activity 
        SET position = NULL 
        WHERE lesson = v_lesson.id;

        -- Validate JSON structure
        IF v_lesson.slides IS NOT NULL AND NOT jsonb_typeof(v_lesson.slides) = 'array' THEN
            INSERT INTO temp_migration_log (operation, details) 
            VALUES ('error', jsonb_build_object(
                'lesson_id', v_lesson.id,
                'error', 'Invalid slides format',
                'slides', v_lesson.slides
            ));
            CONTINUE;
        END IF;

        IF v_lesson.activity_stubs IS NOT NULL AND NOT jsonb_typeof(v_lesson.activity_stubs) = 'array' THEN
            INSERT INTO temp_migration_log (operation, details) 
            VALUES ('error', jsonb_build_object(
                'lesson_id', v_lesson.id,
                'error', 'Invalid activity_stubs format',
                'activity_stubs', v_lesson.activity_stubs
            ));
            CONTINUE;
        END IF;

        v_position := 1.0;

        -- Process slides first
        IF v_lesson.slides IS NOT NULL THEN
            FOR v_slide IN SELECT jsonb_array_elements(v_lesson.slides)
            LOOP
                -- Create activity for slide
                v_activity_id := temp_create_slide_activity(
                    v_slide,
                    v_lesson.id,
                    v_lesson.created_by
                );

                INSERT INTO temp_migration_log (operation, details) 
                VALUES ('slide_conversion', jsonb_build_object(
                    'lesson_id', v_lesson.id,
                    'slide_id', v_slide->>'id',
                    'activity_id', v_activity_id
                ));

                -- Create lesson_activity for slide
                INSERT INTO lesson_activity (
                    lesson, activity, position, created_by, updated_by, metadata
                ) VALUES (
                    v_lesson.id,
                    v_activity_id,
                    v_position,
                    v_lesson.created_by,
                    v_lesson.created_by,
                    jsonb_build_object(
                        'slide_id', v_slide->>'id',
                        'migration_date', now()
                    )
                );

                v_position := v_position + 1.0;
            END LOOP;
        END IF;

        -- Process activity stubs
        IF v_lesson.activity_stubs IS NOT NULL THEN
            FOR v_activity_stub IN 
                -- Only take the first occurrence of each activity ID
                SELECT DISTINCT ON ((value->'metadata'->>'activityId'), l.id) value
                FROM lesson l,
                jsonb_array_elements(l.activity_stubs) value
                WHERE l.id = v_lesson.id
                ORDER BY (value->'metadata'->>'activityId'), l.id, (value->'metadata'->>'order')
            LOOP
                -- Check if this stub already has a corresponding lesson_activity
                SELECT * INTO v_existing_lesson_activity 
                FROM lesson_activity la
                WHERE la.lesson = v_lesson.id 
                AND la.activity = (v_activity_stub->'metadata'->>'activityId')::text;

                IF v_existing_lesson_activity.id IS NOT NULL THEN
                    -- Update existing lesson_activity with stub metadata
                    UPDATE lesson_activity
                    SET metadata = CASE 
                        WHEN metadata ? 'originalData' THEN
                            jsonb_build_object(
                                'activity_stub_id', v_activity_stub->>'id',
                                'subject', v_activity_stub->>'subject',
                                'type', v_activity_stub->>'type',
                                'previous_metadata', metadata->'originalData',
                                'migration_date', now()
                            ) || COALESCE(metadata, '{}'::jsonb) 
                              || COALESCE(v_activity_stub->'metadata', '{}'::jsonb)
                        ELSE
                            jsonb_build_object(
                                'activity_stub_id', v_activity_stub->>'id',
                                'subject', v_activity_stub->>'subject',
                                'type', v_activity_stub->>'type',
                                'migration_date', now()
                            ) || COALESCE(v_activity_stub->'metadata', '{}'::jsonb)
                        END,
                        position = v_position
                    WHERE id = v_existing_lesson_activity.id;

                    INSERT INTO temp_migration_log (operation, details) 
                    VALUES ('stub_update', jsonb_build_object(
                        'lesson_id', v_lesson.id,
                        'stub_id', v_activity_stub->>'id',
                        'lesson_activity_id', v_existing_lesson_activity.id
                    ));
                ELSE
                    -- Create new lesson_activity for stub
                    INSERT INTO lesson_activity (
                        lesson, activity, position, created_by, updated_by, metadata
                    ) VALUES (
                        v_lesson.id,
                        (v_activity_stub->'metadata'->>'activityId')::text,
                        v_position,
                        v_lesson.created_by,
                        v_lesson.created_by,
                        jsonb_build_object(
                            'activity_stub_id', v_activity_stub->>'id',
                            'subject', v_activity_stub->>'subject',
                            'type', v_activity_stub->>'type',
                            'migration_date', now()
                        ) || COALESCE(v_activity_stub->'metadata', '{}'::jsonb)
                    );

                    INSERT INTO temp_migration_log (operation, details) 
                    VALUES ('stub_create', jsonb_build_object(
                        'lesson_id', v_lesson.id,
                        'stub_id', v_activity_stub->>'id'
                    ));
                END IF;

                v_position := v_position + 1.0;
            END LOOP;
        END IF;
    END LOOP;

    -- Replace the "Handle remaining lesson_activities" section with this:
    WITH ordered_activities AS (
        SELECT 
            id,
            lesson,
            ROW_NUMBER() OVER (
                PARTITION BY lesson 
                ORDER BY 
                    -- First order by existing position if any
                    COALESCE(position, 999999),
                    -- Then by created date as fallback
                    created_date
            )::float as new_position
        FROM lesson_activity
    )
    UPDATE lesson_activity la
    SET position = oa.new_position
    FROM ordered_activities oa
    WHERE la.id = oa.id;

    INSERT INTO temp_migration_log (operation, details)
    SELECT 'final_stats', jsonb_build_object(
        'total_lessons_processed', count(DISTINCT lesson),
        'total_activities_positioned', count(*)
    )
    FROM lesson_activity;
END;
$$;

----------------------------------------------------------------------------
-- TEST VERIFICATION
----------------------------------------------------------------------------
DO $$
DECLARE
    v_test_lesson_id text;
    v_test_activity_id text;
    v_test_activity_2_id text;
    v_test_activity_3_id text;
    v_test_lesson_activity_id text;
    v_slide_activity record;
    v_lesson_activity record;
BEGIN
    -- Get test IDs
    SELECT value INTO v_test_lesson_id FROM temp_migration_verification WHERE key = 'test_lesson_id';
    SELECT value INTO v_test_activity_id FROM temp_migration_verification WHERE key = 'test_activity_id';
    SELECT value INTO v_test_activity_2_id FROM temp_migration_verification WHERE key = 'test_activity_2_id';
    SELECT value INTO v_test_activity_3_id FROM temp_migration_verification WHERE key = 'test_activity_3_id';
    SELECT value INTO v_test_lesson_activity_id FROM temp_migration_verification WHERE key = 'test_lesson_activity_id';

    -- Verify slide was converted to activity
    SELECT * INTO v_slide_activity 
    FROM lesson_activity la
    JOIN activity a ON a.id = la.activity
    WHERE la.lesson = v_test_lesson_id 
    AND a._type = 'slide';

    IF v_slide_activity IS NULL THEN
        RAISE EXCEPTION 'Migration verification failed: Slide was not converted to activity';
    END IF;

    IF v_slide_activity.metadata->>'slide_id' != 'test_slide_1' THEN
        RAISE EXCEPTION 'Migration verification failed: Slide metadata not preserved';
    END IF;

    -- Verify activity stub was processed
    SELECT * INTO v_lesson_activity
    FROM lesson_activity
    WHERE id = v_test_lesson_activity_id;

    IF v_lesson_activity.metadata->>'activity_stub_id' != 'test_stub_1' 
    OR v_lesson_activity.metadata->>'originalData' != 'true'
    OR v_lesson_activity.metadata->>'testData' != 'true' THEN
        RAISE EXCEPTION 'Migration verification failed: Activity stub metadata not merged correctly';
    END IF;

    -- Verify ordering
    IF v_slide_activity.position >= v_lesson_activity.position THEN
        RAISE EXCEPTION 'Migration verification failed: Slide activity should come before stub activity';
    END IF;

    -- Additional verifications
    -- Verify all lesson_activities have positions
    IF EXISTS (
        SELECT 1 FROM lesson_activity WHERE position IS NULL
    ) THEN
        RAISE EXCEPTION 'Migration verification failed: Some lesson_activities still have null positions';
    END IF;

    -- Verify no duplicate positions within same lesson
    IF EXISTS (
        SELECT position, count(*)
        FROM lesson_activity
        GROUP BY lesson, position
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Migration verification failed: Duplicate positions found within a lesson';
    END IF;

    -- Verify positions are consecutive integers starting from 1
    IF EXISTS (
        WITH position_check AS (
            SELECT 
                position,
                ROW_NUMBER() OVER (ORDER BY position) as expected_position
            FROM lesson_activity
            WHERE lesson = v_test_lesson_id
        )
        SELECT 1
        FROM position_check
        WHERE position != expected_position::float
    ) THEN
        RAISE EXCEPTION 'Migration verification failed: Positions should be consecutive integers starting from 1. Positions: %', (
            SELECT string_agg(position::text, ', ' ORDER BY position)
            FROM lesson_activity
            WHERE lesson = v_test_lesson_id
        );
    END IF;

    -- Log successful verification
    INSERT INTO temp_migration_log (operation, details)
    VALUES ('verification_complete', jsonb_build_object(
        'status', 'success',
        'timestamp', now()
    ));
END;
$$;

----------------------------------------------------------------------------
-- CLEANUP
----------------------------------------------------------------------------
-- Clean up test data
DO $$
DECLARE
    v_test_lesson_id text;
    v_slide_activity record;
BEGIN
    SELECT value INTO v_test_lesson_id FROM temp_migration_verification WHERE key = 'test_lesson_id';
    
    -- Get slide activity ID before deletion
    SELECT la.* INTO v_slide_activity 
    FROM lesson_activity la
    JOIN activity a ON a.id = la.activity
    WHERE la.lesson = v_test_lesson_id 
    AND a._type = 'slide';

    -- Delete in correct order
    DELETE FROM lesson_activity WHERE lesson = v_test_lesson_id;
    DELETE FROM activity WHERE id IN (
        SELECT value FROM temp_migration_verification WHERE key = 'test_activity_id'
        UNION
        SELECT activity FROM lesson_activity WHERE id = v_slide_activity.id
    );
    DELETE FROM lesson WHERE id = v_test_lesson_id;
END;
$$;

-- Drop temporary objects
DROP FUNCTION temp_create_slide_activity(jsonb, text, text);
DROP TABLE temp_migration_verification;
DROP TABLE temp_migration_log;

-- Make position required and add documentation
ALTER TABLE public.lesson_activity
ALTER COLUMN position SET NOT NULL;


--
-- Name: lesson lesson DELETE; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY "lesson DELETE" ON public.lesson;
DROP POLICY "lesson INSERT" ON public.lesson;
DROP POLICY "lesson SELECT" ON public.lesson;
DROP POLICY "lesson UPDATE" ON public.lesson;

-- Cleanup view
DROP VIEW public.vw_lesson_memauth;
CREATE VIEW public.vw_lesson_memauth AS
 SELECT ma.id AS memauth_id,
    ma.principal_id,
    ma.principal_type,
    ma.resource_entity_id AS lesson_id,
    ma.access_level,
    array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions,
    ma.is_public
   FROM ((public.memauth ma
     JOIN public.access_level_permission alp ON ((((alp.entity_type)::text = 'lesson'::text) AND (upper((alp.access_level)::text) = upper((ma.access_level)::text)))))
   )
   WHERE ma.resource_entity_type = 'lesson'
  GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.access_level, ma.is_public;


CREATE POLICY "lesson DELETE" ON public.lesson FOR DELETE USING (((EXISTS ( SELECT 1
   FROM public.vw_lesson_memauth vwm
  WHERE ((vwm.lesson_id = lesson.id) AND ((vwm.principal_id = (public.current_rsn_user_id())::text) OR (vwm.is_public = true)) AND ('lesson.DELETE'::text = ANY ((vwm.permissions)::text[]))))) OR (created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));

CREATE POLICY "lesson INSERT" ON public.lesson FOR INSERT WITH CHECK (((created_by = (public.current_rsn_user_id())::text) OR public.is_admin()));


CREATE POLICY "lesson SELECT" ON public.lesson FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.vw_lesson_memauth vwm
  WHERE ((vwm.lesson_id = lesson.id) AND ((vwm.principal_id = (public.current_rsn_user_id())::text) OR (vwm.is_public = true)) AND ('lesson.SELECT'::text = ANY ((vwm.permissions)::text[]))))) OR (created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));

CREATE POLICY "lesson UPDATE" ON public.lesson FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.vw_lesson_memauth vwm
  WHERE ((vwm.lesson_id = lesson.id) AND ((vwm.principal_id = (public.current_rsn_user_id())::text) OR (vwm.is_public = true)) AND ('lesson.UPDATE'::text = ANY ((vwm.permissions)::text[]))))) OR (created_by = (public.current_rsn_user_id())::text) OR (for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));




-- Remove activity_stubs and slides from lesson
ALTER TABLE public.lesson DROP CONSTRAINT activity_stubs_is_correct_shape;
ALTER TABLE public.lesson DROP COLUMN activity_stubs;
ALTER TABLE public.lesson DROP COLUMN slides;

COMMENT ON COLUMN lesson_activity.position IS 
'The position of this activity within the lesson.';