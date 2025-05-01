set statement_timeout = '60min';


BEGIN;

--------
-- DISABLE triggers
ALTER TABLE public.skill DISABLE TRIGGER run_tgr_apply_audit;
ALTER TABLE public.skill DISABLE TRIGGER skill__tgr_rsn_vec_queue_insert_update;

-- Create test skills and store their IDs
DO $$
DECLARE
    root_id text;
    child1_id text;
    child2_id text;
    grandchild1_id text;
BEGIN
    -- Create test skills and store their IDs
    INSERT INTO public.skill (id, _name)
    VALUES (generate_typed_uuid('skill'), 'Test Root Skill')
    RETURNING id INTO root_id;

    INSERT INTO public.skill (id, _name)
    VALUES (generate_typed_uuid('skill'), 'Test Child Skill 1')
    RETURNING id INTO child1_id;

    INSERT INTO public.skill (id, _name)
    VALUES (generate_typed_uuid('skill'), 'Test Child Skill 2')
    RETURNING id INTO child2_id;

    INSERT INTO public.skill (id, _name)
    VALUES (generate_typed_uuid('skill'), 'Test Grandchild Skill 1')
    RETURNING id INTO grandchild1_id;

    -- Create test skill links using the stored IDs
    INSERT INTO public.skill_link (id, downstream_skill, upstream_skill) VALUES
    (generate_typed_uuid('sklconn'), root_id, child1_id),
    (generate_typed_uuid('sklconn'), root_id, child2_id),
    (generate_typed_uuid('sklconn'), child1_id, grandchild1_id);

    -- Store IDs for verification
    CREATE TEMPORARY TABLE test_skill_ids (
        root_id text,
        child2_id text,
        child1_id text,
        grandchild1_id text
    );
    
    INSERT INTO test_skill_ids VALUES (root_id, child1_id, child2_id, grandchild1_id);
END $$;

-- Add root_skill_id column
ALTER TABLE public.skill
ADD COLUMN root_skill_id text REFERENCES public.skill(id) ON DELETE SET NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.skill.root_skill_id IS 'The ID of the root skill in the skill tree this skill belongs to';

-- Create trigger function to set root_skill_id to self if null
CREATE OR REPLACE FUNCTION public.tgr_skill_set_root_skill_id()
RETURNS trigger AS $$
BEGIN
    IF NEW.root_skill_id IS NULL THEN
        -- If generated_from_skill_path exists and has elements, use the first one
        IF NEW.generated_from_skill_path IS NOT NULL AND array_length(NEW.generated_from_skill_path, 1) > 0 THEN
            NEW.root_skill_id := NEW.generated_from_skill_path[1];
        ELSE
            -- Otherwise, set to self
            NEW.root_skill_id := NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -- Create trigger
CREATE TRIGGER skill_set_root_skill_id
    BEFORE INSERT OR UPDATE ON public.skill
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_skill_set_root_skill_id();

-- Add an index to improve query performance
CREATE INDEX idx_skill_root_skill_id ON public.skill(root_skill_id);

-- Create a temporary table to store root skills (skills with no upstream links)
CREATE TEMPORARY TABLE root_skills AS
    SELECT DISTINCT s.id, s._name
    FROM public.skill s
    LEFT JOIN public.skill_link sl ON s.id = sl.upstream_skill
    WHERE sl.id IS NULL;

-- For each root skill, update its descendants with the root_skill_id
DO $$
DECLARE
    root_skill_record RECORD;
BEGIN
    -- First, set each root skill's root_skill_id to itself
    UPDATE public.skill s
    SET root_skill_id = s.id
    FROM root_skills r
    WHERE s.id = r.id;

    -- Then update all descendants in a single batch operation per root skill
    FOR root_skill_record IN SELECT * FROM root_skills LOOP
        UPDATE public.skill s
        SET root_skill_id = root_skill_record.id
        WHERE s.id IN (
            SELECT skill_id 
            FROM public.get_linked_skills(NULL, root_skill_record.id, 'upstream')
            WHERE skill_id != root_skill_record.id
        );
    END LOOP;
END $$;

-- -- Clean up
DROP TABLE root_skills;

