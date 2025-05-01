---------------------------------------------------------------------
-- Part 1: Remove old work on rsn_vec_queue
ALTER TABLE public.rsn_vec_queue DROP COLUMN tablename;
ALTER TABLE public.rsn_vec_queue DROP CONSTRAINT either_goal_or_page;
ALTER TABLE public.rsn_vec_queue DROP CONSTRAINT rsn_vec_queue__ref_id__colname__colpath_str__unique;
ALTER TABLE public.rsn_vec_queue DROP COLUMN _ref_id;
ALTER TABLE public.rsn_vec_queue DROP COLUMN goal_id;
ALTER TABLE public.rsn_vec_queue DROP COLUMN page_id;
DROP TRIGGER tgr_rsn_vec_queue_insert_goal ON public.goal;
DROP TRIGGER tgr_rsn_vec_queue_insert_page ON public.rsn_page;
DROP FUNCTION public.tgr_rsn_vec_queue_insert_goal();
DROP FUNCTION public.tgr_rsn_vec_queue_insert_page();
-- Drop all rsn_vec_queue rows.
DELETE FROM public.rsn_vec_queue;
ALTER TABLE public.rsn_vec_queue ADD COLUMN _ref_id text NOT NULL;
ALTER TABLE public.rsn_vec_queue ADD CONSTRAINT rsn_vec_queue__ref_id__colname__colpath_str__unique UNIQUE (_ref_id, colname, colpath_str);
ALTER TABLE public.rsn_vec_queue ADD COLUMN tablename text;

---------------------------------------------------------------------
-- Part 2: Remove old work on rsn_vec
ALTER TABLE public.rsn_vec DROP CONSTRAINT either_goal_or_page;
ALTER TABLE public.rsn_vec DROP CONSTRAINT rsn_vec__ref_id__colname__colpath__content_offset__unique;
ALTER TABLE public.rsn_vec DROP COLUMN _ref_id;
ALTER TABLE public.rsn_vec DROP COLUMN goal_id;
ALTER TABLE public.rsn_vec DROP COLUMN page_id;
-- Drop all rsn_vec rows.
DELETE FROM public.rsn_vec;
ALTER TABLE public.rsn_vec ADD COLUMN _ref_id text NOT NULL;
ALTER TABLE public.rsn_vec ADD CONSTRAINT rsn_vec__ref_id__colname__colpath_str__content_offset__unique UNIQUE (_ref_id, colname, colpath_str, content_offset);
ALTER TABLE public.rsn_vec ADD COLUMN tablename text;

-----------------------------------------------------------------------
-- TABLE: rsn_vec_config
CREATE TABLE public.rsn_vec_config (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('rsnvecconf')),
    CONSTRAINT rsn_vec_index_config__id__check_prefix CHECK (public.is_valid_typed_uuid('rsnvecconf', id)),
    tablename text NOT NULL,
    colname text NOT NULL,
    colpath text[]
);
COMMENT ON TABLE public.rsn_vec_config IS 'Table holding configuration for vectorization.';
COMMENT ON COLUMN public.rsn_vec_config.tablename IS 'The name of the table to be vectorized.';
COMMENT ON COLUMN public.rsn_vec_config.colname IS 'The name of the column to be vectorized.';
COMMENT ON COLUMN public.rsn_vec_config.colpath IS 'The path within the column to be vectorized (only used for jsonb columns)';

-- Security
ALTER TABLE public.rsn_vec_config ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.rsn_vec_config TO authenticated;
CREATE POLICY rsn_vec_config__authenticated__insert ON public.rsn_vec_config FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY rsn_vec_config__authenticated__select ON public.rsn_vec_config FOR SELECT TO authenticated USING (true);
CREATE POLICY rsn_vec_config__authenticated__update ON public.rsn_vec_config FOR UPDATE TO authenticated USING (false);
CREATE POLICY rsn_vec_config__authenticated__delete ON public.rsn_vec_config FOR DELETE TO authenticated USING (false);

GRANT ALL ON TABLE public.rsn_vec_config TO anon;
CREATE POLICY rsn_vec_config__anon__insert ON public.rsn_vec_config FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY rsn_vec_config__anon__select ON public.rsn_vec_config FOR SELECT TO anon USING (true);
CREATE POLICY rsn_vec_config__anon__update ON public.rsn_vec_config FOR UPDATE TO anon USING (false);
CREATE POLICY rsn_vec_config__anon__delete ON public.rsn_vec_config FOR DELETE TO anon USING (false);

GRANT ALL ON TABLE public.rsn_vec_config TO service_role;
CREATE POLICY rsn_vec_config__service_role__insert ON public.rsn_vec_config FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY rsn_vec_config__service_role__select ON public.rsn_vec_config FOR SELECT TO service_role USING (true);
CREATE POLICY rsn_vec_config__service_role__update ON public.rsn_vec_config FOR UPDATE TO service_role USING (true);
CREATE POLICY rsn_vec_config__service_role__delete ON public.rsn_vec_config FOR DELETE TO service_role USING (true);


