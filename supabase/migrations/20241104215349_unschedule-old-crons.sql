-- Create a helper function for safely unscheduling cron jobs
CREATE OR REPLACE FUNCTION safe_unschedule_cron(job_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Required to access cron schema
AS $$
BEGIN
    -- Check if user is admin or superuser
    IF NOT (public.is_admin() OR current_user = 'postgres') THEN
        RAISE EXCEPTION 'Only administrators or superusers can unschedule cron jobs';
    END IF;

    IF EXISTS (
        SELECT 1 FROM cron.job 
        WHERE jobname = job_name
    ) THEN
        PERFORM cron.unschedule(job_name);
    END IF;
END;
$$;

-- Use the helper function
DO $$
BEGIN
    PERFORM safe_unschedule_cron('cron__revectorize_cron');
    PERFORM safe_unschedule_cron('cron__snip_extract_text_cron');
END $$;