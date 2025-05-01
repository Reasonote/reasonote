-- Create email_subscription table
CREATE TABLE public.email_subscription (
    id text PRIMARY KEY DEFAULT generate_typed_uuid('emailsub'),
    rsn_user_id text REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    product_updates boolean NOT NULL DEFAULT true,
    edtech_updates boolean NOT NULL DEFAULT true,
    newsletter boolean NOT NULL DEFAULT true,
    account_updates boolean GENERATED ALWAYS AS (true) STORED,
    created_date timestamptz DEFAULT now() NOT NULL,
    updated_date timestamptz DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT email_subscription_id_check CHECK (public.is_valid_typed_uuid('emailsub', id)),
    UNIQUE (rsn_user_id)
);

-- Create index for faster lookups
CREATE INDEX email_subscription_rsn_user_id_idx ON public.email_subscription(rsn_user_id);

-- Create trigger to automatically update the updated_date column
CREATE TRIGGER tgr_apply_audit_email_subscription
    BEFORE UPDATE ON public.email_subscription
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_apply_audit();

-- Create RLS policies
ALTER TABLE public.email_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON public.email_subscription FOR SELECT
    USING (current_rsn_user_id()::text = rsn_user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON public.email_subscription FOR UPDATE
    USING (current_rsn_user_id()::text = rsn_user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON public.email_subscription FOR INSERT
    WITH CHECK (current_rsn_user_id()::text = rsn_user_id);

-- Function to get or create email subscriptions for a user
CREATE OR REPLACE FUNCTION get_or_create_email_subscription(p_user_id text)
RETURNS SETOF email_subscription AS $$
BEGIN
    -- Try to find existing subscriptions
    RETURN QUERY
        SELECT * FROM email_subscription WHERE user_id = p_user_id;
    
    -- If no rows returned, insert a new row
    IF NOT FOUND THEN
        RETURN QUERY
        INSERT INTO email_subscription (user_id, created_by, updated_by)
        VALUES (p_user_id, p_user_id, p_user_id)
        RETURNING *;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for logging operations
CREATE TRIGGER log_operation
    AFTER INSERT OR DELETE OR UPDATE ON public.email_subscription
    FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();