CREATE OR REPLACE FUNCTION get_activities_for_skill_paths(p_skill_paths jsonb, p_generated_for_user text default null, p_activity_type text default null)
RETURNS SETOF activity AS $$
  SELECT a.*
  FROM activity a
  WHERE (p_generated_for_user IS NULL OR a.generated_for_user = p_generated_for_user)
  AND (p_activity_type IS NULL OR a._type = p_activity_type)
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(a.generated_for_skill_paths) AS elem,
         jsonb_array_elements(p_skill_paths) AS input(sp)
    WHERE elem = input.sp
  );
$$ LANGUAGE sql STABLE;