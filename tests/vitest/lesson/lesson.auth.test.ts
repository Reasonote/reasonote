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
  // TODO: Customize these fields based on your entity's required columns
  // EXAMPLE: If the lesson table has a _name column which is required,you can specify it here.
  return {
    _name: `Test lesson ${modifier}`,
  }
}

const updateTestData = (modifier: string) => {
  // TODO: Customize these fields based on your entity's updatable columns
  // EXAMPLE: If the lesson table has a _name column which is updatable, you can specify it here.
  return {
    _name: `Updated lesson ${modifier}`
  }
}

describe('lesson Permissions', () => {
  describe('lesson Owner Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Owner Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;
    });

    // Lesson CRUD
    it('owner can read their lesson', async () => {
      const { data, error } = await ownerUser.sb
        .from('lesson')
        .select('*')
        .eq('id', lessonId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(lessonId);
    });

    it('owner can update their lesson', async () => {
      const { error } = await ownerUser.sb
        .from('lesson')
        .update(updateTestData('by Owner'))
        .eq('id', lessonId)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await ownerUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId)
        .single();
      expect(data?._name).toBe(`Updated lesson by Owner`);
    });

    it('owner can delete their lesson', async () => {
      const { error } = await ownerUser.sb
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await ownerUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId);
      expect(data).toHaveLength(0);
    });

    // Memauth CRUD
    it('owner can create viewer memauth entries', async () => {
      const newUser = await createTestUser('newviewer@example.com', 'password123');
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
        .eq('resource_entity_id', lessonId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('owner can update non-owner memauth entries', async () => {
      const viewer = await createTestUser('viewer@example.com', 'password123');
      
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
          resource_entity_id: lessonId,
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

  describe('lesson Editor Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let editorUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      editorUser = await createTestUser('editor@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Editor Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;

      // Grant editor access
      const { error } = await ownerUser.sb.from('memauth').insert({ 
        resource_entity_id: lessonId,
        access_level: 'editor',
        principal_user_id: editorUser.rsnUserId
      });

      if (error) throw new Error('Failed to create test lesson memauth');
    });

    // Lesson CRUD
    it('editor can read the lesson', async () => {
      const { data, error } = await editorUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('editor can update the lesson', async () => {
      const { error } = await editorUser.sb
        .from('lesson')
        .update(updateTestData('by Editor'))
        .eq('id', lessonId)
        .single();

      expect(error).toBeNull();
    });

    it('editor cannot delete the lesson', async () => {
      const { error } = await editorUser.sb
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('editor cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await editorUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
        .eq('resource_entity_id', lessonId)
        .eq('principal_user_id', editorUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('editor');
    });

    it('editor cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', lessonId)
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
        .eq('resource_entity_id', lessonId)
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

  describe('lesson Viewer Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser('viewer@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Viewer Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;

      // Grant viewer access
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: lessonId,
        access_level: 'viewer',
        principal_user_id: viewerUser.rsnUserId
      });
    });

    it('viewer can read the lesson', async () => {
      const { data, error } = await viewerUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('viewer cannot update the lesson', async () => {
      const { error } = await viewerUser.sb
        .from('lesson')
        .update(updateTestData('by Viewer'))
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    it('viewer cannot delete the lesson', async () => {
      const { error } = await viewerUser.sb
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('viewer cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await viewerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
        .eq('resource_entity_id', lessonId)
        .eq('principal_user_id', viewerUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('viewer');
    });

    it('viewer cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', lessonId)
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
        .eq('resource_entity_id', lessonId)
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

  describe('lesson Commenter Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let commenterUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      commenterUser = await createTestUser('commenter@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Commenter Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;

      // Grant commenter access
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: lessonId,
        access_level: 'commenter',
        principal_user_id: commenterUser.rsnUserId
      });
    });

    it('commenter can read the lesson', async () => {
      const { data, error } = await commenterUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('commenter cannot update the lesson', async () => {
      const { error } = await commenterUser.sb
        .from('lesson')
        .update(updateTestData('by Commenter'))
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    it('commenter cannot delete the lesson', async () => {
      const { error } = await commenterUser.sb
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('commenter cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await commenterUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
        .eq('resource_entity_id', lessonId)
        .eq('principal_user_id', commenterUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('commenter');
    });

    it('commenter cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', lessonId)
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
        .eq('resource_entity_id', lessonId)
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

  describe('lesson Public Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let publicUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      publicUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      // Create a fresh lesson for each test
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Public Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;
    });

    // lesson RUD
    it('public user can read public lessons', async () => {
      // Make lesson public first
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: lessonId,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update lessons', async () => {
      const { error } = await publicUser.sb
        .from('lesson')
        .update(updateTestData('by Public'))
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    it('public user cannot delete lessons', async () => {
      const { error } = await publicUser.sb
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('public user cannot create memauth entries', async () => {
      const { error } = await publicUser.sb
        .from('memauth')
        .insert({  
          resource_entity_id: lessonId,
          access_level: 'viewer',
          is_public: true
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('public user can read public memauth entries', async () => {
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: lessonId,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', lessonId)
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
          resource_entity_id: lessonId,
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

  describe('lesson Unauthorized Permissions', () => {
    let unauthorizedUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      unauthorizedUser = await createTestUser('unauthorized@example.com', 'password123');
      const ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);

      // Create a lesson as owner
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Unauthorized Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;
    });

    // lesson CRUD
    it('unauthorized user cannot read lessons', async () => {
      const { data } = await unauthorizedUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update lessons', async () => {
      const { error } = await unauthorizedUser.sb
        .from('lesson')
        .update(updateTestData('by Unauthorized'))
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete lessons', async () => {
      const { error } = await unauthorizedUser.sb
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('unauthorized user cannot create memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
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
        .eq('resource_entity_id', lessonId);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('resource_entity_id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .delete()
        .eq('resource_entity_id', lessonId)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('lesson Permission Misc', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('lesson')
        .insert(createTestData('Misc Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;
    });

    it('creates owner memauth entry automatically when lesson is created', async () => {
      const { data: memauths } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', lessonId)
        .eq('access_level', 'owner');

      expect(memauths).toHaveLength(1);
      expect(memauths![0].principal_user_id).toBe(ownerUser.rsnUserId);
    });

    it('owner cannot create duplicate owner memauth entries', async () => {
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: lessonId,
          access_level: 'owner',
          principal_user_id: ownerUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    }); 
  });

  describe('Supabase Role Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let lessonId: string;
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
        .from('lesson')
        .insert(createTestData('Role Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test lesson');
      lessonId = item.id;
    });

    describe('Superuser Permissions', () => {
      it('superuser can read any lesson', async () => {
        const { data, error } = await superuserClient
          .from('lesson')
          .select()
          .eq('id', lessonId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
      });

      it('superuser can update any lesson', async () => {
        const { error } = await superuserClient
          .from('lesson')
          .update(updateTestData('by Superuser'))
          .eq('id', lessonId)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can delete any lesson', async () => {
        const { error } = await superuserClient
          .from('lesson')
          .delete()
          .eq('id', lessonId)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can create memauth entries', async () => {
        const newUser = await createTestUser('newuser@example.com', 'password123');
        const { error } = await superuserClient
          .from('memauth')
          .insert({
            resource_entity_id: lessonId,
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
          .eq('resource_entity_id', lessonId);

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it('superuser can update any memauth entries', async () => {
        const { data: memauth } = await superuserClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', lessonId)
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
          .eq('resource_entity_id', lessonId)
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
      it('anon cannot create lessons', async () => {
        const { error } = await anonClient
          .from('lesson')
          .insert(createTestData('by Anon'))
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot read lessons', async () => {
        const { data, error } = await anonClient
          .from('lesson')
          .select()
          .eq('id', lessonId);

        expect(error).toBeNull();
        expect(data).toHaveLength(0);
      });

      it('anon cannot update lessons', async () => {
        const { error } = await anonClient
          .from('lesson')
          .update(updateTestData('by Anon'))
          .eq('id', lessonId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete lessons', async () => {
        const { error } = await anonClient
          .from('lesson')
          .delete()
          .eq('id', lessonId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot create memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .insert({
            resource_entity_id: lessonId,
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
          .eq('resource_entity_id', lessonId);

        expect(data).toHaveLength(0);
      });

      it('anon cannot update memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .update({ is_public: true })
          .eq('resource_entity_id', lessonId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .delete()
          .eq('resource_entity_id', lessonId)
          .single();

        expect(error).not.toBeNull();
      });
    });
  });

  describe('lesson Course-Inherited Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;
    let lessonId: string;

    beforeAll(async () => {
        ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
        viewerUser = await createTestUser('viewer@example.com', 'password123');
    });

    beforeEach(async () => {
        // Create a course first
        const { data: course } = await ownerUser.sb
            .from('course')
            .insert({ _name: 'Test Course' })
            .select()
            .single();

        if (!course) throw new Error('Failed to create test course');
        courseId = course.id;

        // Create a lesson
        const { data: lesson } = await ownerUser.sb
            .from('lesson')
            .insert(createTestData('Course Test'))
            .select()
            .single();

        if (!lesson) throw new Error('Failed to create test lesson');
        lessonId = lesson.id;

        // Link lesson to course
        const { data: courseLesson, error: linkError } = await ownerUser.sb
            .from('course_lesson')
            .insert({
                course: courseId,
                lesson: lessonId,
            })
            .select()
            .single();

        if (!courseLesson || linkError) throw new Error('Failed to create test course lesson');

        // Grant viewer access to the course
        const { error: authError } = await ownerUser.sb
            .from('memauth')
            .insert({
                resource_entity_id: courseId,
                resource_entity_type: 'course',
                access_level: 'viewer',
                principal_user_id: viewerUser.rsnUserId
            })
            .single();

        if (authError) throw new Error('Failed to create test course memauth');
    });

    it('user with course access can read lessons in that course', async () => {
        const { data, error } = await viewerUser.sb
            .from('lesson')
            .select()
            .eq('id', lessonId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data![0].id).toBe(lessonId);
    });

    it('user with course access can read activities in lessons in that course', async () => {
        // Create an activity
        const { data: activity } = await ownerUser.sb
            .from('activity')
            .insert({ _name: 'Test Activity' })
            .select()
            .single();

        if (!activity) throw new Error('Failed to create test activity');

        // Link activity to lesson
        const { error: linkError } = await ownerUser.sb
            .from('lesson_activity')
            .insert({
                lesson: lessonId,
                activity: activity.id,
                position: 1
            })
            .select()
            .single();

        if (linkError) throw new Error('Failed to link activity to lesson');

        // Viewer should be able to read the activity through course->lesson->activity inheritance
        const { data, error } = await viewerUser.sb
            .from('activity')
            .select()
            .eq('id', activity.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data![0].id).toBe(activity.id);

        // Verify that removing course access removes activity access
        await ownerUser.sb
            .from('memauth')
            .delete()
            .eq('resource_entity_id', courseId)
            .eq('principal_user_id', viewerUser.rsnUserId);

        const { data: afterRemoval } = await viewerUser.sb
            .from('activity')
            .select()
            .eq('id', activity.id);

        expect(afterRemoval).toHaveLength(0);
    });

    it('user loses access to lesson when removed from course', async () => {
        // Remove viewer access from course
        await ownerUser.sb
            .from('memauth')
            .delete()
            .eq('resource_entity_id', courseId)
            .eq('principal_user_id', viewerUser.rsnUserId);

        const { data } = await viewerUser.sb
            .from('lesson')
            .select()
            .eq('id', lessonId);

        expect(data).toHaveLength(0);
    });

    it('user loses access to lesson when lesson is removed from course', async () => {
        // Remove lesson from course
        await ownerUser.sb
            .from('course_lesson')
            .delete()
            .eq('course', courseId)
            .eq('lesson', lessonId);

        const { data } = await viewerUser.sb
            .from('lesson')
            .select()
            .eq('id', lessonId);

        expect(data).toHaveLength(0);
    });

    it('user retains direct lesson access even when removed from course', async () => {
        // Give direct access to lesson
        await ownerUser.sb
            .from('memauth')
            .insert({
                resource_entity_id: lessonId,
                resource_entity_type: 'lesson',
                access_level: 'viewer',
                principal_user_id: viewerUser.rsnUserId
            });

        // Remove from course
        await ownerUser.sb
            .from('course_lesson')
            .delete()
            .eq('course', courseId)
            .eq('lesson', lessonId);

        // Should still have access through direct permission
        const { data, error } = await viewerUser.sb
            .from('lesson')
            .select()
            .eq('id', lessonId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
    });
  });
});