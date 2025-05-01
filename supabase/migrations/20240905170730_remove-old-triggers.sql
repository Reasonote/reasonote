-- Disable and drop triggers
ALTER TABLE rsn_page DISABLE TRIGGER tgr_rsn_page_vec_queue_insert;
ALTER TABLE rsn_page DISABLE TRIGGER tgr_rsn_page_vec_queue_update;

DROP TRIGGER IF EXISTS tgr_rsn_page_vec_queue_insert ON rsn_page;
DROP TRIGGER IF EXISTS tgr_rsn_page_vec_queue_update ON rsn_page;

-- Step 1: Drop the generated column if it exists
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'rsn_page' 
        AND column_name = 'body_sha_256') > 0 THEN
        ALTER TABLE rsn_page DROP COLUMN body_sha_256;
    END IF;
END $$;

-- Step 2: Add the regular body_sha_256 column
ALTER TABLE rsn_page
  ADD COLUMN body_sha_256 text;

-- Step 3: Create the trigger function to update body_sha_256
CREATE OR REPLACE FUNCTION update_body_sha_256() 
RETURNS TRIGGER AS $$
BEGIN
    -- Double backslashes and calculate SHA-256 hash
    NEW.body_sha_256 := encode(sha256(replace(NEW.body, '\\', '\\\\')::bytea), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Step 4: Create the trigger to execute the function before insert or update
-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_body_sha_256 ON rsn_page;
CREATE TRIGGER trigger_update_body_sha_256
    BEFORE INSERT OR UPDATE ON rsn_page
    FOR EACH ROW
    EXECUTE FUNCTION update_body_sha_256();