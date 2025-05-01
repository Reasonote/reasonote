-- DO $$
-- BEGIN
--     BEGIN
--         PERFORM cron.unschedule('cron__revectorize_cron');
--     EXCEPTION
--         WHEN OTHERS THEN
--             RAISE NOTICE 'Failed to unschedule cron job: %', SQLERRM;
--     END;
-- END $$;

select 1;
