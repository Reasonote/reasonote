
----------------------------------------------------------------------------
-- CLEAN UP REFERENCES TO OLD MEMAUTH
----------------------------------------------------------------------------
-- Drop old lesson policies
-- These are referenced by vw_lesson_memauth
DROP POLICY IF EXISTS "lesson SELECT" ON public.lesson;
DROP POLICY IF EXISTS "lesson UPDATE" ON public.lesson;
DROP POLICY IF EXISTS "lesson DELETE" ON public.lesson;

-- Drop vw_lesson_memauth if previously created
DROP VIEW IF EXISTS public.vw_lesson_memauth;

-- Drop type_matches_resource constraint
ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS one_resource_only_check;
ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS type_matches_resource;
ALTER TABLE public.memauth DROP COLUMN IF EXISTS resource_entity_type;


-- Drop all memauth entries, we'll recreate them in just a bit.
DELETE FROM public.memauth;


ALTER TABLE public.memauth DROP COLUMN IF EXISTS resource_entity_id;

-- Create new resource_entity_id column.
ALTER TABLE public.memauth
  ADD COLUMN resource_entity_id text NOT NULL;

COMMENT ON COLUMN public.memauth.resource_entity_id IS 'Identifier of the resource entity this authorization applies to, including its type prefix.';

----------------------------------------------------------------------------
-- entity_type abbrevitions
----------------------------------------------------------------------------
-- Clear out existing entity_type objects (just 'lesson' for now)
DELETE FROM public.access_level_permission;
DELETE FROM public.entity_type_access_level;
DELETE FROM public.entity_type;

-- Drop old resource columns.
ALTER TABLE public.memauth DROP COLUMN IF EXISTS resource_chat_id;
ALTER TABLE public.memauth DROP COLUMN IF EXISTS resource_bot_id;
ALTER TABLE public.memauth DROP COLUMN IF EXISTS resource_group_id;
ALTER TABLE public.memauth DROP COLUMN IF EXISTS resource_lesson_id;

-- Add abbreviation column
ALTER TABLE public.entity_type ADD COLUMN abbreviation text NOT NULL UNIQUE;
COMMENT ON COLUMN public.entity_type.abbreviation IS 'Short unique prefix that identifies the entity type from the resource_entity_id.';





----------------------------------------------------------------------------
-- MEMAUTH ENTITY CREATOR AUTHORIZATION
----------------------------------------------------------------------------




-- Now add it as a normal column
ALTER TABLE public.memauth ADD COLUMN resource_entity_type text;

-- Make not null check for resource_entity_type
ALTER TABLE public.memauth ADD CONSTRAINT resource_entity_type_non_null CHECK (resource_entity_type IS NOT NULL);

-- Create trigger to populate resource_entity_type from resource_entity_id
CREATE OR REPLACE FUNCTION public.tgr_set_memauth_entity_type()
RETURNS TRIGGER AS $$
DECLARE
  prefix text;
  matched_type text;
BEGIN
  -- Extract everything up to but not including the first underscore as the prefix
  prefix := substring(NEW.resource_entity_id from '^[^_]*'); -- This captures everything before underscore
  
  IF prefix IS NULL THEN
    RAISE EXCEPTION 'resource_entity_id "%" does not contain a known abbreviation', NEW.resource_entity_id;
  END IF;

  SELECT entity_type
    INTO matched_type
    FROM public.entity_type
    WHERE abbreviation = prefix;

  IF matched_type IS NULL THEN
    RAISE EXCEPTION 'No matching entity_type for abbreviation "%" from resource_entity_id "%"', prefix, NEW.resource_entity_id;
  END IF;

  NEW.resource_entity_type := matched_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.tgr_set_memauth_entity_type() IS 'Derives resource_entity_type from resource_entity_id prefix and entity_type.abbreviation.';

DROP TRIGGER IF EXISTS set_memauth_entity_type ON public.memauth;
CREATE TRIGGER set_memauth_entity_type
  BEFORE INSERT OR UPDATE ON public.memauth
  FOR EACH ROW
  EXECUTE FUNCTION public.tgr_set_memauth_entity_type();

-- Improve comments
COMMENT ON COLUMN public.memauth.resource_entity_type IS 'The type of the resource entity this authorization applies to. This is derived from the resource_entity_id prefix, via the entity_type table mapping from abbreviation -> entity_type';
COMMENT ON COLUMN public.memauth.resource_entity_id IS 'The identifier of the resource entity this authorization applies to. This is the full identifier, including the type prefix. The type prefix / abbreviationMUST exist in the entity_type table.';


-- Handle entity creator authorization
DROP FUNCTION IF EXISTS public.tgr_grant_entity_creator_authorization() CASCADE;

CREATE OR REPLACE FUNCTION public.tgr_grant_entity_creator_authorization()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the owner memauth using resource_entity_id directly
  INSERT INTO memauth (id, resource_entity_id, access_level, principal_user_id)
  VALUES (generate_typed_uuid('memauth'), NEW.id, 'owner', current_rsn_user_id());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.tgr_grant_entity_creator_authorization() IS 'Trigger that grants "owner" memauth to entity creator after inserting a new entity.';

-- Drop the constraint to check only one resource ID column is non-null
ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS one_resource_only_check;

-- Ensure memauth has is_public column and constraints (if not already done)
ALTER TABLE public.memauth ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Drop old constraints if they exist
ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS principal_or_public_check;
ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS no_principal_if_public;

