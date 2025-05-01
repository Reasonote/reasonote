import {
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
  // throw new Error('Not implemented');
  // TODO: Customize these fields based on your entity's required columns
  // EXAMPLE: If the lesson table has a _name column which is required,you can specify it here.
  return {
    _name: `Test activity ${modifier}`,
  }
}

const updateTestData = (modifier: string) => {
  // throw new Error('Not implemented');
  // TODO: Customize these fields based on your entity's updatable columns
  // EXAMPLE: If the lesson table has a _name column which is updatable, you can specify it here.
  return {
    _name: `Updated activity ${modifier}`
  }
}

describe('activity Permissions', () => {
  describe('activity Owner Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Owner Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;
    });

    // Lesson CRUD
    it('owner can read their activity', async () => {
      const { data, error } = await ownerUser.sb
        .from('activity')
        .select('*')
        .eq('id', activityId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(activityId);
    });

    it('owner can update their activity', async () => {
      const { error } = await ownerUser.sb
        .from('activity')
        .update(updateTestData('by Owner'))
        .eq('id', activityId)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await ownerUser.sb
        .from('activity')
        .select()
        .eq('id', activityId)
        .single();
      expect(data?._name).toBe(`Updated activity by Owner`);
    });

    it('owner can delete their activity', async () => {
      const { error } = await ownerUser.sb
        .from('activity')
        .delete()
        .eq('id', activityId)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await ownerUser.sb
        .from('activity')
        .select()
        .eq('id', activityId);
      expect(data).toHaveLength(0);
    });

    // Memauth CRUD
    it('owner can create viewer memauth entries', async () => {
      const newUser = await createTestUser('newviewer@example.com', 'password123');
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
        .eq('resource_entity_id', activityId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('owner can update non-owner memauth entries', async () => {
      const viewer = await createTestUser('viewer@example.com', 'password123');
      
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
          resource_entity_id: activityId,
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

  describe('activity Editor Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let editorUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      editorUser = await createTestUser('editor@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Editor Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;

      // Grant editor access
      await ownerUser.sb.from('memauth').insert({
        
        resource_entity_id: activityId,
        access_level: 'editor',
        principal_user_id: editorUser.rsnUserId
      });
    });

    // Lesson CRUD
    it('editor can read the activity', async () => {
      const { data, error } = await editorUser.sb
        .from('activity')
        .select()
        .eq('id', activityId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('editor can update the activity', async () => {
      const { error } = await editorUser.sb
        .from('activity')
        .update(updateTestData('by Editor'))
        .eq('id', activityId)
        .single();

      expect(error).toBeNull();
    });

    it('editor cannot delete the activity', async () => {
      const { error } = await editorUser.sb
        .from('activity')
        .delete()
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('editor cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await editorUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
        .eq('resource_entity_id', activityId)
        .eq('principal_user_id', editorUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('editor');
    });

    it('editor cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', activityId)
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
        .eq('resource_entity_id', activityId)
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

  describe('activity Viewer Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser('viewer@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Viewer Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;

      // Grant viewer access
      await ownerUser.sb.from('memauth').insert({
        
        resource_entity_id: activityId,
        access_level: 'viewer',
        principal_user_id: viewerUser.rsnUserId
      });
    });

    it('viewer can read the activity', async () => {
      const { data, error } = await viewerUser.sb
        .from('activity')
        .select()
        .eq('id', activityId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('viewer cannot update the activity', async () => {
      const { error } = await viewerUser.sb
        .from('activity')
        .update(updateTestData('by Viewer'))
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    it('viewer cannot delete the activity', async () => {
      const { error } = await viewerUser.sb
        .from('activity')
        .delete()
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('viewer cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await viewerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
        .eq('resource_entity_id', activityId)
        .eq('principal_user_id', viewerUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('viewer');
    });

    it('viewer cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', activityId)
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
        .eq('resource_entity_id', activityId)
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

  describe('activity Commenter Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let commenterUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      commenterUser = await createTestUser('commenter@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Commenter Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;

      // Grant commenter access
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: activityId,
        access_level: 'commenter',
        principal_user_id: commenterUser.rsnUserId
      });
    });

    it('commenter can read the activity', async () => {
      const { data, error } = await commenterUser.sb
        .from('activity')
        .select()
        .eq('id', activityId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('commenter cannot update the activity', async () => {
      const { error } = await commenterUser.sb
        .from('activity')
        .update(updateTestData('by Commenter'))
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    it('commenter cannot delete the activity', async () => {
      const { error } = await commenterUser.sb
        .from('activity')
        .delete()
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('commenter cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await commenterUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
        .eq('resource_entity_id', activityId)
        .eq('principal_user_id', commenterUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('commenter');
    });

    it('commenter cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', activityId)
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
        .eq('resource_entity_id', activityId)
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

  describe('activity Public Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let publicUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      publicUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      // Create a fresh activity for each test
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Public Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;
    });

    // activity RUD
    it('public user can read public activitys', async () => {
      // Make activity public first
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: activityId,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('activity')
        .select()
        .eq('id', activityId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update activitys', async () => {
      const { error } = await publicUser.sb
        .from('activity')
        .update(updateTestData('by Public'))
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    it('public user cannot delete activitys', async () => {
      const { error } = await publicUser.sb
        .from('activity')
        .delete()
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('public user cannot create memauth entries', async () => {
      const { error } = await publicUser.sb
        .from('memauth')
        .insert({  
          resource_entity_id: activityId,
          access_level: 'viewer',
          is_public: true
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('public user can read public memauth entries', async () => {
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: activityId,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', activityId)
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
          resource_entity_id: activityId,
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

  describe('activity Unauthorized Permissions', () => {
    let unauthorizedUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      unauthorizedUser = await createTestUser('unauthorized@example.com', 'password123');
      const ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);

      // Create a activity as owner
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Unauthorized Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;
    });

    // activity CRUD
    it('unauthorized user cannot read activitys', async () => {
      const { data } = await unauthorizedUser.sb
        .from('activity')
        .select()
        .eq('id', activityId);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update activitys', async () => {
      const { error } = await unauthorizedUser.sb
        .from('activity')
        .update(updateTestData('by Unauthorized'))
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete activitys', async () => {
      const { error } = await unauthorizedUser.sb
        .from('activity')
        .delete()
        .eq('id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('unauthorized user cannot create memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
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
        .eq('resource_entity_id', activityId);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('resource_entity_id', activityId)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .delete()
        .eq('resource_entity_id', activityId)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('activity Permission Misc', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('activity')
        .insert(createTestData('Misc Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;
    });

    it('creates owner memauth entry automatically when activity is created', async () => {
      const { data: memauths } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', activityId)
        .eq('access_level', 'owner');

      expect(memauths).toHaveLength(1);
      expect(memauths![0].principal_user_id).toBe(ownerUser.rsnUserId);
    });

    it('owner cannot create duplicate owner memauth entries', async () => {
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: activityId,
          access_level: 'owner',
          principal_user_id: ownerUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    }); 
  });

  describe('Supabase Role Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let activityId: string;
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
        .from('activity')
        .insert(createTestData('Role Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test activity');
      activityId = item.id;
    });

    describe('Superuser Permissions', () => {
      it('superuser can read any activity', async () => {
        const { data, error } = await superuserClient
          .from('activity')
          .select()
          .eq('id', activityId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
      });

      it('superuser can update any activity', async () => {
        const { error } = await superuserClient
          .from('activity')
          .update(updateTestData('by Superuser'))
          .eq('id', activityId)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can delete any activity', async () => {
        const { error } = await superuserClient
          .from('activity')
          .delete()
          .eq('id', activityId)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can create memauth entries', async () => {
        const newUser = await createTestUser('newuser@example.com', 'password123');
        const { error } = await superuserClient
          .from('memauth')
          .insert({
            resource_entity_id: activityId,
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
          .eq('resource_entity_id', activityId);

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it('superuser can update any memauth entries', async () => {
        const { data: memauth } = await superuserClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', activityId)
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
          .eq('resource_entity_id', activityId)
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
      it('anon cannot create activitys', async () => {
        const { error } = await anonClient
          .from('activity')
          .insert(createTestData('by Anon'))
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot read activitys', async () => {
        const { data, error } = await anonClient
          .from('activity')
          .select()
          .eq('id', activityId);

        expect(error).toBeNull();
        expect(data).toHaveLength(0);
      });

      it('anon cannot update activitys', async () => {
        const { error } = await anonClient
          .from('activity')
          .update(updateTestData('by Anon'))
          .eq('id', activityId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete activitys', async () => {
        const { error } = await anonClient
          .from('activity')
          .delete()
          .eq('id', activityId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot create memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .insert({
            resource_entity_id: activityId,
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
          .eq('resource_entity_id', activityId);

        expect(data).toHaveLength(0);
      });

      it('anon cannot update memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .update({ is_public: true })
          .eq('resource_entity_id', activityId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .delete()
          .eq('resource_entity_id', activityId)
          .single();

        expect(error).not.toBeNull();
      });
    });
  });

  describe('activity Lesson-Inherited Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;
    let activityId: string;

    beforeAll(async () => {
        ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
        viewerUser = await createTestUser('viewer@example.com', 'password123');
    });

    beforeEach(async () => {
        // Create a lesson first
        const { data: lesson } = await ownerUser.sb
            .from('lesson')
            .insert({ _name: 'Test Lesson' })
            .select()
            .single();

        if (!lesson) throw new Error('Failed to create test lesson');
        lessonId = lesson.id;

        // Create an activity
        const { data: activity } = await ownerUser.sb
            .from('activity')
            .insert(createTestData('Lesson Test'))
            .select()
            .single();

        if (!activity) throw new Error('Failed to create test activity');
        activityId = activity.id;

        // Link activity to lesson
        const { data: lessonActivity } = await ownerUser.sb
            .from('lesson_activity')
            .insert({
                lesson: lessonId,
                activity: activityId,
                position: 1
            })
            .select()
            .single();

        if (!lessonActivity) throw new Error('Failed to create test lesson activity');

        // Grant viewer access to the lesson
        const { error } = await ownerUser.sb
            .from('memauth')
            .insert({
                resource_entity_id: lessonId,
                resource_entity_type: 'lesson',
                access_level: 'viewer',
                principal_user_id: viewerUser.rsnUserId
            })
            .single();

        if (error) throw new Error('Failed to create test lesson memauth');
    });

    it('user with lesson access can read activities in that lesson', async () => {
        const { data, error } = await viewerUser.sb
            .from('activity')
            .select()
            .eq('id', activityId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data![0].id).toBe(activityId);
    });

    it('user loses access to activity when removed from lesson', async () => {
        // Remove viewer access from lesson
        await ownerUser.sb
            .from('memauth')
            .delete()
            .eq('resource_entity_id', lessonId)
            .eq('principal_user_id', viewerUser.rsnUserId);

        const { data } = await viewerUser.sb
            .from('activity')
            .select()
            .eq('id', activityId);

        expect(data).toHaveLength(0);
    });

    it('user loses access to activity when activity is removed from lesson', async () => {
        // Remove activity from lesson
        await ownerUser.sb
            .from('lesson_activity')
            .delete()
            .eq('lesson', lessonId)
            .eq('activity', activityId);

        const { data } = await viewerUser.sb
            .from('activity')
            .select()
            .eq('id', activityId);

        expect(data).toHaveLength(0);
    });

    it('user retains direct activity access even when removed from lesson', async () => {
        // Give direct access to activity
        await ownerUser.sb
            .from('memauth')
            .insert({
                resource_entity_id: activityId,
                resource_entity_type: 'activity',
                access_level: 'viewer',
                principal_user_id: viewerUser.rsnUserId
            });

        // Remove from lesson
        await ownerUser.sb
            .from('lesson_activity')
            .delete()
            .eq('lesson', lessonId)
            .eq('activity', activityId);

        // Should still have access through direct permission
        const { data, error } = await viewerUser.sb
            .from('activity')
            .select()
            .eq('id', activityId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
    });
  });
});