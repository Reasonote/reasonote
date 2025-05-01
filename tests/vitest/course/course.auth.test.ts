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
    _name: `Test course ${modifier}`,
  }
}

const updateTestData = (modifier: string) => {
  // TODO: Customize these fields based on your entity's updatable columns
  // EXAMPLE: If the lesson table has a _name column which is updatable, you can specify it here.
  return {
    _name: `Updated course ${modifier}`
  }
}

describe('course Permissions', () => {
  describe('course Owner Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Owner Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;
    });

    // Lesson CRUD
    it('owner can read their course', async () => {
      const { data, error } = await ownerUser.sb
        .from('course')
        .select('*')
        .eq('id', courseId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(courseId);
    });

    it('owner can update their course', async () => {
      const { error } = await ownerUser.sb
        .from('course')
        .update(updateTestData('by Owner'))
        .eq('id', courseId)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await ownerUser.sb
        .from('course')
        .select()
        .eq('id', courseId)
        .single();
      expect(data?._name).toBe(`Updated course by Owner`);
    });

    it('owner can delete their course', async () => {
      const { error } = await ownerUser.sb
        .from('course')
        .delete()
        .eq('id', courseId)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await ownerUser.sb
        .from('course')
        .select()
        .eq('id', courseId);
      expect(data).toHaveLength(0);
    });

    // Memauth CRUD
    it('owner can create viewer memauth entries', async () => {
      const newUser = await createTestUser('newviewer@example.com', 'password123');
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
        .eq('resource_entity_id', courseId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('owner can update non-owner memauth entries', async () => {
      const viewer = await createTestUser('viewer@example.com', 'password123');
      
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
          resource_entity_id: courseId,
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

  describe('course Editor Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let editorUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      editorUser = await createTestUser('editor@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Editor Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;

      // Grant editor access
      await ownerUser.sb.from('memauth').insert({
        
        resource_entity_id: courseId,
        access_level: 'editor',
        principal_user_id: editorUser.rsnUserId
      });
    });

    // Lesson CRUD
    it('editor can read the course', async () => {
      const { data, error } = await editorUser.sb
        .from('course')
        .select()
        .eq('id', courseId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('editor can update the course', async () => {
      const { error } = await editorUser.sb
        .from('course')
        .update(updateTestData('by Editor'))
        .eq('id', courseId)
        .single();

      expect(error).toBeNull();
    });

    it('editor cannot delete the course', async () => {
      const { error } = await editorUser.sb
        .from('course')
        .delete()
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('editor cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await editorUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
        .eq('resource_entity_id', courseId)
        .eq('principal_user_id', editorUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('editor');
    });

    it('editor cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', courseId)
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
        .eq('resource_entity_id', courseId)
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

  describe('course Viewer Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser('viewer@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Viewer Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;

      // Grant viewer access
      await ownerUser.sb.from('memauth').insert({
        
        resource_entity_id: courseId,
        access_level: 'viewer',
        principal_user_id: viewerUser.rsnUserId
      });
    });

    it('viewer can read the course', async () => {
      const { data, error } = await viewerUser.sb
        .from('course')
        .select()
        .eq('id', courseId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('viewer cannot update the course', async () => {
      const { error } = await viewerUser.sb
        .from('course')
        .update(updateTestData('by Viewer'))
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    it('viewer cannot delete the course', async () => {
      const { error } = await viewerUser.sb
        .from('course')
        .delete()
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('viewer cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await viewerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
        .eq('resource_entity_id', courseId)
        .eq('principal_user_id', viewerUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('viewer');
    });

    it('viewer cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', courseId)
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
        .eq('resource_entity_id', courseId)
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

  describe('course Commenter Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let commenterUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      commenterUser = await createTestUser('commenter@example.com', 'password123');
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Commenter Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;

      // Grant commenter access
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: courseId,
        access_level: 'commenter',
        principal_user_id: commenterUser.rsnUserId
      });
    });

    it('commenter can read the course', async () => {
      const { data, error } = await commenterUser.sb
        .from('course')
        .select()
        .eq('id', courseId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('commenter cannot update the course', async () => {
      const { error } = await commenterUser.sb
        .from('course')
        .update(updateTestData('by Commenter'))
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    it('commenter cannot delete the course', async () => {
      const { error } = await commenterUser.sb
        .from('course')
        .delete()
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('commenter cannot create memauth entries', async () => {
      const newUser = await createTestUser('newuser@example.com', 'password123');
      const { error } = await commenterUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
        .eq('resource_entity_id', courseId)
        .eq('principal_user_id', commenterUser.rsnUserId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].access_level).toBe('commenter');
    });

    it('commenter cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', courseId)
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
        .eq('resource_entity_id', courseId)
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

  describe('course Public Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let publicUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      publicUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      // Create a fresh course for each test
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Public Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;
    });

    // course RUD
    it('public user can read public courses', async () => {
      // Make course public first
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: courseId,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('course')
        .select()
        .eq('id', courseId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update courses', async () => {
      const { error } = await publicUser.sb
        .from('course')
        .update(updateTestData('by Public'))
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    it('public user cannot delete courses', async () => {
      const { error } = await publicUser.sb
        .from('course')
        .delete()
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('public user cannot create memauth entries', async () => {
      const { error } = await publicUser.sb
        .from('memauth')
        .insert({  
          resource_entity_id: courseId,
          access_level: 'viewer',
          is_public: true
        })
        .single();

      expect(error).not.toBeNull();
    });

    it('public user can read public memauth entries', async () => {
      await ownerUser.sb.from('memauth').insert({
        resource_entity_id: courseId,
        access_level: 'viewer',
        is_public: true
      });

      const { data, error } = await publicUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', courseId)
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('public user cannot update memauth entries', async () => {
      const { data: memauth } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
          resource_entity_id: courseId,
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

  describe('course Unauthorized Permissions', () => {
    let unauthorizedUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      unauthorizedUser = await createTestUser('unauthorized@example.com', 'password123');
      const ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);

      // Create a course as owner
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Unauthorized Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;
    });

    // course CRUD
    it('unauthorized user cannot read courses', async () => {
      const { data } = await unauthorizedUser.sb
        .from('course')
        .select()
        .eq('id', courseId);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update courses', async () => {
      const { error } = await unauthorizedUser.sb
        .from('course')
        .update(updateTestData('by Unauthorized'))
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete courses', async () => {
      const { error } = await unauthorizedUser.sb
        .from('course')
        .delete()
        .eq('id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    // Memauth CRUD
    it('unauthorized user cannot create memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
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
        .eq('resource_entity_id', courseId);

      expect(data).toHaveLength(0);
    });

    it('unauthorized user cannot update memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .update({ is_public: true })
        .eq('resource_entity_id', courseId)
        .single();

      expect(error).not.toBeNull();
    });

    it('unauthorized user cannot delete memauth entries', async () => {
      const { error } = await unauthorizedUser.sb
        .from('memauth')
        .delete()
        .eq('resource_entity_id', courseId)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('course Permission Misc', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      viewerUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('course')
        .insert(createTestData('Misc Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;
    });

    it('creates owner memauth entry automatically when course is created', async () => {
      const { data: memauths } = await ownerUser.sb
        .from('memauth')
        .select()
        .eq('resource_entity_id', courseId)
        .eq('access_level', 'owner');

      expect(memauths).toHaveLength(1);
      expect(memauths![0].principal_user_id).toBe(ownerUser.rsnUserId);
    });

    it('owner cannot create duplicate owner memauth entries', async () => {
      const { error } = await ownerUser.sb
        .from('memauth')
        .insert({
          resource_entity_id: courseId,
          access_level: 'owner',
          principal_user_id: ownerUser.rsnUserId
        })
        .single();

      expect(error).not.toBeNull();
    }); 
  });

  describe('Supabase Role Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;
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
        .from('course')
        .insert(createTestData('Role Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test course');
      courseId = item.id;
    });

    describe('Superuser Permissions', () => {
      it('superuser can read any course', async () => {
        const { data, error } = await superuserClient
          .from('course')
          .select()
          .eq('id', courseId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
      });

      it('superuser can update any course', async () => {
        const { error } = await superuserClient
          .from('course')
          .update(updateTestData('by Superuser'))
          .eq('id', courseId)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can delete any course', async () => {
        const { error } = await superuserClient
          .from('course')
          .delete()
          .eq('id', courseId)
          .single();

        expect(error).toBeNull();
      });

      it('superuser can create memauth entries', async () => {
        const newUser = await createTestUser('newuser@example.com', 'password123');
        const { error } = await superuserClient
          .from('memauth')
          .insert({
            resource_entity_id: courseId,
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
          .eq('resource_entity_id', courseId);

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it('superuser can update any memauth entries', async () => {
        const { data: memauth } = await superuserClient
          .from('memauth')
          .select()
          .eq('resource_entity_id', courseId)
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
          .eq('resource_entity_id', courseId)
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
      it('anon cannot create courses', async () => {
        const { error } = await anonClient
          .from('course')
          .insert(createTestData('by Anon'))
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot read courses', async () => {
        const { data, error } = await anonClient
          .from('course')
          .select()
          .eq('id', courseId);

        expect(error).toBeNull();
        expect(data).toHaveLength(0);
      });

      it('anon cannot update courses', async () => {
        const { error } = await anonClient
          .from('course')
          .update(updateTestData('by Anon'))
          .eq('id', courseId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete courses', async () => {
        const { error } = await anonClient
          .from('course')
          .delete()
          .eq('id', courseId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot create memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .insert({
            resource_entity_id: courseId,
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
          .eq('resource_entity_id', courseId);

        expect(data).toHaveLength(0);
      });

      it('anon cannot update memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .update({ is_public: true })
          .eq('resource_entity_id', courseId)
          .single();

        expect(error).not.toBeNull();
      });

      it('anon cannot delete memauth entries', async () => {
        const { error } = await anonClient
          .from('memauth')
          .delete()
          .eq('resource_entity_id', courseId)
          .single();

        expect(error).not.toBeNull();
      });
    });
  });

  describe('Course Resource-Inherited Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let courseId: string;
    let pageResourceId: string;
    let snipResourceId: string;
    let snipId: string;
    let pageId: string;

    beforeEach(async () => {
        ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
        viewerUser = await createTestUser('viewer@example.com', 'password123');

        // Create a course
        const { data: course } = await ownerUser.sb
            .from('course')
            .insert({ _name: 'Test Course' })
            .select()
            .single();

        if (!course) throw new Error('Failed to create test course');
        courseId = course.id;

        // Create a page
        const { data: page, error: pageError } = await ownerUser.sb
            .from('rsn_page')
            .insert({ _name: 'Test Page', created_by: ownerUser.rsnUserId })
            .select()
            .single();

        if (!page) throw new Error(`Failed to create test page: ${JSON.stringify(pageError, null, 2)}`);
        pageId = page.id;

        // Create a snip
        const { data: snip } = await ownerUser.sb
            .from('snip')
            .insert({ _name: 'Test Snip', _type: 'text', _owner: ownerUser.rsnUserId })
            .select()
            .single();

        if (!snip) throw new Error('Failed to create test snip');
        snipId = snip.id;

        // Create a resource linking the page to the course
        const { data: pageResource, error: pageResourceError } = await ownerUser.sb
            .from('resource')
            .insert({
                parent_course_id: courseId,
                child_page_id: pageId,
                created_by: ownerUser.rsnUserId
            })
            .select()
            .single();

        if (!pageResource) throw new Error(`Failed to create page resource: ${JSON.stringify(pageResourceError, null, 2)}`);

        // Create a separate resource linking the snip to the course
        const { data: snipResource, error: snipResourceError } = await ownerUser.sb
            .from('resource')
            .insert({
                parent_course_id: courseId,
                child_snip_id: snipId,
                created_by: ownerUser.rsnUserId
            })
            .select()
            .single();

        if (!snipResource) throw new Error(`Failed to create snip resource: ${JSON.stringify(snipResourceError, null, 2)}`);

        // Store both resource IDs
        pageResourceId = pageResource.id;
        snipResourceId = snipResource.id;

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

        // Print vw_rsn_page_memauth
        const { data: vwRsnPageMemauth } = await viewerUser.sb
            .from('vw_rsn_page_memauth')
            .select('*')
            .eq('page_id', pageId);
        console.log('vwRsnPageMemauth', vwRsnPageMemauth);

        console.log('beforeeach outer')
    });

    describe('Resource Inheritance', () => {
        it('course viewer can read resources in that course', async () => {
            // Test both resources
            const { data: pageResourceData, error: pageError } = await viewerUser.sb
                .from('resource')
                .select()
                .eq('id', pageResourceId);

            expect(pageError).toBeNull();
            expect(pageResourceData).toHaveLength(1);
            expect(pageResourceData![0].id).toBe(pageResourceId);

            const { data: snipResourceData, error: snipError } = await viewerUser.sb
                .from('resource')
                .select()
                .eq('id', snipResourceId);

            expect(snipError).toBeNull();
            expect(snipResourceData).toHaveLength(1);
            expect(snipResourceData![0].id).toBe(snipResourceId);
        });
    });

    describe('Page Inheritance', () => {
        it('course viewer has page access through course resources', async () => {
            const { data, error } = await viewerUser.sb
                .from('rsn_page')
                .select()
                .eq('id', pageId);

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data![0].id).toBe(pageId);
        });
    });

    describe('Snip Inheritance', () => {
        it('course viewer can read snips through course resources', async () => {
            const { data, error } = await viewerUser.sb
                .from('snip')
                .select()
                .eq('id', snipId);

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data![0].id).toBe(snipId);
        });
    });

    describe('Editor Permissions', () => {
        beforeEach(async () => {
            // Upgrade viewer to editor
            await ownerUser.sb
                .from('memauth')
                .update({ access_level: 'editor' })
                .eq('resource_entity_id', courseId)
                .eq('principal_user_id', viewerUser.rsnUserId);
        });

        it('course editor can update resources', async () => {
            const { error } = await viewerUser.sb
                .from('resource')
                .update({ updated_date: new Date().toISOString() })
                .eq('id', pageResourceId);

            expect(error).toBeNull();
        });

        it('course editor can update pages through resources', async () => {
            const { error } = await viewerUser.sb
                .from('rsn_page')
                .update({ updated_date: new Date().toISOString() })
                .eq('id', pageId);

            expect(error).toBeNull();
        });

        it('course editor can update snips through resources', async () => {
            const { error } = await viewerUser.sb
                .from('snip')
                .update({ updated_date: new Date().toISOString() })
                .eq('id', snipId);

            expect(error).toBeNull();
        });
    });

    describe('Access Loss Tests - Removed from Course', () => {
        beforeEach(async () => {
          console.log('Access Loss Tests - Removed from Course (beforeAll - START)');
          // Remove the access via memauth  
          await ownerUser.sb
            .from('memauth')
            .delete()
            .eq('resource_entity_id', courseId)
            .eq('principal_user_id', viewerUser.rsnUserId);
          console.log('Access Loss Tests - Removed from Course (beforeAll - END)');
        })
        it('course viewer loses page access when removed from course', async () => {
            const { data } = await viewerUser.sb
                .from('rsn_page')
                .select()
                .eq('id', pageId);

            expect(data).toHaveLength(0);
        });

        it('course viewer loses resource access when removed from course', async () => {
            const { data } = await viewerUser.sb
                .from('resource')
                .select()
                .eq('id', pageResourceId);

            expect(data).toHaveLength(0);
        });

        it('course viewer loses snip access when removed from course', async () => {
            const { data } = await viewerUser.sb
                .from('snip')
                .select()
                .eq('id', snipId);

            expect(data).toHaveLength(0);
        });
    });

    // TODO: re-institute this...
    // describe('Access Loss Tests - Resource Removed', () => {
    //     beforeAll(async () => {
    //         // First verify we have access
    //         const { data } = await viewerUser.sb
    //             .from('snip')
    //             .select()
    //             .eq('id', snipId);
    //         expect(data).toHaveLength(1);

    //         // Remove resource
    //         await ownerUser.sb
    //             .from('resource')
    //             .delete()
    //             .eq('id', snipResourceId);
    //     });

    //     it('course viewer loses snip access when resource is removed', async () => {
    //         const { data } = await viewerUser.sb
    //             .from('snip')
    //             .select()
    //             .eq('id', snipId);

    //         expect(data).toHaveLength(0);
    //     });
    // });
  });
});