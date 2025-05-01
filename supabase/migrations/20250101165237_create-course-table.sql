-- Create course table
CREATE TABLE public.course (
    id text NOT NULL DEFAULT 'course_'::text || gen_random_uuid()::text,
    _name text NOT NULL,
    _description text,
    for_user text REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    root_skill text REFERENCES public.skill(id) ON DELETE CASCADE,
    created_date timestamp with time zone NOT NULL DEFAULT now(),
    updated_date timestamp with time zone NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT course_pkey PRIMARY KEY (id),
    CONSTRAINT course_id_check CHECK (id LIKE 'course_%')
);

-- Create course_lesson link table
CREATE TABLE public.course_lesson (
    id text NOT NULL DEFAULT 'crslsn_'::text || gen_random_uuid()::text,
    course text NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
    lesson text NOT NULL REFERENCES public.lesson(id) ON DELETE CASCADE,
    order_index integer NOT NULL DEFAULT 0,
    created_date timestamp with time zone NOT NULL DEFAULT now(),
    updated_date timestamp with time zone NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT course_lesson_pkey PRIMARY KEY (id),
    CONSTRAINT course_lesson_id_check CHECK (id LIKE 'crslsn_%'),
    CONSTRAINT unique_course_lesson UNIQUE (course, lesson)
);

-- Create partial unique index for non-negative order indices
CREATE UNIQUE INDEX unique_course_order ON course_lesson (course, order_index)
WHERE order_index >= 0;

-- Modify the resource table to add course relationship
ALTER TABLE public.resource
    ADD COLUMN parent_course_id text REFERENCES public.course(id) ON DELETE SET NULL;

-- Update resource parent exclusive constraint
ALTER TABLE public.resource 
    DROP CONSTRAINT resource_parent_exclusive;

ALTER TABLE public.resource
    ADD CONSTRAINT resource_parent_exclusive CHECK ((
    CASE
        WHEN parent_skill_id IS NOT NULL THEN 1
        ELSE 0
    END +
    CASE
        WHEN parent_podcast_id IS NOT NULL THEN 1
        ELSE 0
    END +
    CASE
        WHEN parent_course_id IS NOT NULL THEN 1
        ELSE 0
    END) <= 1);

-- Add index for better query performance
CREATE INDEX resource_parent_course_idx ON public.resource(parent_course_id);

-- Add column comment
COMMENT ON COLUMN public.resource.parent_course_id IS 'The course that this resource is associated with, if any.';

-- Create indexes for better query performance
CREATE INDEX course_for_user_idx ON public.course(for_user);
CREATE INDEX course_lesson_course_idx ON public.course_lesson(course);
CREATE INDEX course_lesson_lesson_idx ON public.course_lesson(lesson);
CREATE INDEX course_lesson_order_idx ON public.course_lesson(course, order_index);
CREATE INDEX course_root_skill_idx ON public.course(root_skill);
CREATE INDEX course_created_by_idx ON public.course(created_by);
CREATE INDEX course_lesson_created_by_idx ON public.course_lesson(created_by);

-- Enable Row Level Security
ALTER TABLE public.course ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson ENABLE ROW LEVEL SECURITY;

-- Course RLS Policies
CREATE POLICY "course SELECT" ON public.course
    FOR SELECT USING (
        for_user = current_rsn_user_id()::text
        OR created_by = current_rsn_user_id()::text
        OR is_admin()
    );

CREATE POLICY "course INSERT" ON public.course
    FOR INSERT WITH CHECK (
        created_by = current_rsn_user_id()::text
        OR is_admin()
    );

CREATE POLICY "course UPDATE" ON public.course
    FOR UPDATE USING (
        created_by = current_rsn_user_id()::text
        OR for_user = current_rsn_user_id()::text
        OR is_admin()
    );

CREATE POLICY "course DELETE" ON public.course
    FOR DELETE USING (
        created_by = current_rsn_user_id()::text
        OR for_user = current_rsn_user_id()::text
        OR is_admin()
    );

-- Course Lesson RLS Policies
CREATE POLICY "course_lesson SELECT" ON public.course_lesson
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.course c
            WHERE c.id = course_lesson.course
            AND (
                c.for_user = current_rsn_user_id()::text
                OR c.created_by = current_rsn_user_id()::text
                OR is_admin()
            )
        )
    );

