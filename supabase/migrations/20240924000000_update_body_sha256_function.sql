-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the function to use digest and convert_to
CREATE OR REPLACE FUNCTION update_body_sha_256() 
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        -- Double backslashes to ensure proper escaping
        NEW.body := replace(NEW.body, '\\', '\\\\');

        -- Convert the text to bytea using UTF8 encoding and compute SHA-256 hash
        NEW.body_sha_256 := encode(digest(convert_to(NEW.body, 'UTF8'), 'sha256'), 'hex');

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to update body_sha_256 for record with body: %', NEW.body;
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS trigger_update_body_sha_256 ON rsn_page;
CREATE TRIGGER trigger_update_body_sha_256
    BEFORE INSERT OR UPDATE ON rsn_page
    FOR EACH ROW
    EXECUTE FUNCTION update_body_sha_256();

-- Update existing records to recalculate body_sha_256
UPDATE rsn_page
SET body = body;  -- This will trigger the update_body_sha_256 function for all existing rows