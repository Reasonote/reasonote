---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.update_resend_synced_on_subscription_change

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.update_resend_synced_on_subscription_change)
------------------------------
CREATE OR REPLACE FUNCTION public.update_resend_synced_on_subscription_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (OLD.product_updates IS DISTINCT FROM NEW.product_updates
      OR OLD.edtech_updates IS DISTINCT FROM NEW.edtech_updates
      OR OLD.newsletter IS DISTINCT FROM NEW.newsletter) THEN
    NEW.resend_synced = FALSE;
  ELSE
    NEW.resend_synced = NEW.resend_synced;  -- Keep the new value if only resend_synced is changing
  END IF;
  RETURN NEW;
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.update_resend_synced_on_subscription_change)
---------------------------------------------------------------------------
