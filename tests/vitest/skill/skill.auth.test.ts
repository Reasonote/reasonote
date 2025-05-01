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
  return {
    _name: `Test skill ${modifier}`,
    _description: `Description for test skill ${modifier}`
  }
}

const updateTestData = (modifier: string) => {
  return {
    _name: `Updated skill ${modifier}`,
    _description: `Updated description for test skill ${modifier}`
  }
}

describe('skill Permissions', () => {
  describe('skill Owner Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let skillId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('skill')
        .insert(createTestData('Owner Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test skill');
      skillId = item.id;
    });

    it('owner can read their skill', async () => {
      const { data, error } = await ownerUser.sb
        .from('skill')
        .select('*')
        .eq('id', skillId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(skillId);
    });

    it('owner can update their skill', async () => {
      const { error } = await ownerUser.sb
        .from('skill')
        .update(updateTestData('by Owner'))
        .eq('id', skillId)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await ownerUser.sb
        .from('skill')
        .select()
        .eq('id', skillId)
        .single();
      expect(data?._name).toBe(`Updated skill by Owner`);
    });

    it('owner can delete their skill', async () => {
      const { error } = await ownerUser.sb
        .from('skill')
        .delete()
        .eq('id', skillId)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await ownerUser.sb
        .from('skill')
        .select()
        .eq('id', skillId);
      expect(data).toHaveLength(0);
    });

    it('other users cannot update skills they did not create', async () => {
      const { error } = await otherUser.sb
        .from('skill')
        .update(updateTestData('by Other'))
        .eq('id', skillId)
        .single();

      expect(error).not.toBeNull();
    });

    it('other users cannot delete skills they did not create', async () => {
      const { error } = await otherUser.sb
        .from('skill')
        .delete()
        .eq('id', skillId)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('Public Access Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let anonClient: SupabaseClient<Database>;
    let skillId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      
      // Create anon client using anon key
      anonClient = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('skill')
        .insert(createTestData('Public Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test skill');
      skillId = item.id;
    });

    it('anonymous users cannot read any skill', async () => {
      const { data, error } = await anonClient
        .from('skill')
        .select()
        .eq('id', skillId);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('anonymous users cannot create skills', async () => {
      const { error } = await anonClient
        .from('skill')
        .insert(createTestData('by Anon'))
        .single();

      expect(error).not.toBeNull();
    });

    it('anonymous users cannot update skills', async () => {
      const { error } = await anonClient
        .from('skill')
        .update(updateTestData('by Anon'))
        .eq('id', skillId)
        .single();

      expect(error).not.toBeNull();
    });

    it('anonymous users cannot delete skills', async () => {
      const { error } = await anonClient
        .from('skill')
        .delete()
        .eq('id', skillId)
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('Admin Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let superuserClient: SupabaseClient<Database>;
    let skillId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      
      // Create superuser client using service role key
      superuserClient = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
    });

    beforeEach(async () => {
      const { data: item } = await ownerUser.sb
        .from('skill')
        .insert(createTestData('Admin Test'))
        .select()
        .single();

      if (!item) throw new Error('Failed to create test skill');
      skillId = item.id;
    });

    it('admin can read any skill', async () => {
      const { data, error } = await superuserClient
        .from('skill')
        .select()
        .eq('id', skillId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('admin can update any skill', async () => {
      const { error } = await superuserClient
        .from('skill')
        .update(updateTestData('by Admin'))
        .eq('id', skillId)
        .single();

      expect(error).toBeNull();
    });

    it('admin can delete any skill', async () => {
      const { error } = await superuserClient
        .from('skill')
        .delete()
        .eq('id', skillId)
        .single();

      expect(error).toBeNull();
    });
  });
}); 