-- First, drop any dependent objects
DROP VIEW IF EXISTS public.vw_entity_permissions;

-- Create vw_entity_permissions view
CREATE VIEW public.vw_entity_permissions AS
SELECT
  ma.resource_entity_type AS entity_type,
  ma.resource_entity_id AS entity_id,
  ma.principal_id,
  ma.is_public,
  array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions
FROM public.memauth ma
JOIN public.access_level_permission alp
  ON alp.entity_type = ma.resource_entity_type
 AND upper(alp.access_level) = upper(ma.access_level)
GROUP BY ma.resource_entity_type, ma.resource_entity_id, ma.principal_id, ma.is_public;

COMMENT ON VIEW public.vw_entity_permissions IS 'Aggregated permissions for each entity and principal/public.';
GRANT SELECT ON public.vw_entity_permissions TO anon, authenticated, service_role;



-- Drop old memauth policies if any
DROP POLICY IF EXISTS memauth__authenticated__select ON public.memauth;
DROP POLICY IF EXISTS memauth__authenticated__insert ON public.memauth;
DROP POLICY IF EXISTS memauth__authenticated__update ON public.memauth;
DROP POLICY IF EXISTS memauth__authenticated__delete ON public.memauth;

-- Recreate memauth RLS policies using vw_entity_permissions
CREATE POLICY memauth__authenticated__select ON public.memauth FOR SELECT TO authenticated
USING (
  (
    -- You can read any memauth entry you are the principal for.
    principal_user_id = current_rsn_user_id()
    OR
    -- When an entity is public, anyone can read its memauth entries.
    EXISTS (
      SELECT 1
      FROM vw_entity_permissions vep
      WHERE vep.entity_type = memauth.resource_entity_type
        AND vep.entity_id = memauth.resource_entity_id
        AND vep.is_public = true
    )
    OR
    -- You can read the memauth for a non-public entity if there is a memauch such that:
    -- 1. You are the principal
    -- 2. The entity type and id match
    EXISTS (
      SELECT 1
      FROM vw_entity_permissions vep
      WHERE vep.entity_type = memauth.resource_entity_type
        AND vep.entity_id = memauth.resource_entity_id
        AND vep.principal_id = current_rsn_user_id()
    )
    OR is_admin()
  )
);

CREATE POLICY memauth__authenticated__insert ON public.memauth FOR INSERT TO authenticated
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM vw_entity_permissions vep
      WHERE vep.entity_type = memauth.resource_entity_type
        AND vep.entity_id = memauth.resource_entity_id
        AND (
          vep.principal_id = current_rsn_user_id()
          OR vep.is_public = true
        )
        AND (memauth.resource_entity_type || '.SHARE') = ANY(vep.permissions)
    )
    OR is_admin()
  )
  AND (
    memauth.access_level != 'owner' OR is_admin()
  )
);

CREATE POLICY memauth__authenticated__update ON public.memauth FOR UPDATE TO authenticated
USING (
  (
    EXISTS (
      SELECT 1
      FROM vw_entity_permissions vep
      WHERE vep.entity_type = memauth.resource_entity_type
        AND vep.entity_id = memauth.resource_entity_id
        AND (
          vep.principal_id = current_rsn_user_id()
          OR vep.is_public = true
        )
        AND (memauth.resource_entity_type || '.SHARE') = ANY(vep.permissions)
    )
    AND (
      memauth.access_level != 'owner' OR is_admin()
    )
  )
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM vw_entity_permissions vep
      WHERE vep.entity_type = memauth.resource_entity_type
        AND vep.entity_id = memauth.resource_entity_id
        AND (
          vep.principal_id = current_rsn_user_id()
          OR vep.is_public = true
        )
        AND (memauth.resource_entity_type || '.SHARE') = ANY(vep.permissions)
    )
    OR is_admin()
  )
  AND (
    memauth.access_level != 'owner' OR is_admin()
  )
);

CREATE POLICY memauth__authenticated__delete ON public.memauth FOR DELETE TO authenticated
USING (
  (
    EXISTS (
      SELECT 1
      FROM vw_entity_permissions vep
      WHERE vep.entity_type = memauth.resource_entity_type
        AND vep.entity_id = memauth.resource_entity_id
        AND (
          vep.principal_id = current_rsn_user_id()
          OR vep.is_public = true
        )
        AND (memauth.resource_entity_type || '.SHARE') = ANY(vep.permissions)
    )
    OR is_admin()
  )
  AND (
    memauth.access_level != 'owner' OR is_admin()
  )
);





ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS one_principal_only_check;
ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS no_principal_if_public;


-- TODO: re-add these as triggers, for dynamic-ness?
-- -- Re-add constraints to allow public or one principal
-- ALTER TABLE public.memauth DROP CONSTRAINT IF EXISTS one_principal_only_check;
-- ALTER TABLE public.memauth
--   ADD CONSTRAINT principal_or_public_check CHECK (
--     (
--       ((principal_user_id IS NOT NULL)::integer +
--        (principal_bot_id IS NOT NULL)::integer +
--        (principal_group_id IS NOT NULL)::integer
--       ) = 1
--     ) OR is_public = true
--   );

-- ALTER TABLE public.memauth
--   ADD CONSTRAINT no_principal_if_public CHECK (
--     is_public = false OR (
--       principal_user_id IS NULL
--       AND principal_bot_id IS NULL
--       AND principal_group_id IS NULL
--     )
--   );