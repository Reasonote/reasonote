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
const createSkillData = (modifier: string) => {
  return {
    _name: `Test skill ${modifier}`,
    _description: `Description for test skill ${modifier}`
  }
}

const createSkillLinkData = (upstreamId: string, downstreamId: string) => {
  return {
    upstream_skill: upstreamId,
    downstream_skill: downstreamId,
    _type: 'prerequisite',
    _weight: 1.0
  }
}

describe('skill_link Permissions', () => {
  describe('skill_link Owner Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let upstreamSkillId: string;
    let downstreamSkillId: string;
    let skillLinkId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
    });

    beforeEach(async () => {
      // Create two skills first
      const { data: upstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('Upstream'))
        .select()
        .single();

      const { data: downstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('Downstream'))
        .select()
        .single();

      if (!upstreamSkill || !downstreamSkill) throw new Error('Failed to create test skills');
      upstreamSkillId = upstreamSkill.id;
      downstreamSkillId = downstreamSkill.id;

      // Create the skill link
      const { data: link } = await ownerUser.sb
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, downstreamSkillId))
        .select()
        .single();

      if (!link) throw new Error('Failed to create test skill_link');
      skillLinkId = link.id;
    });

    it('owner can read their skill_link', async () => {
      const { data, error } = await ownerUser.sb
        .from('skill_link')
        .select('*')
        .eq('id', skillLinkId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(skillLinkId);
    });

    it('owner can update their skill_link', async () => {
      const { error } = await ownerUser.sb
        .from('skill_link')
        .update({ _weight: 2.0 })
        .eq('id', skillLinkId)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await ownerUser.sb
        .from('skill_link')
        .select()
        .eq('id', skillLinkId)
        .single();
      expect(data?._weight).toBe(2.0);
    });

    it('owner can delete their skill_link', async () => {
      const { error } = await ownerUser.sb
        .from('skill_link')
        .delete()
        .eq('id', skillLinkId)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await ownerUser.sb
        .from('skill_link')
        .select()
        .eq('id', skillLinkId);
      expect(data).toHaveLength(0);
    });

    it('prevents creation of self-referential links', async () => {
      const { error } = await ownerUser.sb
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, upstreamSkillId))
        .single();

      expect(error).not.toBeNull();
    });

    it('prevents duplicate skill links', async () => {
      // Try to create the same link again
      const { error } = await ownerUser.sb
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, downstreamSkillId))
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('Public Access Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let anonClient: SupabaseClient<Database>;
    let upstreamSkillId: string;
    let downstreamSkillId: string;
    let skillLinkId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      
      // Create anon client using anon key
      anonClient = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
    });

    beforeEach(async () => {
      // Create two skills first (need authenticated user for this)
      const { data: upstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('Upstream Public'))
        .select()
        .single();

      const { data: downstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('Downstream Public'))
        .select()
        .single();

      if (!upstreamSkill || !downstreamSkill) throw new Error('Failed to create test skills');
      upstreamSkillId = upstreamSkill.id;
      downstreamSkillId = downstreamSkill.id;

      // Create the skill link
      const { data: link } = await anonClient // Note: Using anonClient here
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, downstreamSkillId))
        .select()
        .single();

      if (!link) throw new Error('Failed to create test skill_link');
      skillLinkId = link.id;
    });

    it('anonymous users can read any skill_link', async () => {
      const { data, error } = await anonClient
        .from('skill_link')
        .select()
        .eq('id', skillLinkId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(skillLinkId);
    });

    it('anonymous users can create skill_links', async () => {
      // Create a new downstream skill for this test
      const { data: newDownstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('New Downstream Public'))
        .select()
        .single();

      if (!newDownstreamSkill) throw new Error('Failed to create new downstream skill');

      const { error } = await anonClient
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, newDownstreamSkill.id))
        .single();

      expect(error).toBeNull();
    });

    it('anonymous users can update skill_links', async () => {
      const { error } = await anonClient
        .from('skill_link')
        .update({ _weight: 3.0 })
        .eq('id', skillLinkId)
        .single();

      expect(error).toBeNull();

      // Verify update
      const { data } = await anonClient
        .from('skill_link')
        .select()
        .eq('id', skillLinkId)
        .single();
      expect(data?._weight).toBe(3.0);
    });

    it('anonymous users can delete skill_links', async () => {
      const { error } = await anonClient
        .from('skill_link')
        .delete()
        .eq('id', skillLinkId)
        .single();

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await anonClient
        .from('skill_link')
        .select()
        .eq('id', skillLinkId);
      expect(data).toHaveLength(0);
    });

    it('still prevents creation of self-referential links', async () => {
      const { error } = await anonClient
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, upstreamSkillId))
        .single();

      expect(error).not.toBeNull();
    });

    it('still prevents duplicate skill links', async () => {
      // Try to create the same link again
      const { error } = await anonClient
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkillId, downstreamSkillId))
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('Admin Permissions', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let superuserClient: SupabaseClient<Database>;
    let skillLinkId: string;

    beforeAll(async () => {
      ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
      
      // Create superuser client using service role key
      superuserClient = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
    });

    beforeEach(async () => {
      // Create two skills first
      const { data: upstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('Upstream Admin'))
        .select()
        .single();

      const { data: downstreamSkill } = await ownerUser.sb
        .from('skill')
        .insert(createSkillData('Downstream Admin'))
        .select()
        .single();

      if (!upstreamSkill || !downstreamSkill) throw new Error('Failed to create test skills');

      // Create the skill link
      const { data: link } = await ownerUser.sb
        .from('skill_link')
        .insert(createSkillLinkData(upstreamSkill.id, downstreamSkill.id))
        .select()
        .single();

      if (!link) throw new Error('Failed to create test skill_link');
      skillLinkId = link.id;
    });

    it('admin can read any skill_link', async () => {
      const { data, error } = await superuserClient
        .from('skill_link')
        .select()
        .eq('id', skillLinkId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('admin can update any skill_link', async () => {
      const { error } = await superuserClient
        .from('skill_link')
        .update({ _weight: 4.0 })
        .eq('id', skillLinkId)
        .single();

      expect(error).toBeNull();
    });

    it('admin can delete any skill_link', async () => {
      const { error } = await superuserClient
        .from('skill_link')
        .delete()
        .eq('id', skillLinkId)
        .single();

      expect(error).toBeNull();
    });
  });
}); 