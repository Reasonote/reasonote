import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import prompts from 'prompts';

import { Command } from '@commander-js/extra-typings';

import { CommandAction } from '../../_utils/commander';

// Helper to generate SQL migration content
function generateSqlMigration(entity: string, idColumn: string, abbreviation: string): string {
  return `----------------------------------------------------------------------------
----------------------------------------------------------------------------
-- ${entity} Authorization Setup
----------------------------------------------------------------------------
----------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- Insert the ${entity} entity type (if needed)
--------------------------------------------------------------------------------
INSERT INTO public.entity_type (entity_type, abbreviation) VALUES 
  ('${entity}', '${abbreviation}') 
ON CONFLICT (entity_type) DO NOTHING;

-- Attach the trigger to the ${entity} table
DROP TRIGGER IF EXISTS grant_${entity}_creator_auth ON public.${entity};
CREATE TRIGGER grant_${entity}_creator_auth
  AFTER INSERT ON public.${entity}
  FOR EACH ROW
  EXECUTE PROCEDURE public.tgr_grant_entity_creator_authorization('${idColumn}', '${entity}');

--------------------------------------------------------------------------------
-- Recreate vw_${entity}_memauth view
--------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_${entity}_memauth;

CREATE VIEW public.vw_${entity}_memauth AS
SELECT
    ma.id AS memauth_id,
    ma.principal_id,
    ma.principal_type,
    ma.resource_entity_id AS ${entity}_id,
    ma.access_level,
    array_agg(alp.permission_code ORDER BY alp.permission_code) AS permissions,
    ma.is_public
FROM public.memauth ma
JOIN public.access_level_permission alp 
  ON alp.entity_type = '${entity}'
  AND upper(alp.access_level) = upper(ma.access_level)
JOIN public.${entity} l ON l.id = ma.resource_entity_id
WHERE ma.resource_entity_type = '${entity}'
GROUP BY ma.id, ma.principal_id, ma.principal_type, ma.resource_entity_id, ma.access_level, ma.is_public;

COMMENT ON VIEW public.vw_${entity}_memauth IS 'Shows ${entity} authorizations, what principals have which access_levels & permissions on which ${entity}.';
GRANT SELECT ON public.vw_${entity}_memauth TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- RLS policies on ${entity}, using vw_${entity}_memauth for permission checks
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "${entity} INSERT" ON public.${entity};
DROP POLICY IF EXISTS "${entity} SELECT" ON public.${entity};
DROP POLICY IF EXISTS "${entity} UPDATE" ON public.${entity};
DROP POLICY IF EXISTS "${entity} DELETE" ON public.${entity};

CREATE POLICY "${entity} INSERT" ON public.${entity} FOR INSERT WITH CHECK (
  (created_by = (public.current_rsn_user_id())::text)
  OR public.is_admin()
);

CREATE POLICY "${entity} SELECT" ON public.${entity} FOR SELECT
USING (
  EXISTS(
    SELECT 1
    FROM vw_${entity}_memauth vwm
    WHERE vwm.${entity}_id = ${entity}.${idColumn}
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND '${entity}.SELECT' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
  OR (${entity}.created_by = current_rsn_user_id())
);

CREATE POLICY "${entity} UPDATE" ON public.${entity} FOR UPDATE
USING (
  EXISTS(
    SELECT 1
    FROM vw_${entity}_memauth vwm
    WHERE vwm.${entity}_id = ${entity}.${idColumn}
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND '${entity}.UPDATE' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
);

CREATE POLICY "${entity} DELETE" ON public.${entity} FOR DELETE
USING (
  EXISTS(
    SELECT 1
    FROM vw_${entity}_memauth vwm
    WHERE vwm.${entity}_id = ${entity}.${idColumn}
      AND (
        vwm.principal_id = current_rsn_user_id()
        OR vwm.is_public = true
      )
      AND '${entity}.DELETE' = ANY(vwm.permissions)
  ) 
  OR public.is_admin()
);

--------------------------------------------------------------------------------
-- Define the basic permission levels
--------------------------------------------------------------------------------
INSERT INTO public.permission (permission_code, description) VALUES 
('${entity}.SELECT', 'Can select/view a ${entity}'),
('${entity}.INSERT', 'Can insert/create a ${entity}'),
('${entity}.UPDATE', 'Can update/edit a ${entity}'),
('${entity}.DELETE', 'Can delete a ${entity}'),
('${entity}.SHARE', 'Can grant or modify non-owner access levels on a ${entity}'),
('${entity}.COMMENT', 'Can comment on a ${entity}')
ON CONFLICT (permission_code) DO NOTHING;

--------------------------------------------------------------------------------
-- Define the basic access levels
--------------------------------------------------------------------------------
INSERT INTO public.entity_type_access_level (entity_type, access_level)
VALUES 
('${entity}', 'owner'),
('${entity}', 'editor'),
('${entity}', 'viewer'),
('${entity}', 'commenter')
ON CONFLICT (entity_type, access_level) DO NOTHING;

--------------------------------------------------------------------------------
-- Setup the permissions for each access level
--------------------------------------------------------------------------------
-- NOTE: If you want to add more permissions to any of the following access levels, you must add them here.
-- For example:
--  If this is the \`foo\` object,
--  and \`foo\` objects sometimes have a \`bar\` object that is considered their child,
--  you may want to add \`bar.SELECT\` as another permission.
--  The \`bar\` table can then ask the ${entity} permissions for \`bar.SELECT\` if it needs to.
--------------------------------------------------------------------------------

-- Owners can do anything on the ${entity}.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT '${entity}', 'owner', pc.permission_code
FROM (VALUES 
('${entity}.SELECT'), 
('${entity}.INSERT'), 
('${entity}.UPDATE'), 
('${entity}.DELETE'),
('${entity}.SHARE')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Editors can select, update, and comment on a ${entity}.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT '${entity}', 'editor', pc.permission_code
FROM (VALUES 
('${entity}.SELECT'),
('${entity}.UPDATE'),
('${entity}.COMMENT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Viewers can select a ${entity}.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
VALUES ('${entity}', 'viewer', '${entity}.SELECT')
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;

-- Commenters can select a ${entity}.
INSERT INTO public.access_level_permission (entity_type, access_level, permission_code)
SELECT '${entity}', 'commenter', pc.permission_code
FROM (VALUES 
('${entity}.SELECT')
) AS pc(permission_code)
ON CONFLICT (entity_type, access_level, permission_code) DO NOTHING;
`;
}

