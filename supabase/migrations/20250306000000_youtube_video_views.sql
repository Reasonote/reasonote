-- Drop old table if migration is rerun
DROP TABLE IF EXISTS youtube_video_views;
DROP TABLE IF EXISTS chrome_extension_event;

-- Create chrome_extension_event table
CREATE TABLE IF NOT EXISTS chrome_extension_event (
    id TEXT PRIMARY KEY DEFAULT generate_typed_uuid('chrextevt'),
    rsn_user_id TEXT NOT NULL REFERENCES rsn_user(id),
    site_url TEXT,
    page_title TEXT,
    event_type TEXT NOT NULL,
    metadata JSONB,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by TEXT REFERENCES rsn_user(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES rsn_user(id) ON DELETE SET NULL
);

-- Add comments to table and columns
COMMENT ON TABLE chrome_extension_event IS 'Events captured by the Chrome extension';
COMMENT ON COLUMN chrome_extension_event.id IS 'The unique identifier for the event';
COMMENT ON COLUMN chrome_extension_event.rsn_user_id IS 'The user that the event belongs to';
COMMENT ON COLUMN chrome_extension_event.site_url IS 'The URL of the site where the event occurred';
COMMENT ON COLUMN chrome_extension_event.page_title IS 'The title of the page where the event occurred';
COMMENT ON COLUMN chrome_extension_event.event_type IS 'The type of event (e.g., page_view)';
COMMENT ON COLUMN chrome_extension_event.metadata IS 'Additional metadata about the event, in JSON format';
COMMENT ON COLUMN chrome_extension_event.viewed_at IS 'When the event occurred from the user perspective';
COMMENT ON COLUMN chrome_extension_event.created_date IS 'When this record was created';
COMMENT ON COLUMN chrome_extension_event.updated_date IS 'When this record was last updated';
COMMENT ON COLUMN chrome_extension_event.created_by IS 'The user that created this record';
COMMENT ON COLUMN chrome_extension_event.updated_by IS 'The user that last updated this record';

-- Create indexes
CREATE INDEX idx_chrome_extension_event_rsn_user_id ON chrome_extension_event(rsn_user_id);
CREATE INDEX idx_chrome_extension_event_event_type ON chrome_extension_event(event_type);
CREATE INDEX idx_chrome_extension_event_viewed_at ON chrome_extension_event(viewed_at);

-- Add RLS policies
ALTER TABLE chrome_extension_event ENABLE ROW LEVEL SECURITY;

-- Policy for inserting - authenticated users can insert their own events
CREATE POLICY chrome_extension_event_insert_policy
    ON chrome_extension_event
    FOR INSERT
    TO authenticated
    WITH CHECK (rsn_user_id = current_rsn_user_id());

-- Policy for selecting - users can only see their own events
CREATE POLICY chrome_extension_event_select_policy
    ON chrome_extension_event
    FOR SELECT
    TO authenticated
    USING (rsn_user_id = current_rsn_user_id());

-- Policy for updating - users can only update their own events
CREATE POLICY chrome_extension_event_update_policy
    ON chrome_extension_event
    FOR UPDATE
    TO authenticated
    USING (rsn_user_id = current_rsn_user_id());

-- Policy for deleting - users can only delete their own events
CREATE POLICY chrome_extension_event_delete_policy
    ON chrome_extension_event
    FOR DELETE
    TO authenticated
    USING (rsn_user_id = current_rsn_user_id());

-- Allow the service role to access all events
CREATE POLICY chrome_extension_event_service_policy
    ON chrome_extension_event
    FOR ALL
    TO service_role
    USING (true);

-- Grant access to all roles
GRANT ALL ON TABLE chrome_extension_event TO anon;
GRANT ALL ON TABLE chrome_extension_event TO authenticated;
GRANT ALL ON TABLE chrome_extension_event TO service_role;

-- Add triggers for auditing
CREATE TRIGGER log_operation
AFTER INSERT OR DELETE OR UPDATE ON chrome_extension_event
FOR EACH ROW EXECUTE FUNCTION tgr_log_operation();

CREATE TRIGGER run_tgr_apply_audit
BEFORE INSERT OR UPDATE ON chrome_extension_event
FOR EACH ROW EXECUTE FUNCTION tgr_apply_audit();
