---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Table: public.skill_page

---------------------------------------------------------------------------
-- BEGIN: TABLE DESCRIPTION (TABLE: public.skill_page)
------------------------------
--                                        Table "public.skill_page"
--     Column    |           Type           | Collation | Nullable |               Default                
-- --------------+--------------------------+-----------+----------+--------------------------------------
--  id           | text                     |           | not null | generate_typed_uuid('sklpage'::text)
--  skill_id     | text                     |           | not null | 
--  rsn_page_id  | text                     |           | not null | 
--  created_by   | text                     |           |          | 
--  updated_by   | text                     |           |          | 
--  created_date | timestamp with time zone |           | not null | timezone('utc'::text, now())
--  updated_date | timestamp with time zone |           | not null | timezone('utc'::text, now())
-- Foreign-key constraints:
--     "skill_page_rsn_page_id_fkey" FOREIGN KEY (rsn_page_id) REFERENCES rsn_page(id) ON DELETE CASCADE
--     "skill_page_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
-- Policies:
--     POLICY "skill_page DELETE" FOR DELETE
--       USING (true)
--     POLICY "skill_page INSERT" FOR INSERT
--       WITH CHECK (true)
--     POLICY "skill_page SELECT" FOR SELECT
--       USING (true)
--     POLICY "skill_page UPDATE" FOR UPDATE
--       USING (true)
-- Triggers:
--     log_operation AFTER INSERT OR DELETE OR UPDATE ON skill_page FOR EACH ROW EXECUTE FUNCTION tgr_log_operation()
--     run_tgr_apply_audit BEFORE INSERT OR UPDATE ON skill_page FOR EACH ROW EXECUTE FUNCTION tgr_apply_audit()
-- 
-- 

------------------------------
-- END: TABLE DESCRIPTION (TABLE: public.skill_page)
---------------------------------------------------------------------------


---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (TABLE: public.skill_page)
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
-- Name: skill_page; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_page (
    id text DEFAULT public.generate_typed_uuid('sklpage'::text) NOT NULL,
    skill_id text NOT NULL,
    rsn_page_id text NOT NULL,
    created_by text,
    updated_by text,
    created_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.skill_page OWNER TO postgres;

--
-- Name: TABLE skill_page; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.skill_page IS 'A page for a skill';


--
-- Name: COLUMN skill_page.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.id IS 'The unique identifier for the skill page';


--
-- Name: COLUMN skill_page.skill_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.skill_id IS 'The skill that the skill page is for';


--
-- Name: COLUMN skill_page.rsn_page_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.rsn_page_id IS 'The rsn_page that the skill page is for';


--
-- Name: COLUMN skill_page.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.created_by IS 'The user that created the skill page';


--
-- Name: COLUMN skill_page.updated_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.updated_by IS 'The user that last updated the skill page';


--
-- Name: COLUMN skill_page.created_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.created_date IS 'The date the skill page was created';


--
-- Name: COLUMN skill_page.updated_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_page.updated_date IS 'The date the skill page was last updated';


--
-- Name: skill_page log_operation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.skill_page FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();


--
-- Name: skill_page run_tgr_apply_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.skill_page FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();


--
-- Name: skill_page skill_page_rsn_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_page
    ADD CONSTRAINT skill_page_rsn_page_id_fkey FOREIGN KEY (rsn_page_id) REFERENCES public.rsn_page(id) ON DELETE CASCADE;


--
-- Name: skill_page skill_page_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_page
    ADD CONSTRAINT skill_page_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(id) ON DELETE CASCADE;


--
-- Name: skill_page; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.skill_page ENABLE ROW LEVEL SECURITY;

--
-- Name: skill_page skill_page DELETE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "skill_page DELETE" ON public.skill_page FOR DELETE USING (true);


--
-- Name: skill_page skill_page INSERT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "skill_page INSERT" ON public.skill_page FOR INSERT WITH CHECK (true);


--
-- Name: skill_page skill_page SELECT; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "skill_page SELECT" ON public.skill_page FOR SELECT USING (true);


--
-- Name: skill_page skill_page UPDATE; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "skill_page UPDATE" ON public.skill_page FOR UPDATE USING (true);


--
-- Name: TABLE skill_page; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.skill_page TO anon;
GRANT ALL ON TABLE public.skill_page TO authenticated;
GRANT ALL ON TABLE public.skill_page TO service_role;


--
-- PostgreSQL database dump complete
--



------------------------------
-- END: PG_DUMP RESULT (TABLE: public.skill_page)
---------------------------------------------------------------------------