-- Add Various vector configurations
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('goal', '_name', NULL);
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('goal', 'description', NULL);
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('rsn_page', '_name', NULL);
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('rsn_page', 'body', NULL);
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('skill', '_name', NULL);
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('skill', '_description', NULL);

-----------------------------------------------------------------------
-- TABLE: rsncore_table_abbreviations

CREATE TABLE public.rsncore_table_abbreviations (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('rsntababr')),
    CONSTRAINT rsn_table_abbreviations__id__check_prefix CHECK (public.is_valid_typed_uuid('rsntababr', id)),
    tablename text NOT NULL,
    abbreviation text NOT NULL
);
COMMENT ON TABLE public.rsncore_table_abbreviations IS 'Table holding abbreviations for table names.';

-- Security
ALTER TABLE public.rsncore_table_abbreviations ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.rsncore_table_abbreviations TO authenticated;
CREATE POLICY rsncore_table_abbreviations__authenticated__insert ON public.rsncore_table_abbreviations FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY rsncore_table_abbreviations__authenticated__select ON public.rsncore_table_abbreviations FOR SELECT TO authenticated USING (true);
CREATE POLICY rsncore_table_abbreviations__authenticated__update ON public.rsncore_table_abbreviations FOR UPDATE TO authenticated USING (false);
CREATE POLICY rsncore_table_abbreviations__authenticated__delete ON public.rsncore_table_abbreviations FOR DELETE TO authenticated USING (false);


GRANT ALL ON TABLE public.rsncore_table_abbreviations TO anon;
CREATE POLICY rsncore_table_abbreviations__anon__insert ON public.rsncore_table_abbreviations FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY rsncore_table_abbreviations__anon__select ON public.rsncore_table_abbreviations FOR SELECT TO anon USING (true);
CREATE POLICY rsncore_table_abbreviations__anon__update ON public.rsncore_table_abbreviations FOR UPDATE TO anon USING (false);
CREATE POLICY rsncore_table_abbreviations__anon__delete ON public.rsncore_table_abbreviations FOR DELETE TO anon USING (false);

GRANT ALL ON TABLE public.rsncore_table_abbreviations TO service_role;
CREATE POLICY rsncore_table_abbreviations__service_role__insert ON public.rsncore_table_abbreviations FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY rsncore_table_abbreviations__service_role__select ON public.rsncore_table_abbreviations FOR SELECT TO service_role USING (true);
CREATE POLICY rsncore_table_abbreviations__service_role__update ON public.rsncore_table_abbreviations FOR UPDATE TO service_role USING (true);
CREATE POLICY rsncore_table_abbreviations__service_role__delete ON public.rsncore_table_abbreviations FOR DELETE TO service_role USING (true);

-- Add Data
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('activity_skill', 'actvskl');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('activity', 'actvty');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('bot', 'bot');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('chat_message', 'cmsg');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('chat', 'chat');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('entity', 'enty');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('goal', 'goal');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('group', 'grp');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('integration_token', 'intgrtntkn');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('integration', 'intgrtn');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('member_authorization', 'ma');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_page_vec_queue', 'rsnpagevq');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_page_vector', 'rsnpagev');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_page', 'rsnpage');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_user_sysdata', 'rsnusrsys');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_user', 'rsnusr');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_vec_config', 'rsnvecconf');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_vec_queue', 'rsnvq');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('rsn_vec', 'rsnv');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('skill_link', 'skllnk');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('skill', 'skill');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('user_activity_feedback', 'usractfb');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('user_activity_result', 'usractrslt');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('user_activity_result', 'usractrslt');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('user_setting', 'usrset');
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('user_skill', 'usrskill');

-- Create Immutable switch statement function to get tablename from abbreviation
CREATE OR REPLACE FUNCTION public.get_tablename_from_abbreviation(input_abbreviation text)
RETURNS text
LANGUAGE 'plpgsql'
COST 100
STABLE
AS $BODY$
DECLARE
    _tablename text;
BEGIN
    SELECT tablename INTO _tablename
        FROM public.rsncore_table_abbreviations
        WHERE abbreviation = input_abbreviation;
    RETURN _tablename;
END
$BODY$;


