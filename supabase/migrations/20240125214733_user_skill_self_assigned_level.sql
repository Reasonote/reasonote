ALTER TABLE user_skill ADD COLUMN self_assigned_level text;

-- Now, take things from user_skill.metadata->"selfAssessment"->>"attestedLevel" and put them in user_skill.self_assigned_level
-- Convert to uppercase.
UPDATE user_skill SET self_assigned_level = metadata->'selfAssessment'->>'attestedLevel';
UPDATE user_skill SET self_assigned_level = UPPER(self_assigned_level);