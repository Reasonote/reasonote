---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Table: public.podcast_queue_item

---------------------------------------------------------------------------
-- BEGIN: TABLE DESCRIPTION (TABLE: public.podcast_queue_item)
------------------------------
--                                   Table "public.podcast_queue_item"
--    Column   |           Type           | Collation | Nullable |                Default                
-- ------------+--------------------------+-----------+----------+---------------------------------------
--  id         | text                     |           | not null | generate_typed_uuid('podqitem'::text)
--  for_user   | text                     |           | not null | 
--  podcast_id | text                     |           | not null | 
--  position   | double precision         |           | not null | 
--  created_at | timestamp with time zone |           |          | now()
-- Indexes:
--     "podcast_queue_item_pkey" PRIMARY KEY, btree (id)
--     "idx_podcast_queue_item_user_position" btree (for_user, "position")
--     "podcast_queue_item_for_user_position_key" UNIQUE CONSTRAINT, btree (for_user, "position")
-- Foreign-key constraints:
--     "podcast_queue_item_for_user_fkey" FOREIGN KEY (for_user) REFERENCES rsn_user(id) ON DELETE CASCADE
--     "podcast_queue_item_podcast_id_fkey" FOREIGN KEY (podcast_id) REFERENCES podcast(id) ON DELETE CASCADE
-- Policies:
--     POLICY "podcast_queue_item DELETE" FOR DELETE
--       USING (((for_user = (current_rsn_user_id())::text) OR is_admin()))
--     POLICY "podcast_queue_item INSERT" FOR INSERT
--       WITH CHECK (((for_user = (current_rsn_user_id())::text) OR is_admin()))
--     POLICY "podcast_queue_item SELECT" FOR SELECT
--       USING (((for_user = (current_rsn_user_id())::text) OR is_admin()))
--     POLICY "podcast_queue_item UPDATE" FOR UPDATE
--       USING (((for_user = (current_rsn_user_id())::text) OR is_admin()))
-- 
-- 

------------------------------
-- END: TABLE DESCRIPTION (TABLE: public.podcast_queue_item)
---------------------------------------------------------------------------


---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (TABLE: public.podcast_queue_item)
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
-- Name: podcast_queue_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.podcast_queue_item (
    id text DEFAULT public.generate_typed_uuid('podqitem'::text) NOT NULL,
    for_user text NOT NULL,
    podcast_id text NOT NULL,
    "position" double precision NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.podcast_queue_item OWNER TO postgres;

--
-- Name: podcast_queue_item podcast_queue_item_for_user_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_queue_item
    ADD CONSTRAINT podcast_queue_item_for_user_position_key UNIQUE (for_user, "position");


--
-- Name: podcast_queue_item podcast_queue_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_queue_item
    ADD CONSTRAINT podcast_queue_item_pkey PRIMARY KEY (id);


--
-- Name: idx_podcast_queue_item_user_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_podcast_queue_item_user_position ON public.podcast_queue_item USING btree (for_user, "position");


--
-- Name: podcast_queue_item podcast_queue_item_for_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_queue_item
    ADD CONSTRAINT podcast_queue_item_for_user_fkey FOREIGN KEY (for_user) REFERENCES public.rsn_user(id) ON DELETE CASCADE;


--
-- Name: podcast_queue_item podcast_queue_item_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_queue_item
    ADD CONSTRAINT podcast_queue_item_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcast(id) ON DELETE CASCADE;


--
-- Name: podcast_queue_item; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.podcast_queue_item ENABLE ROW LEVEL SECURITY;

--
-- Name: podcast_queue_item podcast_queue_item DELETE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_queue_item DELETE" ON public.podcast_queue_item FOR DELETE USING (((for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));


--
-- Name: podcast_queue_item podcast_queue_item INSERT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_queue_item INSERT" ON public.podcast_queue_item FOR INSERT WITH CHECK (((for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));


--
-- Name: podcast_queue_item podcast_queue_item SELECT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_queue_item SELECT" ON public.podcast_queue_item FOR SELECT USING (((for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));


--
-- Name: podcast_queue_item podcast_queue_item UPDATE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "podcast_queue_item UPDATE" ON public.podcast_queue_item FOR UPDATE USING (((for_user = (public.current_rsn_user_id())::text) OR public.is_admin()));


--
-- Name: TABLE podcast_queue_item; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.podcast_queue_item TO anon;
GRANT ALL ON TABLE public.podcast_queue_item TO authenticated;
GRANT ALL ON TABLE public.podcast_queue_item TO service_role;


--
-- PostgreSQL database dump complete
--



------------------------------
-- END: PG_DUMP RESULT (TABLE: public.podcast_queue_item)
---------------------------------------------------------------------------

