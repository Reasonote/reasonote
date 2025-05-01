-- Drop the existing cron job
SELECT cron.unschedule('crn_cleanup_daily_xp_and_goals');

-- Reschedule with correct timing (every 30 minutes)
SELECT cron.schedule(
    'crn_cleanup_daily_xp_and_goals',  -- job name
    '*/30 * * * *',                    -- cron schedule (every 30 minutes)
    'SELECT crn_cleanup_daily_xp_and_goals()'
); 