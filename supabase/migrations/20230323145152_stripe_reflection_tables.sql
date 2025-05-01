

-------------------------------------------------------

----CREATE TABLES
CREATE TABLE public.stripe_products (
  id text NOT NULL PRIMARY KEY,
  name text,
  active bool,
  default_price text,
  description text,
  created timestamp,
  updated timestamp,
  attrs jsonb
);
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_products DELETE" ON public.stripe_products FOR DELETE USING (auth.role()= 'service_role');
CREATE POLICY "stripe_products INSERT" ON public.stripe_products FOR INSERT WITH CHECK (auth.role()= 'service_role');
CREATE POLICY "stripe_products SELECT" ON public.stripe_products FOR SELECT USING (true);
CREATE POLICY "stripe_products UPDATE" ON public.stripe_products FOR UPDATE USING (auth.role()= 'service_role');
GRANT ALL ON TABLE public.stripe_products TO anon;
GRANT ALL ON TABLE public.stripe_products TO authenticated;
GRANT ALL ON TABLE public.stripe_products TO service_role;

-------------------------------------------------------

CREATE TABLE public.stripe_subscriptions (
  id text NOT NULL PRIMARY KEY,
  customer text,
  currency text,
  items jsonb,
  current_period_start timestamp,
  current_period_end timestamp,
  attrs jsonb
);
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_subscriptions DELETE" ON public.stripe_subscriptions FOR DELETE USING (auth.role()= 'service_role');
CREATE POLICY "stripe_subscriptions INSERT" ON public.stripe_subscriptions FOR INSERT WITH CHECK (auth.role()= 'service_role');
CREATE POLICY "stripe_subscriptions SELECT" ON public.stripe_subscriptions FOR SELECT USING (auth.role()='service_role' OR public.cur_user_stripe_customer_id() = customer);
CREATE POLICY "stripe_subscriptions UPDATE" ON public.stripe_subscriptions FOR UPDATE USING (auth.role()= 'service_role');
GRANT ALL ON TABLE public.stripe_subscriptions TO anon;
GRANT ALL ON TABLE public.stripe_subscriptions TO authenticated;
GRANT ALL ON TABLE public.stripe_subscriptions TO service_role;

-------------------------------------------------------


CREATE TABLE public.stripe_customers (
  id text NOT NULL PRIMARY KEY,
  email text,
  name text,
  description text,
  created timestamp,
  attrs jsonb
);
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_customers DELETE" ON public.stripe_customers FOR DELETE USING (auth.role() = 'service_role');
CREATE POLICY "stripe_customers INSERT" ON public.stripe_customers FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "stripe_customers SELECT" ON public.stripe_customers FOR SELECT USING (auth.role() = 'service_role' OR attrs->'metadata'->>'rsnUserId' = public.current_rsn_user_id());
CREATE POLICY "stripe_customers UPDATE" ON public.stripe_customers FOR UPDATE USING (auth.role() = 'service_role');

-------------------------------------------------------------------------------
-- A postgresql function which will fetch the current stripe id for the user.
CREATE OR REPLACE FUNCTION public.cur_user_stripe_customer_id(mock text default null)
    RETURNS text
    LANGUAGE plpgsql
AS $$
DECLARE
    stripe_id_ret text;
BEGIN
    SELECT id 
        FROM stripe_customers
        WHERE attrs->'metadata'->>'rsnUserId' = public.current_rsn_user_id()
        INTO stripe_id_ret;

    RETURN stripe_id_ret;
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
    // Get customerId
    var customerIdResult = plv8.execute(`SELECT public.cur_user_stripe_customer_id() as stripe_customer_id;`);
    if (customerIdResult.length === 0) {
        throw new Error('Customer ID not found for the given user');
    }
    var stripeCustomerId = customerIdResult[0].stripe_customer_id;

    /* Get subscriptions */
    var getSubscriptionsQuery = `
        SELECT s.id AS id,
               p.attrs->'lookup_key' AS product_lookup_key,
               to_timestamp((s.attrs->'current_period_start')::bigint) AS current_period_start,
               to_timestamp((s.attrs->'current_period_end')::bigint) AS current_period_end,
               s.items->'data'->0->'price'->>'product' AS product_id
        FROM public.stripe_subscriptions AS s
        JOIN public.stripe_products AS p ON s.items->'data'->0->'price'->>'product' = p.id
        WHERE s.customer = $1;
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