-- -- Verify test skills have correct root_skill_id values
DO $$
DECLARE
    test_root_id text;
    test_child1_id text;
    test_child2_id text;
    test_grandchild1_id text;
BEGIN
    SELECT root_id, child1_id, child2_id, grandchild1_id 
    INTO test_root_id, test_child1_id, test_child2_id, test_grandchild1_id
    FROM test_skill_ids;

    -- Verify root skill points to itself
    IF NOT EXISTS (
        SELECT 1 FROM public.skill 
        WHERE id = test_root_id 
        AND root_skill_id = test_root_id
    ) THEN
        RAISE EXCEPTION 'Test failed: Root skill should point to itself';
    END IF;

    -- Verify all children point to root
    IF NOT EXISTS (
        SELECT 1 FROM public.skill 
        WHERE id IN (test_child1_id, test_child2_id, test_grandchild1_id)
        AND root_skill_id = test_root_id
        HAVING COUNT(*) = 3
    ) THEN
        RAISE EXCEPTION 'Test failed: Child skills should point to root skill';
    END IF;

    -- Test the trigger with a new skill
    INSERT INTO public.skill (id, _name)
    VALUES (generate_typed_uuid('skill'), 'Test Trigger Skill');

    -- Verify the trigger worked
    IF NOT EXISTS (
        SELECT 1 FROM public.skill 
        WHERE _name = 'Test Trigger Skill'
        AND root_skill_id = id
    ) THEN
        RAISE EXCEPTION 'Test failed: Trigger did not set root_skill_id to self';
    END IF;

    -- If we get here, all tests passed
    RAISE NOTICE 'All root_skill_id tests passed successfully';
END $$;

-- -- Clean up test data
DELETE FROM public.skill_link 
WHERE upstream_skill IN (SELECT root_id FROM test_skill_ids)
   OR upstream_skill IN (SELECT child1_id FROM test_skill_ids)
   OR upstream_skill IN (SELECT child2_id FROM test_skill_ids)
   OR upstream_skill IN (SELECT grandchild1_id FROM test_skill_ids)
   OR downstream_skill IN (SELECT root_id FROM test_skill_ids)
   OR downstream_skill IN (SELECT child1_id FROM test_skill_ids)
   OR downstream_skill IN (SELECT child2_id FROM test_skill_ids)
   OR downstream_skill IN (SELECT grandchild1_id FROM test_skill_ids);

DELETE FROM public.skill 
WHERE id IN (
    SELECT id FROM (
        SELECT root_id as id FROM test_skill_ids
        UNION ALL
        SELECT child1_id FROM test_skill_ids
        UNION ALL
        SELECT child2_id FROM test_skill_ids
        UNION ALL
        SELECT grandchild1_id FROM test_skill_ids
    ) ids
)
OR _name = 'Test Trigger Skill';

DROP TABLE test_skill_ids; 

-- Add test for generated_from_skill_path behavior
DO $$
DECLARE
    test_root_id text;
BEGIN
    -- Create a test root skill
    INSERT INTO public.skill (id, _name)
    VALUES (generate_typed_uuid('skill'), 'Test Root For Path')
    RETURNING id INTO test_root_id;

    -- Create a skill with generated_from_skill_path
    INSERT INTO public.skill (id, _name, generated_from_skill_path)
    VALUES (generate_typed_uuid('skill'), 'Test Generated Skill', ARRAY[test_root_id]);

    -- Verify the trigger used the path
    IF NOT EXISTS (
        SELECT 1 FROM public.skill 
        WHERE _name = 'Test Generated Skill'
        AND root_skill_id = test_root_id
    ) THEN
        RAISE EXCEPTION 'Test failed: Trigger did not set root_skill_id from generated_from_skill_path';
    END IF;

    -- Clean up test skills
    DELETE FROM public.skill WHERE _name IN ('Test Root For Path', 'Test Generated Skill');
END $$; 

ALTER TABLE public.skill ENABLE TRIGGER run_tgr_apply_audit;
ALTER TABLE public.skill ENABLE TRIGGER skill__tgr_rsn_vec_queue_insert_update;

COMMIT;