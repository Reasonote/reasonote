---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Table: public.podcast_line

---------------------------------------------------------------------------
-- BEGIN: TABLE DESCRIPTION (TABLE: public.podcast_line)
------------------------------
--                                         Table "public.podcast_line"
--       Column       |           Type           | Collation | Nullable |               Default                
-- -------------------+--------------------------+-----------+----------+--------------------------------------
--  id                | text                     |           | not null | generate_typed_uuid('podline'::text)
--  podcast_id        | text                     |           |          | 
--  speaker           | text                     |           | not null | 
--  dialogue          | text                     |           | not null | 
--  dig_deeper_topics | text[]                   |           |          | 
--  line_number       | integer                  |           | not null | 
--  created_date      | timestamp with time zone |           | not null | now()
--  updated_date      | timestamp with time zone |           | not null | now()
--  created_by        | text                     |           |          | 
--  updated_by        | text                     |           |          | 
-- Indexes:
--     "podcast_line_pkey" PRIMARY KEY, btree (id)
--     "podcast_line_podcast_id_idx" btree (podcast_id)
-- Check constraints:
--     "podcast_line_id_check" CHECK (is_valid_typed_uuid('podline'::text, id::typed_uuid))
-- Foreign-key constraints:
--     "podcast_line_created_by_fkey" FOREIGN KEY (created_by) REFERENCES rsn_user(id) ON DELETE SET NULL
--     "podcast_line_podcast_id_fkey" FOREIGN KEY (podcast_id) REFERENCES podcast(id) ON DELETE CASCADE
--     "podcast_line_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES rsn_user(id) ON DELETE SET NULL
-- Referenced by:
--     TABLE "podcast_audio" CONSTRAINT "podcast_audio_podcast_line_id_fkey" FOREIGN KEY (podcast_line_id) REFERENCES podcast_line(id) ON DELETE CASCADE
-- Policies:
--     POLICY "podcast_line DELETE" FOR DELETE
--       USING ((podcast_id IN ( SELECT podcast.id
--    FROM podcast
--   WHERE ((podcast.created_by = (current_rsn_user_id())::text) OR (podcast.for_user = (current_rsn_user_id())::text) OR is_admin()))))
--     POLICY "podcast_line INSERT" FOR INSERT
--       WITH CHECK ((podcast_id IN ( SELECT podcast.id
--    FROM podcast
--   WHERE ((podcast.created_by = (current_rsn_user_id())::text) OR (podcast.for_user = (current_rsn_user_id())::text) OR is_admin()))))
--     POLICY "podcast_line SELECT" FOR SELECT
--       USING ((podcast_id IN ( SELECT podcast.id
--    FROM podcast
--   WHERE ((podcast.created_by = (current_rsn_user_id())::text) OR (podcast.for_user = (current_rsn_user_id())::text) OR is_admin() OR (podcast.is_shared_version = true)))))
--     POLICY "podcast_line UPDATE" FOR UPDATE
--       USING ((podcast_id IN ( SELECT podcast.id
--    FROM podcast
--   WHERE ((podcast.created_by = (current_rsn_user_id())::text) OR (podcast.for_user = (current_rsn_user_id())::text) OR is_admin()))))
-- Triggers:
--     log_operation AFTER INSERT OR DELETE OR UPDATE ON podcast_line FOR EACH ROW EXECUTE FUNCTION tgr_log_operation()
--     run_tgr_apply_audit BEFORE INSERT OR UPDATE ON podcast_line FOR EACH ROW EXECUTE FUNCTION tgr_apply_audit()
--     set_podcast_line_number_trigger BEFORE INSERT ON podcast_line FOR EACH ROW EXECUTE FUNCTION set_podcast_line_number()
-- 
-- 

------------------------------
-- END: TABLE DESCRIPTION (TABLE: public.podcast_line)
---------------------------------------------------------------------------


