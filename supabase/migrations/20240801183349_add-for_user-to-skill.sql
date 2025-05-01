ALTER TABLE skill ADD COLUMN for_user TEXT;

-- If there is a created_by value, set that to for_user
UPDATE skill SET for_user = created_by;
