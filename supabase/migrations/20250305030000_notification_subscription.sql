-- Create notification_subscription table
CREATE TABLE public.notification_subscription (
    id text DEFAULT public.generate_typed_uuid('notisub'::text) NOT NULL,
    rsn_user_id text NOT NULL,
    daily_streak boolean DEFAULT false NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    CONSTRAINT notification_subscription_id_check CHECK (public.is_valid_typed_uuid('notisub'::text, (id)::public.typed_uuid))
);

-- Add primary key
ALTER TABLE ONLY public.notification_subscription
    ADD CONSTRAINT notification_subscription_pkey PRIMARY KEY (id);

-- Add unique constraint on rsn_user_id to ensure one record per user
ALTER TABLE ONLY public.notification_subscription
    ADD CONSTRAINT notification_subscription_rsn_user_id_key UNIQUE (rsn_user_id);

-- Add index on rsn_user_id for faster lookups
CREATE INDEX notification_subscription_rsn_user_id_idx ON public.notification_subscription USING btree (rsn_user_id);

-- Add foreign key constraints
ALTER TABLE ONLY public.notification_subscription
    ADD CONSTRAINT notification_subscription_rsn_user_id_fkey FOREIGN KEY (rsn_user_id) REFERENCES public.rsn_user(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notification_subscription
    ADD CONSTRAINT notification_subscription_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.notification_subscription
    ADD CONSTRAINT notification_subscription_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;

-- Add triggers for auditing
CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.notification_subscription FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

CREATE TRIGGER tgr_apply_audit_notification_subscription BEFORE UPDATE ON public.notification_subscription FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Add RLS policies
ALTER TABLE public.notification_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own notification subscriptions" ON public.notification_subscription 
    FOR INSERT WITH CHECK (((public.current_rsn_user_id())::text = rsn_user_id));

CREATE POLICY "Users can update their own notification subscriptions" ON public.notification_subscription 
    FOR UPDATE USING (((public.current_rsn_user_id())::text = rsn_user_id));

CREATE POLICY "Users can view their own notification subscriptions" ON public.notification_subscription 
    FOR SELECT USING (((public.current_rsn_user_id())::text = rsn_user_id));

CREATE POLICY "Users can delete their own notification subscriptions" ON public.notification_subscription 
    FOR DELETE USING (((public.current_rsn_user_id())::text = rsn_user_id));

-- Grant permissions
GRANT ALL ON TABLE public.notification_subscription TO anon;
GRANT ALL ON TABLE public.notification_subscription TO authenticated;
GRANT ALL ON TABLE public.notification_subscription TO service_role;

-- Function to get or create notification subscriptions for a user
CREATE OR REPLACE FUNCTION get_or_create_notification_subscription(p_user_id text)
RETURNS SETOF notification_subscription AS $$
DECLARE
    current_user_id text;
BEGIN
    -- Get the current user ID
    current_user_id := (public.current_rsn_user_id())::text;
    
    -- Check if the provided user ID matches the current user ID
    IF p_user_id != current_user_id THEN
        RAISE EXCEPTION 'You can only manage notification subscriptions for yourself';
    END IF;
    
    -- Try to find existing subscription
    RETURN QUERY
    SELECT * FROM notification_subscription
    WHERE rsn_user_id = p_user_id;
    
    -- If no rows returned, create a new subscription
    IF NOT FOUND THEN
        RETURN QUERY
        INSERT INTO notification_subscription (rsn_user_id, created_by, updated_by)
        VALUES (p_user_id, p_user_id, p_user_id)
        RETURNING *;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 