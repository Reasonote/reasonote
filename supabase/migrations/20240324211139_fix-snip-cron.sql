SELECT cron.schedule (
  'cron__snip_extract_text_cron', -- name of the cron job
  '* * * * *', -- Every minute
  $$ 
    SELECT net.http_post(
        url:= reasonote_app_url() || '/api/internal/snip_extract_text_cron',
        headers:= format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', anon_key())::jsonb,
        body:=concat('{}')::jsonb
      ) as request_id;
  $$
);
-- Clean up old cron job
SELECT cron.unschedule('crn_process_queue');

SELECT cron.schedule (
  'cron__revectorize_cron', -- name of the cron job
  '* * * * *', -- Every minute
  $$ 
    SELECT net.http_post(
        url:= reasonote_app_url() || '/api/internal/revectorize_cron',
        headers:= format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', anon_key())::jsonb,
        body:=concat('{}')::jsonb
      ) as request_id;
  $$ -- query to run
);