-- Add `for_user` to integrations table
ALTER TABLE integration ADD COLUMN for_user text REFERENCES public.rsn_user(id) ON DELETE SET NULL;

-- Delete existing policies
DROP POLICY "integration SELECT" ON integration;
DROP POLICY "integration INSERT" ON integration;
DROP POLICY "integration UPDATE" ON integration;
DROP POLICY "integration DELETE" ON integration;

-- Delete existing policies
DROP POLICY "integration_token SELECT" ON integration_token;
DROP POLICY "integration_token INSERT" ON integration_token;
DROP POLICY "integration_token UPDATE" ON integration_token;
DROP POLICY "integration_token DELETE" ON integration_token;

-- Add proper permissions for intgrations table, allowing CRUD only if the integration is for the user
ALTER TABLE integration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration SELECT" ON integration FOR SELECT USING (for_user = current_rsn_user_id());
CREATE POLICY "integration INSERT" ON integration FOR INSERT WITH CHECK (for_user = current_rsn_user_id());
CREATE POLICY "integration UPDATE" ON integration FOR UPDATE USING (for_user = current_rsn_user_id());
CREATE POLICY "integration DELETE" ON integration FOR DELETE USING (for_user = current_rsn_user_id());

-- Add a property "Last Synced" to the integration table
ALTER TABLE integration ADD COLUMN last_synced timestamp with time zone;

-- Permissions for integration_token table are the same, just join on the integration table
ALTER TABLE integration_token ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_token SELECT" ON integration_token FOR SELECT USING (
    (SELECT for_user FROM integration WHERE id = integration_id) = current_rsn_user_id()
);
CREATE POLICY "integration_token INSERT" ON integration_token FOR INSERT WITH CHECK (
    (SELECT for_user FROM integration WHERE id = integration_id) = current_rsn_user_id()
);
CREATE POLICY "integration_token UPDATE" ON integration_token FOR UPDATE USING (
    (SELECT for_user FROM integration WHERE id = integration_id) = current_rsn_user_id()
);
CREATE POLICY "integration_token DELETE" ON integration_token FOR DELETE USING (
    (SELECT for_user FROM integration WHERE id = integration_id) = current_rsn_user_id()
);

-- Add `source_integration` to snip table
ALTER TABLE snip ADD COLUMN source_integration text REFERENCES public.integration(id) ON DELETE SET NULL;

ALTER TABLE snip ADD COLUMN source_uniq_id text;

-- snip source_uniq_id needs to be unique if source_uniq_id is not null
ALTER TABLE snip ADD CONSTRAINT source_uniq_id_unique UNIQUE (source_uniq_id);