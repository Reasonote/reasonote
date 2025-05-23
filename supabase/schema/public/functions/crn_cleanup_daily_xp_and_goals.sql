---------------------------------------------------------------------------
-- 
-- ⚠️ DO NOT EDIT THIS FILE!
-- THIS FILE WAS AUTOMATICALLY GENERATED FROM THE CONTENTS OF A CLEANLY-MIGRATED DATABASE.
-- 
-- ℹ️ To change the contents of this file, create a new migration under 'supabase/migrations/'
-- that makes the change you would like to see.
-- 
---------------------------------------------------------------------------
-- Function: public.crn_cleanup_daily_xp_and_goals

---------------------------------------------------------------------------
-- BEGIN: PG_DUMP RESULT (FUNCTION: public.crn_cleanup_daily_xp_and_goals)
------------------------------
CREATE OR REPLACE FUNCTION public.crn_cleanup_daily_xp_and_goals()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Reset daily XP for users whose last reset was yesterday or earlier in their timezone
    UPDATE public.user_skill_sysdata usd
    SET daily_xp = 0,
        last_daily_reset = current_timestamp
    FROM public.rsn_user u
    WHERE usd.rsn_user = u.id
    AND (usd.last_daily_reset AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date < 
        (current_timestamp AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date;

    -- Clear temporary daily XP goals from previous days
    UPDATE public.user_setting us1
    SET temporary_daily_xp_goal = NULL,
        temporary_daily_xp_goal_set_datetime = NULL
    FROM public.rsn_user u
    WHERE us1.rsn_user = u.id
    AND us1.temporary_daily_xp_goal IS NOT NULL
    AND (us1.temporary_daily_xp_goal_set_datetime AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date < 
        (current_timestamp AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date;
END;
$function$



------------------------------
-- END: PG_DUMP RESULT (FUNCTION: public.crn_cleanup_daily_xp_and_goals)
---------------------------------------------------------------------------
