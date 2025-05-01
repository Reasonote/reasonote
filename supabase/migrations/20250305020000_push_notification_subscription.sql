-- Create push_notification_subscription table
CREATE TABLE public.push_notification_subscription (
    id text DEFAULT public.generate_typed_uuid('pushsub'::text) NOT NULL,
    rsn_user_id text NOT NULL,
    _endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    last_used_date timestamp with time zone,
    CONSTRAINT push_notification_subscription_id_check CHECK (public.is_valid_typed_uuid('pushsub'::text, (id)::public.typed_uuid))
);

-- Add primary key
ALTER TABLE ONLY public.push_notification_subscription
    ADD CONSTRAINT push_notification_subscription_pkey PRIMARY KEY (id);

-- Add index on rsn_user_id for faster lookups
CREATE INDEX push_notification_subscription_rsn_user_id_idx ON public.push_notification_subscription USING btree (rsn_user_id);

-- Add unique constraint on endpoint to prevent duplicate subscriptions
CREATE UNIQUE INDEX push_notification_subscription_endpoint_idx ON public.push_notification_subscription USING btree (_endpoint);

-- Add foreign key constraints
ALTER TABLE ONLY public.push_notification_subscription
    ADD CONSTRAINT push_notification_subscription_rsn_user_id_fkey FOREIGN KEY (rsn_user_id) REFERENCES public.rsn_user(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.push_notification_subscription
    ADD CONSTRAINT push_notification_subscription_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.push_notification_subscription
    ADD CONSTRAINT push_notification_subscription_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.rsn_user(id) ON DELETE SET NULL;

-- Add triggers for auditing
CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.push_notification_subscription FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

CREATE TRIGGER tgr_apply_audit_push_notification_subscription BEFORE UPDATE ON public.push_notification_subscription FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Add RLS policies
ALTER TABLE public.push_notification_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own push subscriptions" ON public.push_notification_subscription 
    FOR INSERT WITH CHECK (((public.current_rsn_user_id())::text = rsn_user_id));

CREATE POLICY "Users can update their own push subscriptions" ON public.push_notification_subscription 
    FOR UPDATE USING (((public.current_rsn_user_id())::text = rsn_user_id));

CREATE POLICY "Users can view their own push subscriptions" ON public.push_notification_subscription 
    FOR SELECT USING (((public.current_rsn_user_id())::text = rsn_user_id));

CREATE POLICY "Users can delete their own push subscriptions" ON public.push_notification_subscription 
    FOR DELETE USING (((public.current_rsn_user_id())::text = rsn_user_id));

-- Grant permissions
GRANT ALL ON TABLE public.push_notification_subscription TO anon;
GRANT ALL ON TABLE public.push_notification_subscription TO authenticated;
GRANT ALL ON TABLE public.push_notification_subscription TO service_role; 