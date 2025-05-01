

ALTER TABLE public.rsn_user_sysdata
    ADD COLUMN auth_email text;

-- Trigger the function every time a user is created
CREATE TRIGGER run_tgr_user_auth_sync
  BEFORE INSERT OR UPDATE ON public.rsn_user_sysdata
  FOR EACH ROW EXECUTE PROCEDURE public.tgr_user_auth_sync();