function generateTestFile(entity: string, idColumn: string): string {
  return `import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

import { createTestUser } from '../utils/testClient';

// Test user credentials
const OWNER_EMAIL = 'ownerUser@example.com';
const OWNER_PASSWORD = 'test123456';
const OTHER_EMAIL = 'otherUser@example.com';
const OTHER_PASSWORD = 'test123456';

// Test data helpers
const createTestData = (modifier: string) => {
  throw new Error('Not implemented');
  // TODO: Customize these fields based on your entity's required columns
  // EXAMPLE: If the lesson table has a _name column which is required,you can specify it here.
  // return {
  //   _name: \`Test ${entity} \${modifier}\`,
  // }
}

const updateTestData = (modifier: string) => {
  throw new Error('Not implemented');
  // TODO: Customize these fields based on your entity's updatable columns
  // EXAMPLE: If the lesson table has a _name column which is updatable, you can specify it here.
  // return {
  //   _name: \`Updated ${entity} \${modifier}\`
  // }
}

describe('${entity} Permissions', () => {
  describe('${entity} Owner Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Owner Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};
    });

    // Lesson CRUD
    it('owner can read their ${entity}', async () => {
      const { data, error } = await ownerUser.sb
        .from('${entity}')
        .select('*')
        .eq('${idColumn}', ${entity}Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].${idColumn}).toBe(${entity}Id);
    });

    it('owner can update their ${entity}', async () => {
      const { error } = await ownerUser.sb
        .from('${entity}')
        .update(updateTestData('by Owner'))
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await ownerUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id)
        .single();
      expect(data?._name).toBe(\`Updated ${entity} by Owner\`);
    });

    it('owner can delete their ${entity}', async () => {
      const { error } = await ownerUser.sb
        .from('${entity}')
        .delete()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await ownerUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id);
      expect(data).toHaveLength(0);
    });

    // Memauth CRUD
    it('owner can create viewer memauth entries', async () => {
      const newUser = await createTestUser('newviewer@example.com', 'password123');
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: newUser.rsnUserId
        })
        .single();

      expect(error).toBeNull();
    });

    it('owner can read memauth entries', async () => {
      const { data, error } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('owner can update non-owner memauth entries', async () => {
      const viewer = await createTestUser('viewer@example.com', 'password123');
      
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: viewer.rsnUserId
        })
        .select()
        .single();

      const { error } = await ownerUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('id', memauth!.id)
        .single();

      expect(error).toBeNull();
    });

    it('owner can delete non-owner memauth entries', async () => {
      const viewer = await createTestUser('viewer@example.com', 'password123');
      
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: viewer.rsnUserId
        })
        .select()
        .single();

      const { error } = await ownerUser.sb
        .from('memauth')
        .delete()
        .eq('id', memauth!.id)
        .single();

      expect(error).toBeNull();
    });
  });

  describe('${entity} Editor Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let editorUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      editorUser = await createTestUser('editor@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Editor Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};

      // Grant editor access
      await ownerUser.sb.from('memauth').insert({
        
        resource_entity_id: ${entity}Id,
        access_level: 'editor',
        principal_user_id: editorUser.rsnUserId
      });
    });

    // Lesson CRUD
    it('editor can read the ${entity}', async () => {
      const { data, error } = await editorUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('editor can update the ${entity}', async () => {
      const { error } = await editorUser.sb
        .from('${entity}')
        .update(updateTestData('by Editor'))
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).toBeNull();
    });

    it('editor cannot delete the ${entity}', async () => {
      const { error } = await editorUser.sb
        .from('${entity}')
        .delete()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('editor cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await editorUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: newUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('editor can read their own memauth entry', async () => {
      const { data, error } = await editorUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', editorUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('editor');
    });

    it('editor cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', editorUser.rsnUserId)
        .single();

      const { error } = await editorUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });

    it('editor cannot delete memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', editorUser.rsnUserId)
        .single();

      const { error } = await editorUser.sb
        .from('memauth')
        .delete()
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('${entity} Viewer Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser('viewer@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Viewer Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};

      // Grant viewer access
      await ownerUser.sb.from('memauth').insert({
        
        resource_entity_id: ${entity}Id,
        access_level: 'viewer',
        principal_user_id: viewerUser.rsnUserId
      });
    });

    it('viewer can read the ${entity}', async () => {
      const { data, error } = await viewerUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('viewer cannot update the ${entity}', async () => {
      const { error } = await viewerUser.sb
        .from('${entity}')
        .update(updateTestData('by Viewer'))
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    it('viewer cannot delete the ${entity}', async () => {
      const { error } = await viewerUser.sb
        .from('${entity}')
        .delete()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('viewer cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await viewerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: newUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('viewer can read their own memauth entry', async () => {
      const { data, error } = await viewerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', viewerUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('viewer');
    });

    it('viewer cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', viewerUser.rsnUserId)
        .single();

      const { error } = await viewerUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });

    it('viewer cannot delete memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', viewerUser.rsnUserId)
        .single();

      const { error } = await viewerUser.sb
        .from('memauth')
        .delete()
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('${entity} Commenter Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let commenterUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      commenterUser = await createTestUser('commenter@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Commenter Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};

      // Grant commenter access
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: ${entity}Id,
        access_level: 'commenter',
        principal_user_id: commenterUser.rsnUserId
      });
    });

    it('commenter can read the ${entity}', async () => {
      const { data, error } = await commenterUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('commenter cannot update the ${entity}', async () => {
      const { error } = await commenterUser.sb
        .from('${entity}')
        .update(updateTestData('by Commenter'))
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    it('commenter cannot delete the ${entity}', async () => {
      const { error } = await commenterUser.sb
        .from('${entity}')
        .delete()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('commenter cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await commenterUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: newUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('commenter can read their own memauth entry', async () => {
      const { data, error } = await commenterUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', commenterUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('commenter');
    });

    it('commenter cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', commenterUser.rsnUserId)
        .single();

      const { error } = await commenterUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });

    it('commenter cannot delete memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('principal_user_id', commenterUser.rsnUserId)
        .single();

      const { error } = await commenterUser.sb
        .from('memauth')
        .delete()
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('${entity} Public Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let publicUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      publicUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      // Create a fresh ${entity} for each test
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Public Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};
    });

    // ${entity} RUD
    it('public user can read public ${entity}s', async () => {
      // Make ${entity} public first
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: ${entity}Id,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update ${entity}s', async () => {
      const { error } = await publicUser.sb
        .from('${entity}')
        .update(updateTestData('by Public'))
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    it('public user cannot delete ${entity}s', async () => {
      const { error } = await publicUser.sb
        .from('${entity}')
        .delete()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('public user cannot create memauth entries', async () => {
      const { error } = await publicUser.sb
        .from('memauth')
        .insert({  
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          is_public: true
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('public user can read public memauth entries', async () => {
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: ${entity}Id,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          is_public: true
        })
        .select()
        .single();

      const { error } = await publicUser.sb
        .from('memauth')
        .update({ is_public: false })
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });

    it('public user cannot delete memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          is_public: true
        })
        .select()
        .single();

      const { error } = await publicUser.sb
        .from('memauth')
        .delete()
        .eq('id', memauth!.id)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('${entity} Unauthorized Permissions', () => {
    let unauthorizedUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      unauthorizedUser = await createTestUser('unauthorized@example.com', 'password123');
      const ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);

      // Create a ${entity} as owner
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Unauthorized Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};
    });

    // ${entity} CRUD
    it('unauthorized user cannot read ${entity}s', async () => {
      const { data } = await unauthorizedUser.sb
        .from('${entity}')
        .select()
        .eq('${idColumn}', ${entity}Id);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update ${entity}s', async () => {
      const { error } = await unauthorizedUser.sb
        .from('${entity}')
        .update(updateTestData('by Unauthorized'))
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete ${entity}s', async () => {
      const { error } = await unauthorizedUser.sb
        .from('${entity}')
        .delete()
        .eq('${idColumn}', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('unauthorized user cannot create memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'viewer',
          principal_user_id: 'some-user-id'
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot read memauth entries', async () => {
      const { data } = await unauthorizedUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('resource_entity_id', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .delete()
        .eq('resource_entity_id', ${entity}Id)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('${entity} Permission Misc', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Misc Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};
    });

    it('creates owner memauth entry automatically when ${entity} is created', async () => {
      const { data: memauths } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', ${entity}Id)
        .eq('access_level', 'owner');

      expect(memauths).toHaveLength(1);
      expect(memauths![0].principal_user_id).toBe(ownerUser.rsnUserId);
    });

    it('owner cannot create duplicate owner memauth entries', async () => {
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: ${entity}Id,
          access_level: 'owner',
          principal_user_id: ownerUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    }); 
  });

  describe('Supabase Role Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let ${entity}Id: string;
    let superuserClient: SupabaseClient<Database>;
    let anonClient: SupabaseClient<Database>;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      
      // Create superuser client using service role key
      superuserClient = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Create anon client using anon key
      anonClient = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('${entity}')
        .insert(createTestData('Role Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test ${entity}');
      ${entity}Id = item.${idColumn};
    });

    describe('Superuser Permissions', () => {
      it('superuser can read any ${entity}', async () => {
        const { data, error } = await superuserClient
          .from('${entity}')
          .select()
          .eq('${idColumn}', ${entity}Id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
      });

      it('superuser can update any ${entity}', async () => {
        const { error } = await superuserClient
          .from('${entity}')
          .update(updateTestData('by Superuser'))
          .eq('${idColumn}', ${entity}Id)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can delete any ${entity}', async () => {
        const { error } = await superuserClient
          .from('${entity}')
          .delete()
          .eq('${idColumn}', ${entity}Id)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can create memauth entries', async () => {
        const newUser = await createTestUser('newuser@example.com', 'password123');
        const { error } = await superuserClient
          .from('memauth')
          .insert({
            resource_entity_id: ${entity}Id,
            access_level: 'viewer',
            principal_user_id: newUser.rsnUserId
          })
          .single();

        expect(error).toBeNull();
      });

      it('superuser can read any memauth entries', async () => {
        const { data, error } = await superuserClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', ${entity}Id);

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it('superuser can update any memauth entries', async () => {
        const { data: memauth } = await superuserClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', ${entity}Id)
          .single();

        const { error } = await superuserClient
          .from('memauth')
          .update({ is_public: true })
          .eq('id', memauth!.id)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can delete any memauth entries', async () => {
        const { data: memauth } = await superuserClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', ${entity}Id)
          .single();

        const { error } = await superuserClient
          .from('memauth')
          .delete()
          .eq('id', memauth!.id)
          .single();

        expect(error).toBeNull();
      });
    });

    describe('Anon Key Permissions', () => {
      it('anon cannot create ${entity}s', async () => {
        const { error } = await anonClient
          .from('${entity}')
          .insert(createTestData('by Anon'))
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot read ${entity}s', async () => {
        const { data, error } = await anonClient
          .from('${entity}')
          .select()
          .eq('${idColumn}', ${entity}Id);

        expect(error).toBeNull();
        expect(data).toHaveLength(0);
      });

      it('anon cannot update ${entity}s', async () => {
        const { error } = await anonClient
          .from('${entity}')
          .update(updateTestData('by Anon'))
          .eq('${idColumn}', ${entity}Id)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete ${entity}s', async () => {
        const { error } = await anonClient
          .from('${entity}')
          .delete()
          .eq('${idColumn}', ${entity}Id)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot create memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .insert({
            resource_entity_id: ${entity}Id,
            access_level: 'viewer',
            is_public: true
          })
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot read memauth entries', async () => {
        const { data } = await anonClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', ${entity}Id);

        expect(data).toHaveLength(0);
      });

      it('anon cannot update memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .update({ is_public: true })
          .eq('resource_entity_id', ${entity}Id)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .delete()
          .eq('resource_entity_id', ${entity}Id)
          .single();

        expect(error).not.toBeNull();
      });
    });
  });
});`;
}

