-- Add ui_theme column to user_setting table
ALTER TABLE user_setting 
ADD COLUMN ui_theme text 
CHECK (ui_theme IN ('light', 'dark', 'system'))
DEFAULT 'system';

-- Add comment for documentation
COMMENT ON COLUMN user_setting.ui_theme IS 'User interface theme preference - either light or dark mode';
