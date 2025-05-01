------------------------------------------------------------------------------
-- BIG NOTE
------------------------------------------------------------------------------
-- THESE MUST BE MANUALLY APPLIED TO ENVIRONMENTS
-- This is because the local instance does not have stripe / Foreign Data Wrappers

------------------------------------------------------------------------------
-- Get the environment

CREATE OR REPLACE function public.env_name()
    RETURNS text
    LANGUAGE plpgsql
as $$
    begin
        -- LOCAL
        -- return 'LOCAL';
        -- DEV
        return 'DEV';
        -- PROD
        -- return 'PROD';
    end;
$$
;

GRANT EXECUTE ON FUNCTION public.env_name() TO anon;
GRANT EXECUTE ON FUNCTION public.env_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.env_name() TO service_role;

-- END: Get the environment
------------------------------------------------------------------------------



-------------------------------------------------------------------------------
-- A postgresql function which will fetch the current stripe id for the user.
CREATE OR REPLACE FUNCTION public.cur_user_stripe_customer_id(mock text default null)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
    stripe_id text;
BEGIN
    SELECT stripe_id
        FROM stripe.customers
        WHERE attrs->'metadata'->>'rsnUserId' = public.current_rsn_user_id()
        INTO stripe_id;

    RETURN stripe_id;
END;
$$
;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id TO anon;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id TO service_role;

-- END: A postgresql function which will fetch the current stripe id for the user.
-------------------------------------------------------------------------------


------------------------------------------------------------------------------
-- A postgresql function which will fetch the current stripe id for the user.
CREATE OR REPLACE FUNCTION public.get_user_stripe_subs_short(mock mock__get_user_stripe_subs_short DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    product_lookup_key TEXT,
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
        SELECT *
        FROM public.stripe_subscriptions AS s
        JOIN public.stripe_products AS p ON s.attrs->'plan'->>'product' = p.id
        WHERE s.customer = $1
    `;
    var subscriptionsResult = plv8.execute(getSubscriptionsQuery, [stripeCustomerId]);

    return subscriptionsResult;
$$
;

GRANT EXECUTE ON FUNCTION public.get_user_stripe_subs_short TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_stripe_subs_short TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stripe_subs_short TO service_role;

-- END: 
------------------------------------------------------------------------------