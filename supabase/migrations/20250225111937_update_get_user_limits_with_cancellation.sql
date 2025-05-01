-- View for user's current licenses
CREATE OR REPLACE VIEW user_current_licenses AS
WITH sysdata_licenses AS (
    SELECT 
        auth_id,
        jsonb_each(COALESCE(extra_license_info, '{}'::jsonb)) as license_info
    FROM rsn_user_sysdata
)
SELECT 
    auth_id,
    (license_info).key as license_type,
    'sysdata' as source
FROM sysdata_licenses
WHERE (license_info).value::boolean = true
UNION ALL
SELECT 
    auth.id as auth_id,
    stripe_product_lookup_key as license_type,
    'stripe' as source
FROM public.get_user_stripe_subs_short() s
CROSS JOIN auth.users auth
WHERE auth.id = auth.uid();


-- Update get_user_limits function to include cancellation information
CREATE OR REPLACE FUNCTION public.get_user_limits()
 RETURNS TABLE(features jsonb, "currentPlan" jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id text;
    v_auth_id uuid;
    v_now timestamp;
    v_day_start timestamp;
    v_day_end timestamp;
    v_main_license_type text;
    v_is_anonymous boolean;
    v_is_canceled boolean := false;
    v_canceled_at timestamp;
    v_cancellation_reason text;
BEGIN
    -- Get current user info
    SELECT auth.id, auth.is_anonymous
    INTO v_auth_id, v_is_anonymous
    FROM auth.users auth
    WHERE auth.id = auth.uid();

    -- Calculate day boundaries
    v_now := now();
    v_day_start := date_trunc('day', v_now);
    v_day_end := v_day_start + interval '1 day' - interval '1 microsecond';

    -- Handle anonymous users
    IF v_auth_id IS NULL OR v_is_anonymous THEN
        RETURN QUERY SELECT 
            jsonb_build_array(
                jsonb_build_object(
                    'featureId', 'lessons_generated',
                    'isEnabled', true,
                    'usage', jsonb_build_object(
                        'periodStart', v_day_start,
                        'periodEnd', v_day_end,
                        'numberInPeriod', 0,
                        'numberInPeriodAllowed', 3,
                        'numberTotal', 0,
                        'numberTotalAllowed', 3,
                        'isUnlimitedPerPeriod', false,
                        'isUnlimitedTotal', false,
                        'isOverLimit', false
                    )
                )
            ) as features,
            jsonb_build_object(
                'type', 'Reasonote-Anonymous',
                'name', 'Anonymous',
                'isCanceled', false,
                'canceledAt', null,
                'cancellationReason', null
            ) as currentPlan;
        RETURN;
    END IF;

    -- Get RSN user ID from auth ID
    SELECT id INTO v_user_id
    FROM rsn_user
    WHERE auth_id = v_auth_id;

    -- Get main license type
    SELECT 
        CASE 
            WHEN bool_or(license_type = 'Reasonote-Admin') THEN 'Reasonote-Admin'
            WHEN bool_or(license_type = 'Reasonote-QA') THEN 'Reasonote-QA'
            WHEN array_length(array_agg(license_type), 1) > 0 THEN (array_agg(license_type))[1]
            ELSE 'Reasonote-Free'
        END INTO v_main_license_type
    FROM user_current_licenses
    WHERE auth_id = v_auth_id;

    -- Check for canceled subscriptions using customer ID
    SELECT 
        true, 
        canceled_at, 
        cancellation_reason
    INTO 
        v_is_canceled, 
        v_canceled_at, 
        v_cancellation_reason
    FROM stripe_subscriptions
    WHERE customer = (SELECT public.cur_user_stripe_customer_id())
    AND status = 'canceled'
    ORDER BY canceled_at DESC
    LIMIT 1;

    -- Return final result with usage from view
    RETURN QUERY 
    WITH usage_data AS (
        SELECT * FROM user_daily_feature_usage
        WHERE user_id = v_user_id
    )
    SELECT 
        jsonb_build_array(
            jsonb_build_object(
                'featureId', 'lessons_generated',
                'isEnabled', true,
                'usage', jsonb_build_object(
                    'periodStart', v_day_start,
                    'periodEnd', v_day_end,
                    'numberInPeriod', COALESCE((SELECT count_in_period FROM usage_data WHERE feature_id = 'lessons_generated'), 0),
                    'numberInPeriodAllowed', CASE 
                        WHEN v_main_license_type = 'Reasonote-Free' THEN 3
                        WHEN v_main_license_type = 'Reasonote-Pro' THEN 100
                        ELSE -1
                    END,
                    'numberTotal', COALESCE((SELECT count_in_period FROM usage_data WHERE feature_id = 'lessons_generated'), 0),
                    'numberTotalAllowed', CASE 
                        WHEN v_main_license_type = 'Reasonote-Free' THEN 3
                        WHEN v_main_license_type = 'Reasonote-Pro' THEN -1
                        ELSE -1
                    END,
                    'isUnlimitedPerPeriod', v_main_license_type IN ('Reasonote-Admin', 'Reasonote-QA'),
                    'isUnlimitedTotal', v_main_license_type IN ('Reasonote-Admin', 'Reasonote-QA'),
                    'isOverLimit', false
                )
            ),
            jsonb_build_object(
                'featureId', 'podcasts_generated',
                'isEnabled', true,
                'usage', jsonb_build_object(
                    'periodStart', v_day_start,
                    'periodEnd', v_day_end,
                    'numberInPeriod', COALESCE((SELECT count_in_period FROM usage_data WHERE feature_id = 'podcasts_generated'), 0),
                    'numberInPeriodAllowed', CASE 
                        WHEN v_main_license_type = 'Reasonote-Free' THEN 3
                        WHEN v_main_license_type = 'Reasonote-Pro' THEN 100
                        ELSE -1
                    END,
                    'numberTotal', COALESCE((SELECT count_in_period FROM usage_data WHERE feature_id = 'podcasts_generated'), 0),
                    'numberTotalAllowed', CASE 
                        WHEN v_main_license_type = 'Reasonote-Free' THEN 3
                        WHEN v_main_license_type = 'Reasonote-Pro' THEN -1
                        ELSE -1
                    END,
                    'isUnlimitedPerPeriod', v_main_license_type IN ('Reasonote-Admin', 'Reasonote-QA'),
                    'isUnlimitedTotal', v_main_license_type IN ('Reasonote-Admin', 'Reasonote-QA'),
                    'isOverLimit', false
                )
            ),
            jsonb_build_object(
                'featureId', 'practice_activities',
                'isEnabled', true,
                'usage', jsonb_build_object(
                    'periodStart', v_day_start,
                    'periodEnd', v_day_end,
                    'numberInPeriod', COALESCE((SELECT count_in_period FROM usage_data WHERE feature_id = 'practice_activities'), 0),
                    'numberInPeriodAllowed', CASE 
                        WHEN v_main_license_type = 'Reasonote-Free' THEN 3
                        WHEN v_main_license_type = 'Reasonote-Pro' THEN 100
                        ELSE -1
                    END,
                    'numberTotal', COALESCE((SELECT count_in_period FROM usage_data WHERE feature_id = 'practice_activities'), 0),
                    'numberTotalAllowed', CASE 
                        WHEN v_main_license_type = 'Reasonote-Free' THEN 3
                        WHEN v_main_license_type = 'Reasonote-Pro' THEN -1
                        ELSE -1
                    END,
                    'isUnlimitedPerPeriod', v_main_license_type IN ('Reasonote-Admin', 'Reasonote-QA'),
                    'isUnlimitedTotal', v_main_license_type IN ('Reasonote-Admin', 'Reasonote-QA'),
                    'isOverLimit', false
                )
            )
        ) as features,
        jsonb_build_object(
            'type', v_main_license_type,
            'name', CASE 
                WHEN v_main_license_type = 'Reasonote-Free' THEN 'Free'
                WHEN v_main_license_type = 'Reasonote-Pro' THEN 'Pro'
                WHEN v_main_license_type = 'Reasonote-Admin' THEN 'Admin'
                WHEN v_main_license_type = 'Reasonote-QA' THEN 'QA'
                WHEN v_main_license_type = 'Reasonote-Anonymous' THEN 'Anonymous'
                ELSE v_main_license_type
            END,
            'isCanceled', v_is_canceled,
            'canceledAt', v_canceled_at,
            'cancellationReason', v_cancellation_reason
        ) as currentPlan
    FROM (SELECT 1) as dummy_table;  -- Always returns one row
END;
$function$; 