const dbAuthCommand = new Command("auth")
    .description("Generate authorization setup for database entities");

export const dbAuthAction: CommandAction<typeof dbAuthCommand> = async (opts: Parameters<Parameters<typeof dbAuthCommand.action>[0]>[0]): Promise<{code: number, allStdout: string, allStderr: string}> => {
    const response = await prompts([
        {
            type: 'text',
            name: 'entity',
            message: 'Name of your table/entity? (e.g. "foo")',
            validate: v => v ? true : 'Entity name is required'
        },
        {
            type: 'text',
            name: 'abbreviation',
            message: 'Abbreviation for the entity (leave empty to use entity name)',
            initial: (prev: string) => prev // Default to entity name
        },
        {
            type: 'text',
            name: 'idColumn',
            message: 'Name of the primary key column?',
            initial: 'id'
        }
    ]);

    if (!response.entity) {
        console.log('No entity name provided, exiting.');
        return { code: 1, allStdout: '', allStderr: 'No entity name provided' };
    }

    const { entity, abbreviation, idColumn } = response;
    const finalAbbreviation = abbreviation || entity;

    // Generate SQL and test file contents
    const sqlContent = generateSqlMigration(entity, idColumn, finalAbbreviation);
    const testContent = generateTestFile(entity, idColumn);

    // Create directories if they don't exist
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const testsDir = path.join(process.cwd(), 'tests', 'vitest', entity);

    if (!existsSync(migrationsDir)) {
        mkdirSync(migrationsDir, { recursive: true });
    }

    if (!existsSync(testsDir)) {
        mkdirSync(testsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    const migrationFilename = path.join(migrationsDir, `${timestamp}_add_${entity}_auth.sql`);
    writeFileSync(migrationFilename, sqlContent, 'utf8');
    console.log(`Created migration file: ${migrationFilename}`);

    const testFilename = path.join(testsDir, `${entity}.auth.test.ts`);
    writeFileSync(testFilename, testContent, 'utf8');
    console.log(`Created test file: ${testFilename}`);

    return {
        code: 0,
        allStdout: `Successfully created:\n- ${migrationFilename}\n- ${testFilename}`,
        allStderr: ''
    };
}

dbAuthCommand.action(dbAuthAction);

export default dbAuthCommand;