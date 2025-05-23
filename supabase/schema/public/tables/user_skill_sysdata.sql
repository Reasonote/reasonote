---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Table: public.user_skill_sysdata

---------------------------------------------------------------------------
-- BEGIN: TABLE DESCRIPTION (TABLE: public.user_skill_sysdata)
------------------------------
--                                        Table "public.user_skill_sysdata"
--        Column        |           Type           | Collation | Nullable |                Default                
-- ---------------------+--------------------------+-----------+----------+---------------------------------------
--  id                  | text                     |           | not null | generate_typed_uuid('usrsklsd'::text)
--  rsn_user            | typed_uuid               |           |          | 
--  skill               | typed_uuid               |           |          | 
--  total_xp            | integer                  |           | not null | 0
--  daily_xp            | integer                  |           | not null | 0
--  last_daily_reset    | timestamp with time zone |           | not null | now()
--  highest_level_shown | integer                  |           |          | 1
--  practice_score      | integer                  |           | not null | 0
-- Indexes:
--     "user_skill_sysdata_pkey" PRIMARY KEY, btree (id)
--     "user_skill_sysdata_rsn_user_skill_key" UNIQUE CONSTRAINT, btree (rsn_user, skill)
-- Check constraints:
--     "user_skill_sysdata__id__check_prefix" CHECK (is_valid_typed_uuid('usrsklsd'::text, id::typed_uuid))
-- Foreign-key constraints:
--     "user_skill_sysdata_rsn_user_fkey" FOREIGN KEY (rsn_user) REFERENCES rsn_user(id)
--     "user_skill_sysdata_skill_fkey" FOREIGN KEY (skill) REFERENCES skill(id)
-- Policies:
--     POLICY "user_skill_sysdata DELETE" FOR DELETE
--       USING (is_admin())
--     POLICY "user_skill_sysdata INSERT" FOR INSERT
--       WITH CHECK (is_admin())
--     POLICY "user_skill_sysdata SELECT" FOR SELECT
--       USING ((is_admin() OR ((rsn_user)::text = (current_rsn_user_id())::text)))
--     POLICY "user_skill_sysdata UPDATE" FOR UPDATE
--       USING (is_admin())
-- 
-- 

------------------------------
-- END: TABLE DESCRIPTION (TABLE: public.user_skill_sysdata)
---------------------------------------------------------------------------


---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (TABLE: public.user_skill_sysdata)
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
-- Name: user_skill_sysdata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_skill_sysdata (
    id text DEFAULT public.generate_typed_uuid('usrsklsd'::text) NOT NULL,
    rsn_user public.typed_uuid,
    skill public.typed_uuid,
    total_xp integer DEFAULT 0 NOT NULL,
    daily_xp integer DEFAULT 0 NOT NULL,
    last_daily_reset timestamp with time zone DEFAULT now() NOT NULL,
    highest_level_shown integer DEFAULT 1,
    practice_score integer DEFAULT 0 NOT NULL,
    CONSTRAINT user_skill_sysdata__id__check_prefix CHECK (public.is_valid_typed_uuid('usrsklsd'::text, (id)::public.typed_uuid))
);


ALTER TABLE public.user_skill_sysdata OWNER TO postgres;

--
-- Name: COLUMN user_skill_sysdata.practice_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_skill_sysdata.practice_score IS 'Stores the user''s practice score (0-100) for a specific skill';


--
-- Name: user_skill_sysdata user_skill_sysdata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skill_sysdata
    ADD CONSTRAINT user_skill_sysdata_pkey PRIMARY KEY (id);


--
-- Name: user_skill_sysdata user_skill_sysdata_rsn_user_skill_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skill_sysdata
    ADD CONSTRAINT user_skill_sysdata_rsn_user_skill_key UNIQUE (rsn_user, skill);


--
-- Name: user_skill_sysdata user_skill_sysdata_rsn_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skill_sysdata
    ADD CONSTRAINT user_skill_sysdata_rsn_user_fkey FOREIGN KEY (rsn_user) REFERENCES public.rsn_user(id);


--
-- Name: user_skill_sysdata user_skill_sysdata_skill_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skill_sysdata
    ADD CONSTRAINT user_skill_sysdata_skill_fkey FOREIGN KEY (skill) REFERENCES public.skill(id);


--
-- Name: user_skill_sysdata; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_skill_sysdata ENABLE ROW LEVEL SECURITY;

--
-- Name: user_skill_sysdata user_skill_sysdata DELETE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_skill_sysdata DELETE" ON public.user_skill_sysdata FOR DELETE USING (public.is_admin());


--
-- Name: user_skill_sysdata user_skill_sysdata INSERT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_skill_sysdata INSERT" ON public.user_skill_sysdata FOR INSERT WITH CHECK (public.is_admin());


--
-- Name: user_skill_sysdata user_skill_sysdata SELECT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_skill_sysdata SELECT" ON public.user_skill_sysdata FOR SELECT USING ((public.is_admin() OR ((rsn_user)::text = (public.current_rsn_user_id())::text)));


--
-- Name: user_skill_sysdata user_skill_sysdata UPDATE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user_skill_sysdata UPDATE" ON public.user_skill_sysdata FOR UPDATE USING (public.is_admin());


--
-- Name: TABLE user_skill_sysdata; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_skill_sysdata TO anon;
GRANT ALL ON TABLE public.user_skill_sysdata TO authenticated;
GRANT ALL ON TABLE public.user_skill_sysdata TO service_role;


--
-- PostgreSQL database dump complete
--



------------------------------
-- END: PG_DUMP RESULT (TABLE: public.user_skill_sysdata)
---------------------------------------------------------------------------

