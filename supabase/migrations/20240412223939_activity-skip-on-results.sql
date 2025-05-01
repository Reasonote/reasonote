
ALTER TABLE user_activity_result
  ADD COLUMN skipped BOOLEAN DEFAULT FALSE;
ALTER TABLE user_activity_result
  ADD COLUMN skip_reason TEXT;

COMMENT ON COLUMN user_activity_result.skipped IS 'Whether the user skipped the activity';
COMMENT ON COLUMN user_activity_result.skip_reason IS 'The reason the user skipped the activity';

-- Migrate the metadata json property {skipped: true} to the new column
UPDATE user_activity_result
    SET skipped = TRUE
    WHERE metadata->>'skipped' = 'true';