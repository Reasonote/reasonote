

-----------------------------------------
-- BEGIN: Immutable array to string

CREATE OR REPLACE FUNCTION immutable_array_to_string(arr anyarray, delimiter text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    str text := '';
    elem text;
BEGIN
    IF arr IS NULL THEN
        RETURN NULL;
    END IF;

    FOR i IN array_lower(arr, 1)..array_upper(arr, 1) LOOP
        elem := arr[i]::text;
        IF i = array_lower(arr, 1) THEN
            str := elem;
        ELSE
            str := str || delimiter || elem;
        END IF;
    END LOOP;
    RETURN str;
END;
$$;

-- END: Immutable array to string
-----------------------------------------




-----------------------------------------
-- BEGIN: Create goal table

CREATE TABLE public.goal (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('goal')),
    CONSTRAINT goal__id__check_prefix CHECK (public.is_valid_typed_uuid('goal', id)),
    _name text NOT NULL,
    _type text NOT NULL,
    metadata jsonb,
    due_date timestamptz,
    is_completed boolean NOT NULL DEFAULT false,
    completed_date timestamptz,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);
-- Permissions
ALTER TABLE public.goal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal DELETE" ON public.goal FOR DELETE USING (true);
CREATE POLICY "goal INSERT" ON public.goal FOR
INSERT WITH CHECK (true);
CREATE POLICY "goal SELECT" ON public.goal FOR
SELECT USING (true);
CREATE POLICY "goal UPDATE" ON public.goal FOR
UPDATE USING (true);
GRANT ALL ON TABLE public.goal TO anon;
GRANT ALL ON TABLE public.goal TO authenticated;
GRANT ALL ON TABLE public.goal TO service_role;
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.goal FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.goal FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- END: Create goal table
-----------------------------------------

-----------------------------------------
-- BEGIN: Create rsn_vec_queue table
CREATE TABLE public.rsn_vec_queue (
    id text NOT NULL PRIMARY KEY DEFAULT public.generate_typed_uuid('rsnvq'),
    goal_id text REFERENCES public.goal(id) ON DELETE CASCADE,
    page_id text REFERENCES public.rsn_page(id) ON DELETE CASCADE,
    _ref_id text NOT NULL GENERATED ALWAYS AS (COALESCE(goal_id, page_id)) STORED,
    tablename text NOT NULL GENERATED ALWAYS AS (CASE WHEN goal_id IS NOT NULL THEN 'goal' ELSE 'rsn_page' END) STORED,
    colname text NOT NULL,
    colpath text[],
    colpath_str text GENERATED ALWAYS AS (COALESCE(immutable_array_to_string(colpath, '.'), '')) STORED,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT rsn_vec_queue__ref_id__colname__colpath_str__unique UNIQUE (_ref_id, colname, colpath_str),
    CONSTRAINT rsn_vec_queue__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnvq', (id)::public.typed_uuid)),
    CONSTRAINT either_goal_or_page CHECK ((goal_id IS NOT NULL AND page_id IS NULL) OR (goal_id IS NULL AND page_id IS NOT NULL))
);

-- Permissions for rsn_vec_queue
ALTER TABLE public.rsn_vec_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsn_vec_queue DELETE" ON public.rsn_vec_queue FOR DELETE USING (true);
CREATE POLICY "rsn_vec_queue INSERT" ON public.rsn_vec_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "rsn_vec_queue SELECT" ON public.rsn_vec_queue FOR SELECT USING (true);
CREATE POLICY "rsn_vec_queue UPDATE" ON public.rsn_vec_queue FOR UPDATE USING (true);
GRANT ALL ON TABLE public.rsn_vec_queue TO anon;
GRANT ALL ON TABLE public.rsn_vec_queue TO authenticated;
GRANT ALL ON TABLE public.rsn_vec_queue TO service_role;

-- Triggers for rsn_vec_queue
CREATE TRIGGER run_tgr_apply_audit 
BEFORE INSERT OR UPDATE 
ON public.rsn_vec_queue 
FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
AFTER INSERT OR DELETE OR UPDATE 
ON public.rsn_vec_queue 
FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- Comments for rsn_vec_queue
COMMENT ON TABLE public.rsn_vec_queue IS 'A queue of rsn items to be vectorized.';

-- END: Create rsn_vec_queue table
-----------------------------------------

