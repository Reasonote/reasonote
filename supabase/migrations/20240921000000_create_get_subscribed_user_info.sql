-- Create the function
CREATE OR REPLACE FUNCTION public.get_subscribed_user_info(groups TEXT[])
RETURNS TABLE (
  id TEXT,
  auth_email TEXT,
  given_name TEXT,
  family_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_columns TEXT[];
  group_name TEXT;
  query_parts TEXT[];
BEGIN
  -- Check if the user is an admin
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;

  -- Get all boolean columns from email_subscription table
  SELECT array_agg(column_name::TEXT)
  INTO valid_columns
  FROM information_schema.columns
  WHERE table_name = 'email_subscription'
    AND data_type = 'boolean';

  -- Validate groups and build query parts
  query_parts := ARRAY[]::TEXT[];
  FOREACH group_name IN ARRAY groups
  LOOP
    IF group_name = ANY(valid_columns) THEN
      query_parts := array_append(query_parts, format('%I = true', group_name));
    ELSE
      RAISE EXCEPTION 'Invalid group: %', group_name;
    END IF;
  END LOOP;

  -- Build and execute the dynamic query
  RETURN QUERY EXECUTE format('
    WITH subscribed_users AS (
      SELECT DISTINCT es.rsn_user_id
      FROM email_subscription es
      WHERE (%s)
        AND es.rsn_user_id IS NOT NULL
    ),
    users_without_subscriptions AS (
      SELECT ru.id
      FROM rsn_user ru
      LEFT JOIN email_subscription es ON ru.id = es.rsn_user_id
      WHERE es.rsn_user_id IS NULL
    )
    SELECT 
      ru.id,
      ru.auth_email,
      ru.given_name,
      ru.family_name
    FROM rsn_user ru
    WHERE ru.id IN (
      SELECT rsn_user_id FROM subscribed_users
      UNION
      SELECT id FROM users_without_subscriptions
    )',
    array_to_string(query_parts, ' OR ')
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_subscribed_user_info(TEXT[]) TO authenticated;