---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (TABLE: public.podcast_line)
------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: podcast_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.podcast_line (
    id text DEFAULT public.generate_typed_uuid('podline'::text) NOT NULL,
    podcast_id text,
    speaker text NOT NULL,
    dialogue text NOT NULL,
    dig_deeper_topics text[],
    line_number integer NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT podcast_line_id_check CHECK (public.is_valid_typed_uuid('podline'::text, (id)::public.typed_uuid))
);


ALTER TABLE public.podcast_line OWNER TO postgres;

--
-- Name: TABLE podcast_line; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.podcast_line IS 'A podcast line is a line in a podcast.';


--
-- Name: COLUMN podcast_line.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.podcast_line.id IS 'The ID of the podcast line.';


--
-- Name: COLUMN podcast_line.podcast_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.podcast_line.podcast_id IS 'The ID of the podcast that this line is for.';


--
-- Name: COLUMN podcast_line.speaker; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.podcast_line.speaker IS 'The speaker of this line.';


--
-- Name: COLUMN podcast_line.dialogue; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.podcast_line.dialogue IS 'The dialogue of this line.';


--
-- Name: COLUMN podcast_line.line_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.podcast_line.line_number IS 'The line number of this line in the podcast.';


--
-- Name: podcast_line podcast_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_line
    ADD CONSTRAINT podcast_line_pkey PRIMARY KEY (id);


--
-- Name: podcast_line_podcast_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX podcast_line_podcast_id_idx ON public.podcast_line USING btree (podcast_id);


--
-- Name: podcast_line log_operation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.podcast_line FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


--
-- Name: podcast_line run_tgr_apply_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.podcast_line FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


--
-- Name: podcast_line set_podcast_line_number_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_podcast_line_number_trigger BEFORE INSERT ON public.podcast_line FOR EACH ROW EXECUTE FUNCTION public.set_podcast_line_number();


--
-- Name: podcast_line podcast_line_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_line
    ADD CONSTRAINT podcast_line_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;


--
-- Name: podcast_line podcast_line_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_line
    ADD CONSTRAINT podcast_line_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcast(id) ON DELETE CASCADE;


--
-- Name: podcast_line podcast_line_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_line
    ADD CONSTRAINT podcast_line_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;


--
-- Name: podcast_line; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.podcast_line ENABLE ROW LEVEL SECURITY;

--
-- Name: podcast_line podcast_line DELETE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_line DELETE" ON public.podcast_line FOR DELETE USING ((podcast_id IN ( SELECT podcast.id
   FROM public.podcast
  WHERE ((podcast.created_by = (public.current_rsn_user_id())::text) OR (podcast.for_user = (public.current_rsn_user_id())::text) OR public.is_admin()))));


--
-- Name: podcast_line podcast_line INSERT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_line INSERT" ON public.podcast_line FOR INSERT WITH CHECK ((podcast_id IN ( SELECT podcast.id
   FROM public.podcast
  WHERE ((podcast.created_by = (public.current_rsn_user_id())::text) OR (podcast.for_user = (public.current_rsn_user_id())::text) OR public.is_admin()))));


--
-- Name: podcast_line podcast_line SELECT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_line SELECT" ON public.podcast_line FOR SELECT USING ((podcast_id IN ( SELECT podcast.id
   FROM public.podcast
  WHERE ((podcast.created_by = (public.current_rsn_user_id())::text) OR (podcast.for_user = (public.current_rsn_user_id())::text) OR public.is_admin() OR (podcast.is_shared_version = true)))));


--
-- Name: podcast_line podcast_line UPDATE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_line UPDATE" ON public.podcast_line FOR UPDATE USING ((podcast_id IN ( SELECT podcast.id
   FROM public.podcast
  WHERE ((podcast.created_by = (public.current_rsn_user_id())::text) OR (podcast.for_user = (public.current_rsn_user_id())::text) OR public.is_admin()))));


--
-- Name: TABLE podcast_line; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.podcast_line TO anon;
GRANT ALL ON TABLE public.podcast_line TO authenticated;
GRANT ALL ON TABLE public.podcast_line TO service_role;


--
-- PostgreSQL database dump complete
--



------------------------------
-- END: PG_DUMP RESULT (TABLE: public.podcast_line)
---------------------------------------------------------------------------

