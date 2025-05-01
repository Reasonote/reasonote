
CREATE TABLE public.chapter (
    id text DEFAULT public.generate_typed_uuid('chapter'::text) NOT NULL,
    icon text,
    _name text NOT NULL,
    _summary text,
    for_user text REFERENCES public.rsn_user(id),
    metadata jsonb,
    root_skill text NOT NULL REFERENCES public.skill(id),
    root_skill_order integer,
    root_skill_path text[],
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT chapter_id_check CHECK (public.is_valid_typed_uuid('chapter'::text, (id)::public.typed_uuid))
);


ALTER TABLE public.chapter OWNER TO postgres;

COMMENT ON TABLE public.chapter IS 'A chapter is a group of skills, activities, and configuration for a specific learning goal..';
COMMENT ON COLUMN public.chapter.id IS 'The unique identifier for the chapter.';
COMMENT ON COLUMN public.chapter._name IS 'The name of the chapter.';
COMMENT ON COLUMN public.chapter._summary IS 'The summary of the chapter.';
COMMENT ON COLUMN public.chapter.metadata IS 'The metadata for the chapter.';
COMMENT ON COLUMN public.chapter.created_date IS 'The date that this chapter was created.';
COMMENT ON COLUMN public.chapter.updated_date IS 'The date that this chapter was last updated.';
COMMENT ON COLUMN public.chapter.created_by IS 'The user that created this chapter.';
COMMENT ON COLUMN public.chapter.updated_by IS 'The user that last updated this chapter.';


--
-- Name: chapter chapter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapter
    ADD CONSTRAINT chapter_pkey PRIMARY KEY (id);


--
-- Name: chapter log_operation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.chapter FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

--
-- Name: chapter run_tgr_apply_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.chapter FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


ALTER TABLE public.chapter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapter DELETE" ON public.chapter FOR DELETE USING (current_rsn_user_id() = created_by OR current_rsn_user_id() = for_user);
CREATE POLICY "chapter INSERT" ON public.chapter FOR INSERT WITH CHECK (current_rsn_user_id() = created_by OR current_rsn_user_id() = for_user);
CREATE POLICY "chapter SELECT" ON public.chapter FOR SELECT USING (current_rsn_user_id() = created_by OR current_rsn_user_id() = for_user);
CREATE POLICY "chapter UPDATE" ON public.chapter FOR UPDATE USING (current_rsn_user_id() = created_by OR current_rsn_user_id() = for_user);


GRANT ALL ON TABLE public.chapter TO anon;
GRANT ALL ON TABLE public.chapter TO authenticated;
GRANT ALL ON TABLE public.chapter TO service_role;


CREATE OR REPLACE FUNCTION public.update_chapter_root_skill_order(chapter_id text, target_order integer) RETURNS void AS $$
DECLARE
    current_order integer;
    current_root_skill text;
BEGIN
    -- Retrieve current order and root_skill for the chapter
    SELECT root_skill, root_skill_order INTO current_root_skill, current_order
    FROM public.chapter
    WHERE id = chapter_id;

    -- Check if the chapter is part of a root_skill
    IF current_root_skill IS NULL THEN
        RAISE EXCEPTION 'chapter is not associated with a root_skill';
    END IF;

    -- Shift other chapters if necessary
    -- NOTE: We assume that root_skills are "dense", i.e., there are no gaps in the order numbers
    -- If there are gaps, the logic will be somewhat superfluous.
    IF target_order < current_order THEN
        -- Moving the chapter up in the order
        UPDATE public.chapter
        SET root_skill_order = root_skill_order + 1
        WHERE root_skill = current_root_skill AND
              root_skill_order >= target_order AND
              root_skill_order < current_order;
    ELSIF target_order > current_order THEN
        -- Moving the chapter down in the order
        UPDATE public.chapter
        SET root_skill_order = root_skill_order - 1
        WHERE root_skill = current_root_skill AND
              root_skill_order <= target_order AND
              root_skill_order > current_order;
    END IF;

    -- Update the order for the target chapter
    UPDATE public.chapter
        SET root_skill_order = target_order
        WHERE id = chapter_id;
END;
$$ LANGUAGE plpgsql;




----------------


ALTER TABLE public.lesson ADD COLUMN chapter text REFERENCES public.chapter(id) ON DELETE SET NULL;
ALTER TABLE public.lesson ADD COLUMN chapter_order integer;
ALTER TABLE public.lesson ADD CONSTRAINT lesson_chapter_order_unique UNIQUE (chapter, chapter_order);


-- Function to move a lesson up or down in the chapter
CREATE OR REPLACE FUNCTION public.update_lesson_chapter_order(lesson_id text, target_order integer) RETURNS void AS $$
DECLARE
    current_order integer;
    current_chapter text;
BEGIN
    -- Retrieve current order and chapter for the lesson
    SELECT chapter, chapter_order INTO current_chapter, current_order
    FROM public.lesson
    WHERE id = lesson_id;

    -- Check if the lesson is part of a chapter
    IF current_chapter IS NULL THEN
        RAISE EXCEPTION 'Lesson is not associated with a chapter';
    END IF;

    -- Shift other lessons if necessary
    -- NOTE: We assume that chapters are "dense", i.e., there are no gaps in the order numbers
    -- If there are gaps, the logic will be somewhat superfluous.
    IF target_order < current_order THEN
        -- Moving the lesson up in the order
        UPDATE public.lesson
        SET chapter_order = chapter_order + 1
        WHERE chapter = current_chapter AND
              chapter_order >= target_order AND
              chapter_order < current_order;
    ELSIF target_order > current_order THEN
        -- Moving the lesson down in the order
        UPDATE public.lesson
        SET chapter_order = chapter_order - 1
        WHERE chapter = current_chapter AND
              chapter_order <= target_order AND
              chapter_order > current_order;
    END IF;

    -- Update the order for the target lesson
    UPDATE public.lesson
        SET chapter_order = target_order
        WHERE id = lesson_id;
END;
$$ LANGUAGE plpgsql;


ALTER TABLE public.user_skill ADD COLUMN current_chapter text REFERENCES public.chapter(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.user_skill.current_chapter IS 'The chapter that the user is currently working on for this skill.';