CREATE POLICY "course_lesson INSERT" ON public.course_lesson
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.course c
            WHERE c.id = course_lesson.course
            AND (
                c.created_by = current_rsn_user_id()::text
                OR is_admin()
            )
        )
    );

CREATE POLICY "course_lesson UPDATE" ON public.course_lesson
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.course c
            WHERE c.id = course_lesson.course
            AND (
                c.created_by = current_rsn_user_id()::text
                OR is_admin()
            )
        )
    );

CREATE POLICY "course_lesson DELETE" ON public.course_lesson
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.course c
            WHERE c.id = course_lesson.course
            AND (
                c.created_by = current_rsn_user_id()::text
                OR is_admin()
            )
        )
    );

-- Add triggers for audit trail
CREATE TRIGGER log_course_operation
    AFTER INSERT OR DELETE OR UPDATE ON public.course
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_log_operation();

CREATE TRIGGER log_course_lesson_operation
    AFTER INSERT OR DELETE OR UPDATE ON public.course_lesson
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_log_operation();

CREATE TRIGGER run_course_tgr_apply_audit
    BEFORE INSERT OR UPDATE ON public.course
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER run_course_lesson_tgr_apply_audit
    BEFORE INSERT OR UPDATE ON public.course_lesson
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_apply_audit();

-- Grant permissions
GRANT ALL ON TABLE public.course TO anon;
GRANT ALL ON TABLE public.course TO authenticated;
GRANT ALL ON TABLE public.course TO service_role;

GRANT ALL ON TABLE public.course_lesson TO anon;
GRANT ALL ON TABLE public.course_lesson TO authenticated;
GRANT ALL ON TABLE public.course_lesson TO service_role;

-- Add table comments
COMMENT ON TABLE public.course IS 'A course containing ordered lessons and a skill tree';
COMMENT ON COLUMN public.course.id IS 'The unique identifier for the course';
COMMENT ON COLUMN public.course._name IS 'The name of the course';
COMMENT ON COLUMN public.course._description IS 'The description of the course';
COMMENT ON COLUMN public.course.for_user IS 'The user this course is for';
COMMENT ON COLUMN public.course.root_skill IS 'The root skill of the course skill tree';
COMMENT ON COLUMN public.course.created_date IS 'The date this course was created';
COMMENT ON COLUMN public.course.updated_date IS 'The date this course was last updated';
COMMENT ON COLUMN public.course.created_by IS 'The user that created this course';
COMMENT ON COLUMN public.course.updated_by IS 'The user that last updated this course';

COMMENT ON TABLE public.course_lesson IS 'Links courses to their lessons with ordering information';
COMMENT ON COLUMN public.course_lesson.id IS 'The unique identifier for the course lesson link';
COMMENT ON COLUMN public.course_lesson.course IS 'Reference to the course';
COMMENT ON COLUMN public.course_lesson.lesson IS 'Reference to the lesson';
COMMENT ON COLUMN public.course_lesson.order_index IS 'The order of the lesson within the course';
COMMENT ON COLUMN public.course_lesson.created_date IS 'The date this link was created';
COMMENT ON COLUMN public.course_lesson.updated_date IS 'The date this link was last updated';
COMMENT ON COLUMN public.course_lesson.created_by IS 'The user that created this link';
COMMENT ON COLUMN public.course_lesson.updated_by IS 'The user that last updated this link';

-- Add this trigger function
create or replace function update_course_updated_date()
returns trigger as $$
begin
    -- For INSERT and UPDATE, use NEW
    if (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') then
        update course
        set updated_date = now()
        where id = NEW.course;
        return NEW;
    -- For DELETE, use OLD since NEW is null
    elsif (TG_OP = 'DELETE') then
        update course
        set updated_date = now()
        where id = OLD.course;
        return OLD;
    end if;
    return NULL;
end;
$$ language plpgsql;

-- Create trigger on course_lesson table
create trigger course_lesson_update_course_date
    after insert or update or delete
    on course_lesson
    for each row
    execute function update_course_updated_date();
