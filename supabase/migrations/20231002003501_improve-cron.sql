

CREATE OR REPLACE FUNCTION reasonote_app_url() RETURNS text AS $$
  BEGIN
    -- This should only be called from the local machine and must be overridden in production.
    PERFORM public.throw_if_not_local();
    -- This is the internal Kong URL for the localhost Kong instance.
    RETURN 'http://host.docker.internal:3456';
  END;
$$ LANGUAGE plpgsql;


SELECT cron.schedule (
  'crn_process_queue', -- name of the cron job
  '* * * * *', -- Every minute
  $$ 
    SELECT net.http_post(
        url:= reasonote_app_url() || '/api/internal/revectorize_cron',
        headers:= format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', anon_key())::jsonb,
        body:=concat('{}')::jsonb
      ) as request_id;
  $$ -- query to run
);