

-- Add 'interest_reasons' column to 'user_skill' table
ALTER TABLE user_skill ADD COLUMN interest_reasons text[];

-- Add 'result_data' column to 'user_activity_result' table
ALTER TABLE user_activity_result ADD COLUMN result_data jsonb;