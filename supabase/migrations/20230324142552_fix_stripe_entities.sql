
--------------------------------------------------------------------------
-- Fix Stripe customer select policy

DROP POLICY "stripe_customers SELECT" ON public.stripe_customers;
CREATE POLICY "stripe_customers SELECT" ON public.stripe_customers FOR SELECT USING (auth.role() = 'service_role' OR attrs->>'rsnUserId' = public.current_rsn_user_id());

-- END: Fix Stripe customer select policy
--------------------------------------------------------------------------

--------------------------------------------------------------------------
-- Fix Stripe generated columns

ALTER TABLE public.stripe_subscriptions
    ADD COLUMN IF NOT EXISTS stripe_product_id text
    GENERATED ALWAYS AS (items->'data'->0->'price'->>'product') STORED;

-- END: Fix Stripe generated columns
--------------------------------------------------------------------------


--------------------------------------------------------------------------
-- Fix customer id fetching function

CREATE OR REPLACE FUNCTION public.cur_user_stripe_customer_id(mock text default null)
    RETURNS text
    LANGUAGE plpgsql
AS $$
DECLARE
    stripe_id_ret text;
BEGIN
    SELECT id 
        FROM stripe_customers
        WHERE attrs->>'rsnUserId' = public.current_rsn_user_id()
        INTO stripe_id_ret;

    RETURN stripe_id_ret;
END;
$$
;

GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id TO anon;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id TO service_role;

-- END: Fix customer id fetching function
--------------------------------------------------------------------------

--------------------------------------------------------------------------
-- Add a function to get the user's stripe subscriptions

DROP FUNCTION public.get_user_stripe_subs_short(mock mock__get_user_stripe_subs_short);
CREATE OR REPLACE FUNCTION public.get_user_stripe_subs_short(mock mock__get_user_stripe_subs_short DEFAULT NULL)
RETURNS TABLE (
    stripe_subscription_id TEXT,
    stripe_product_id TEXT,
    stripe_product_name TEXT,
    stripe_product_lookup_key TEXT,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP
)
LANGUAGE plv8
AS $$
    var customerIdResult = plv8.execute(`SELECT public.cur_user_stripe_customer_id() as stripe_customer_id;`);

    if (customerIdResult.length === 0) {
        throw new Error('Customer ID not found for the given user');
    }

    var stripeCustomerId = customerIdResult[0].stripe_customer_id;

    var getSubscriptionsQuery = `
        SELECT 
            s.id as stripe_subscription_id, 
            s.stripe_product_id, 
            p.name as stripe_product_name,
            p.name as stripe_product_lookup_key, 
            current_period_start, 
            current_period_end
        FROM public.stripe_subscriptions AS s
        JOIN public.stripe_products AS p ON s.stripe_product_id = p.id
        WHERE s.customer = $1
    `;
    var subscriptionsResult = plv8.execute(getSubscriptionsQuery, [stripeCustomerId]);

    return subscriptionsResult;
$$
;

GRANT EXECUTE ON FUNCTION public.get_user_stripe_subs_short TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_stripe_subs_short TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stripe_subs_short TO service_role;

-- END: Add a function to get the user's stripe subscriptions
--------------------------------------------------------------------------