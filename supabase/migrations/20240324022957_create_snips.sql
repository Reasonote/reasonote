-- Enable the http extension
CREATE EXTENSION http;

-- Create snips
CREATE TABLE public.snip (
    id text DEFAULT public.generate_typed_uuid('snip'::text) NOT NULL,
    _name text DEFAULT 'Snip on ' || now() NOT NULL,
    _type text NOT NULL, -- Text only for now.
    source_url text,
    text_content text,
    metadata jsonb,
    _owner text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT snip_pkey PRIMARY KEY (id),
    CONSTRAINT snip_id_check CHECK (public.is_valid_typed_uuid('snip'::text, id::public.typed_uuid))
);

COMMENT ON COLUMN public.snip.id IS 'The unique identifier for the snip.';
COMMENT ON COLUMN public.snip._type IS 'The type of snip. For now, this is text only.';
COMMENT ON COLUMN public.snip.source_url IS 'The URL where the snip was sourced from.';
COMMENT ON COLUMN public.snip.metadata IS 'The metadata for the snip.';
COMMENT ON COLUMN public.snip._owner IS 'The owner of the snip. NOTE: If null, there is a limited (2m) window where this record is open for anyone to claim.';
COMMENT ON COLUMN public.snip.created_date IS 'The date that this snip was created.';
COMMENT ON COLUMN public.snip.updated_date IS 'The date that this snip was last updated.';
COMMENT ON COLUMN public.snip.created_by IS 'The user that created this snip.';
COMMENT ON COLUMN public.snip.updated_by IS 'The user that last updated this snip.';
COMMENT ON TABLE public.snip IS 'An snip is a tool that can be used to analyze a document or a set of documents.';

-- Permissions
ALTER TABLE public.snip ENABLE ROW LEVEL SECURITY;

-- Owner can do anything.
-- If owner is null, AND this was created in the last 2 minutes, then anyone can do anything.
CREATE POLICY "snip DELETE" ON public.snip FOR DELETE USING (
    ((current_rsn_user_id())::text = (_owner)::text) OR (_owner IS NULL AND (now() - created_date) < interval '2 minutes')
);
CREATE POLICY "snip INSERT" ON public.snip FOR
    INSERT WITH CHECK (
        ((current_rsn_user_id())::text = (_owner)::text) OR (_owner IS NULL AND (now() - created_date) < interval '2 minutes')
    );
CREATE POLICY "snip SELECT" ON public.snip FOR
    SELECT USING (
        ((current_rsn_user_id())::text = (_owner)::text) OR (_owner IS NULL AND (now() - created_date) < interval '2 minutes')
    );
CREATE POLICY "snip UPDATE" ON public.snip FOR
    UPDATE USING (
        ((current_rsn_user_id())::text = (_owner)::text) OR (_owner IS NULL AND (now() - created_date) < interval '2 minutes')
    );

GRANT ALL ON TABLE public.snip TO anon;
GRANT ALL ON TABLE public.snip TO authenticated;
GRANT ALL ON TABLE public.snip TO service_role;

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
    OR
    UPDATE ON public.snip FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
    OR DELETE
    OR UPDATE 
    ON public.snip FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

CREATE OR REPLACE FUNCTION update_name() 
RETURNS TRIGGER AS $$
BEGIN
    -- If name is null or empty, set it to a default value.
    IF NEW._name IS NULL OR NEW._name ~ '^\s*$' THEN
        NEW._name := 'Snip on ' || to_char(NOW(), 'Day, Mon DD, HH12:MIpm');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_name_trigger
    BEFORE INSERT ON public.snip
    FOR EACH ROW
    EXECUTE FUNCTION update_name();


SELECT cron.schedule (
  'crn_process_queue', -- name of the cron job
  '* * * * *', -- Every minute
  $$ 
    SELECT net.http_post(
        url:= reasonote_app_url() || '/api/internal/snip_extract_text_cron',
        headers:= format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', anon_key())::jsonb,
        body:=concat('{}')::jsonb
      ) as request_id;
  $$
);