-----------------------------------------
-- BEGIN: Create rsn_page table
CREATE TABLE public.rsn_vec (
    id text NOT NULL PRIMARY KEY DEFAULT public.generate_typed_uuid('rsnv'),
    goal_id text REFERENCES public.goal(id) ON DELETE CASCADE,
    page_id text REFERENCES public.rsn_page(id) ON DELETE CASCADE,
    _ref_id text GENERATED ALWAYS AS (COALESCE(goal_id, page_id)) STORED,
    colname text,
    colpath text[],
    colpath_str text GENERATED ALWAYS AS (COALESCE(immutable_array_to_string(colpath, '.'), '')) STORED,
    raw_content text,
    content_offset int NOT NULL,
    embedding vector,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT rsn_vec__ref_id__colname__colpath__content_offset__unique UNIQUE (_ref_id, colname, colpath_str, content_offset),
    CONSTRAINT rsn_vec__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnv', (id)::public.typed_uuid)),
    CONSTRAINT either_goal_or_page CHECK ((goal_id IS NOT NULL AND page_id IS NULL) OR (goal_id IS NULL AND page_id IS NOT NULL))
);

-- Permissions for rsn_vec
ALTER TABLE public.rsn_vec ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsn_vec DELETE" ON public.rsn_vec FOR DELETE USING (true);
CREATE POLICY "rsn_vec INSERT" ON public.rsn_vec FOR INSERT WITH CHECK (true);
CREATE POLICY "rsn_vec SELECT" ON public.rsn_vec FOR SELECT USING (true);
CREATE POLICY "rsn_vec UPDATE" ON public.rsn_vec FOR UPDATE USING (true);
GRANT ALL ON TABLE public.rsn_vec TO anon;
GRANT ALL ON TABLE public.rsn_vec TO authenticated;
GRANT ALL ON TABLE public.rsn_vec TO service_role;

-- Triggers for rsn_vec
CREATE TRIGGER run_tgr_apply_audit 
BEFORE INSERT OR UPDATE 
ON public.rsn_vec 
FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
AFTER INSERT OR DELETE OR UPDATE 
ON public.rsn_vec 
FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

-- Comments for rsn_vec
COMMENT ON TABLE public.rsn_vec IS 'The vector for an rsn item.';

-- END: Create rsn_vec table
-----------------------------------------

-----------------------------------------
-- BEGIN: Create triggers for rsn_vec_queue

-- Trigger function for rsn_vec_queue
CREATE OR REPLACE FUNCTION public.tgr_rsn_vec_queue_insert_goal()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- UPDATE:
        -- Check if the new and old values changed.
        -- Otherwise, insert a new row into the rsn_vec_queue table, with:
        -- goal_id, colname, (and colpath when applicable)
        IF (OLD._name <> NEW._name) THEN
            INSERT INTO rsn_vec_queue (goal_id, colname) VALUES (NEW.id, '_name') ON CONFLICT DO NOTHING;
        END IF;
    ELSE
        -- INSERT:
        -- Queue up all the fields.
        INSERT INTO rsn_vec_queue (goal_id, colname) VALUES (NEW.id, '_name') ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$BODY$;


CREATE TRIGGER tgr_rsn_vec_queue_insert_goal
    AFTER INSERT OR UPDATE
    ON public.goal
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_vec_queue_insert_goal();


-- Trigger function for rsn_vec_queue

CREATE OR REPLACE FUNCTION public.tgr_rsn_vec_queue_insert_page()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- UPDATE:
        -- Check if the new and old values changed.
        -- Otherwise, insert a new row into the rsn_vec_queue table, with:
        -- goal_id, colname, (and colpath when applicable)
        IF (OLD.body <> NEW.body) THEN
            INSERT INTO rsn_vec_queue (page_id, colname) VALUES (NEW.id, 'body') ON CONFLICT DO NOTHING;
        END IF;
    ELSE
        -- INSERT:
        -- Queue up all the fields.
        INSERT INTO rsn_vec_queue (page_id, colname) VALUES (NEW.id, 'body') ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$BODY$;

CREATE TRIGGER tgr_rsn_vec_queue_insert_page
    AFTER INSERT OR UPDATE
    ON public.rsn_page
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_vec_queue_insert_page();

--
-- END: Create triggers for rsn_vec_queue
-----------------------------------------





-----------------------------------------
-- BEGIN: Create journal table

CREATE TABLE public.journal (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('journal')),
    CONSTRAINT journal__id__check_prefix CHECK (public.is_valid_typed_uuid('journal', id)),
    _name text NOT NULL,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL,
        updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE
    SET NULL
);

-- Permissions for journal
ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal DELETE" ON public.journal FOR DELETE USING (true);
CREATE POLICY "journal INSERT" ON public.journal FOR INSERT WITH CHECK (true);
CREATE POLICY "journal SELECT" ON public.journal FOR SELECT USING (true);
CREATE POLICY "journal UPDATE" ON public.journal FOR UPDATE USING (true);
GRANT ALL ON TABLE public.journal TO anon;
GRANT ALL ON TABLE public.journal TO authenticated;
GRANT ALL ON TABLE public.journal TO service_role;

-- Triggers for journal
CREATE TRIGGER run_tgr_apply_audit 
BEFORE INSERT OR UPDATE 
ON public.journal 
FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- END: Create journal table
-----------------------------------------