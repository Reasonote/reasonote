-- Add cancellation tracking fields to stripe_subscriptions table
ALTER TABLE public.stripe_subscriptions
ADD COLUMN IF NOT EXISTS canceled_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS status text;

-- Create an index for faster queries on subscription status
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON public.stripe_subscriptions(status);

-- Update the mock type for get_user_stripe_subs_short
DROP TYPE IF EXISTS mock__get_user_stripe_subs_short CASCADE;
CREATE TYPE mock__get_user_stripe_subs_short AS (
    id TEXT,
    product_lookup_key TEXT,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    status TEXT,
    canceled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Update the get_user_stripe_subs_short function to include cancellation information
CREATE OR REPLACE FUNCTION public.get_user_stripe_subs_short(mock mock__get_user_stripe_subs_short DEFAULT NULL::mock__get_user_stripe_subs_short)
RETURNS TABLE (
    stripe_subscription_id text,
    stripe_product_id text,
    stripe_product_name text,
    stripe_product_lookup_key text,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    status text,
    canceled_at timestamp without time zone,
    cancellation_reason text
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
            current_period_end,
            s.status,
            s.canceled_at,
            s.cancellation_reason
        FROM public.stripe_subscriptions AS s
        JOIN public.stripe_products AS p ON s.stripe_product_id = p.id
        WHERE s.customer = $1
    `;
    var subscriptionsResult = plv8.execute(getSubscriptionsQuery, [stripeCustomerId]);

    return subscriptionsResult;
$$;

-- Create a function to get user's canceled subscriptions
CREATE OR REPLACE FUNCTION public.get_user_canceled_subscriptions()
RETURNS TABLE (
    stripe_subscription_id TEXT,
    stripe_product_id TEXT,
    stripe_product_name TEXT,
    canceled_at TIMESTAMP,
    cancellation_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_id text;
BEGIN
    -- Get the customer ID for the current user
    SELECT public.cur_user_stripe_customer_id() INTO customer_id;
    
    IF customer_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        s.id as stripe_subscription_id, 
        s.stripe_product_id, 
        p.name as stripe_product_name,
        s.canceled_at,
        s.cancellation_reason
    FROM public.stripe_subscriptions AS s
    JOIN public.stripe_products AS p ON s.stripe_product_id = p.id
    WHERE s.customer = customer_id AND s.canceled_at IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_canceled_subscriptions() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_canceled_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_canceled_subscriptions() TO service_role; 