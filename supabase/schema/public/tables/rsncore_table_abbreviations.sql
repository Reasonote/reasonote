---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Table: public.rsncore_table_abbreviations

---------------------------------------------------------------------------
-- BEGIN: TABLE DESCRIPTION (TABLE: public.rsncore_table_abbreviations)
------------------------------
--                      Table "public.rsncore_table_abbreviations"
--     Column    | Type | Collation | Nullable |                Default                 
-- --------------+------+-----------+----------+----------------------------------------
--  id           | text |           | not null | generate_typed_uuid('rsntababr'::text)
--  tablename    | text |           | not null | 
--  abbreviation | text |           | not null | 
-- Indexes:
--     "rsncore_table_abbreviations_pkey" PRIMARY KEY, btree (id)
-- Check constraints:
--     "rsn_table_abbreviations__id__check_prefix" CHECK (is_valid_typed_uuid('rsntababr'::text, id::typed_uuid))
-- Policies:
--     POLICY "rsncore_table_abbreviations__anon__delete" FOR DELETE
--       TO anon
--       USING (false)
--     POLICY "rsncore_table_abbreviations__anon__insert" FOR INSERT
--       TO anon
--       WITH CHECK (false)
--     POLICY "rsncore_table_abbreviations__anon__select" FOR SELECT
--       TO anon
--       USING (true)
--     POLICY "rsncore_table_abbreviations__anon__update" FOR UPDATE
--       TO anon
--       USING (false)
--     POLICY "rsncore_table_abbreviations__authenticated__delete" FOR DELETE
--       TO authenticated
--       USING (false)
--     POLICY "rsncore_table_abbreviations__authenticated__insert" FOR INSERT
--       TO authenticated
--       WITH CHECK (false)
--     POLICY "rsncore_table_abbreviations__authenticated__select" FOR SELECT
--       TO authenticated
--       USING (true)
--     POLICY "rsncore_table_abbreviations__authenticated__update" FOR UPDATE
--       TO authenticated
--       USING (false)
--     POLICY "rsncore_table_abbreviations__service_role__delete" FOR DELETE
--       TO service_role
--       USING (true)
--     POLICY "rsncore_table_abbreviations__service_role__insert" FOR INSERT
--       TO service_role
--       WITH CHECK (true)
--     POLICY "rsncore_table_abbreviations__service_role__select" FOR SELECT
--       TO service_role
--       USING (true)
--     POLICY "rsncore_table_abbreviations__service_role__update" FOR UPDATE
--       TO service_role
--       USING (true)
-- 
-- 

------------------------------
-- END: TABLE DESCRIPTION (TABLE: public.rsncore_table_abbreviations)
---------------------------------------------------------------------------


---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (TABLE: public.rsncore_table_abbreviations)
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
-- Name: rsncore_table_abbreviations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsncore_table_abbreviations (
    id text DEFAULT public.generate_typed_uuid('rsntababr'::text) NOT NULL,
    tablename text NOT NULL,
    abbreviation text NOT NULL,
    CONSTRAINT rsn_table_abbreviations__id__check_prefix CHECK (public.is_valid_typed_uuid('rsntababr'::text, (id)::public.typed_uuid))
);


ALTER TABLE public.rsncore_table_abbreviations OWNER TO postgres;

--
-- Name: TABLE rsncore_table_abbreviations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rsncore_table_abbreviations IS 'Table holding abbreviations for table names.';


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsncore_table_abbreviations
    ADD CONSTRAINT rsncore_table_abbreviations_pkey PRIMARY KEY (id);


--
-- Name: rsncore_table_abbreviations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rsncore_table_abbreviations ENABLE ROW LEVEL SECURITY;

--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__anon__delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__anon__delete ON public.rsncore_table_abbreviations FOR DELETE TO anon USING (false);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__anon__insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__anon__insert ON public.rsncore_table_abbreviations FOR INSERT TO anon WITH CHECK (false);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__anon__select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__anon__select ON public.rsncore_table_abbreviations FOR SELECT TO anon USING (true);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__anon__update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__anon__update ON public.rsncore_table_abbreviations FOR UPDATE TO anon USING (false);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__authenticated__delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__authenticated__delete ON public.rsncore_table_abbreviations FOR DELETE TO authenticated USING (false);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__authenticated__insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__authenticated__insert ON public.rsncore_table_abbreviations FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__authenticated__select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__authenticated__select ON public.rsncore_table_abbreviations FOR SELECT TO authenticated USING (true);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__authenticated__update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__authenticated__update ON public.rsncore_table_abbreviations FOR UPDATE TO authenticated USING (false);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__service_role__delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__service_role__delete ON public.rsncore_table_abbreviations FOR DELETE TO service_role USING (true);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__service_role__insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__service_role__insert ON public.rsncore_table_abbreviations FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__service_role__select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__service_role__select ON public.rsncore_table_abbreviations FOR SELECT TO service_role USING (true);


--
-- Name: rsncore_table_abbreviations rsncore_table_abbreviations__service_role__update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rsncore_table_abbreviations__service_role__update ON public.rsncore_table_abbreviations FOR UPDATE TO service_role USING (true);


--
-- Name: TABLE rsncore_table_abbreviations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rsncore_table_abbreviations TO anon;
GRANT ALL ON TABLE public.rsncore_table_abbreviations TO authenticated;
GRANT ALL ON TABLE public.rsncore_table_abbreviations TO service_role;


--
-- PostgreSQL database dump complete
--



------------------------------
-- END: PG_DUMP RESULT (TABLE: public.rsncore_table_abbreviations)
---------------------------------------------------------------------------