CREATE OR REPLACE FUNCTION set_tablename()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tablename := public.get_tablename_from_abbreviation(
        substring(NEW._ref_id, 0, strpos(NEW._ref_id, '_'))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tablename_trigger
    BEFORE INSERT OR UPDATE ON public.rsn_vec_queue
    FOR EACH ROW EXECUTE FUNCTION set_tablename();

CREATE TRIGGER set_tablename_trigger
    BEFORE INSERT OR UPDATE ON public.rsn_vec
    FOR EACH ROW EXECUTE FUNCTION set_tablename();


-----------------------------------------------------------------------
-- TABLE: tgr_rsn_vec_queue_insert_update

CREATE OR REPLACE FUNCTION public.tgr_rsn_vec_queue_insert_update()
RETURNS trigger
LANGUAGE 'plpgsql'
COST 100
VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
    _colname TEXT;
    _colpath TEXT;
    _has_changed BOOLEAN;
    _table_configured BOOLEAN;
BEGIN
    -- Check if the table is configured in rsn_vec_config
    SELECT EXISTS(
        SELECT 1
        FROM rsn_vec_config
        WHERE tablename = TG_TABLE_NAME
    ) INTO _table_configured;

    -- Proceed only if the table is configured
    IF _table_configured THEN
        IF (TG_OP = 'UPDATE') THEN
            FOR _colname, _colpath IN
                SELECT colname, colpath
                FROM rsn_vec_config
                WHERE tablename = TG_TABLE_NAME
            LOOP
                _has_changed := FALSE;
                IF (_colpath IS NULL OR _colpath = '') THEN
                    EXECUTE format('SELECT ($1).%I IS DISTINCT FROM ($2).%I', _colname, _colname) INTO _has_changed USING NEW, OLD;
                ELSE
                    EXECUTE format('SELECT jsonb_extract_path_text(($1).%I, %L) IS DISTINCT FROM jsonb_extract_path_text(($2).%I, %L)', _colname, _colpath, _colname, _colpath) INTO _has_changed USING NEW, OLD;
                END IF;

                IF _has_changed THEN
                    INSERT INTO rsn_vec_queue (_ref_id, colname) VALUES (NEW.id, _colname) ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;

        ELSIF (TG_OP = 'INSERT') THEN
            -- Loop through all configured items for this table in rsn_vec_config
            FOR _colname IN
                SELECT colname
                FROM rsn_vec_config
                WHERE tablename = TG_TABLE_NAME
            LOOP
                INSERT INTO rsn_vec_queue (_ref_id, colname) VALUES (NEW.id, _colname) ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;


CREATE TRIGGER rsn_page__tgr_rsn_vec_queue_insert_update
    AFTER INSERT OR UPDATE
    ON public.rsn_page
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_vec_queue_insert_update();
;

CREATE TRIGGER goal__tgr_rsn_vec_queue_insert_update
    AFTER INSERT OR UPDATE
    ON public.goal
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_vec_queue_insert_update();

CREATE TRIGGER skill__tgr_rsn_vec_queue_insert_update
    AFTER INSERT OR UPDATE
    ON public.skill
    FOR EACH ROW
    EXECUTE PROCEDURE public.tgr_rsn_vec_queue_insert_update();


-----------------------------------------------------------------------
-- Search function

CREATE OR REPLACE FUNCTION public.match_rsn_vec(
    match_embedding vector,
    match_threshold double precision,
    match_count integer,
    min_content_length integer,
    -- Optional tablename, Filter results to a specific table
    filter_tablename text DEFAULT NULL::text,
    -- Optional colname, Filter results to a specific column
    filter_colname text DEFAULT NULL::text,
    -- Optional colpath, Filter results to a specific column path
    filter_colpath text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
    id text, 
    raw_content text, 
    similarity double precision, 
    _ref_id text,
    result_tablename text,
    result_colname text,
    result_colpath text[]
)
LANGUAGE plpgsql
AS $function$ #variable_conflict use_variable
BEGIN
    -- Using a CTE to initially filter the dataset
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            rsn_vec.id,
            rsn_vec.raw_content,
            rsn_vec.embedding,
            rsn_vec._ref_id,
            rsn_vec.tablename,
            rsn_vec.colname,
            rsn_vec.colpath
        FROM 
            rsn_vec
        WHERE
            -- Applying initial filters to reduce dataset size
            length(rsn_vec.raw_content) >= min_content_length
            AND (rsn_vec.tablename = filter_tablename OR filter_tablename IS NULL)
            AND (rsn_vec.colname = filter_colname OR filter_colname IS NULL)
            AND (rsn_vec.colpath = filter_colpath OR filter_colpath IS NULL)
    ),
    -- Now, we can compute the similarity score on top of the filtered dataset
    similarity_calc AS (
        SELECT 
            *,
            -- Compute similarity score on the reduced dataset
            (filtered_data.embedding <#> match_embedding) * -1 AS similarity
        FROM 
            filtered_data
    )
    -- Finally, add the threshold and limit the results
    SELECT 
        similarity_calc.id,
        similarity_calc.raw_content,
        similarity_calc.similarity,
        similarity_calc._ref_id,
        similarity_calc.tablename as result_tablename,
        similarity_calc.colname as result_colname,
        similarity_calc.colpath as result_colpath
    FROM 
        similarity_calc
    WHERE
        -- Applying the threshold filter for similarity
        similarity_calc.similarity > match_threshold
    ORDER BY 
        similarity_calc.similarity DESC
    LIMIT 
        match_count;
END;
$function$
;

COMMENT ON FUNCTION public.match_rsn_vec(
    embedding vector,
    match_threshold double precision,
    match_count integer,
    min_content_length integer,
    tablename text,
    colname text,
    colpath text[]
) IS 
'Function to search for similar vectors.
Parameters:
- embedding: The embedding vector to search for.
- match_threshold: The threshold for similarity.
- match_count: The number of results to return.
- min_content_length: The minimum length of the content to search in.
- tablename: [OPTIONAL] The name of the table to search in.
- colname: [OPTIONAL] The name of the column to search in.
- colpath: [OPTIONAL] The path within the column to search in (only used for jsonb columns).';