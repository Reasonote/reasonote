import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import { SupabaseClient } from '@supabase/supabase-js';

import { createTestUser } from '../utils/testClient';

// Add type at the top of the file
type SkillLinkMetadata = {
  levelOnParent?: string;
  someOtherField?: string;
};

describe('Skill Link Level Behavior', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  let upstreamSkillId: string;
  let downstreamSkillId: string;

  beforeAll(async () => {
    ownerUser = await createTestUser('skilllink.test@example.com', 'test123456');
  });

  beforeEach(async () => {
    // Create test skills
    const { data: upstreamSkill } = await ownerUser.sb
      .from('skill')
      .insert({ _name: 'Upstream Test Skill' })
      .select()
      .single();

    const { data: downstreamSkill } = await ownerUser.sb
      .from('skill')
      .insert({ _name: 'Downstream Test Skill' })
      .select()
      .single();

    if (!upstreamSkill || !downstreamSkill) throw new Error('Failed to create test skills');
    upstreamSkillId = upstreamSkill.id;
    downstreamSkillId = downstreamSkill.id;
  });

  describe('Default LevelOnParent Behavior', () => {
    it('sets INTRO as default levelOnParent when creating new skill link', async () => {
      const { data: link } = await ownerUser.sb
        .from('skill_link')
        .insert({
          upstream_skill: upstreamSkillId,
          downstream_skill: downstreamSkillId
        })
        .select()
        .single();

      expect(link).not.toBeNull();
      expect(link!.metadata).not.toBeNull();
      expect((link!.metadata as SkillLinkMetadata).levelOnParent).toBe('INTRO');
    });

    it('sets INTRO as default when metadata is empty object', async () => {
      const { data: link } = await ownerUser.sb
        .from('skill_link')
        .insert({
          upstream_skill: upstreamSkillId,
          downstream_skill: downstreamSkillId,
          metadata: {}
        })
        .select()
        .single();

      expect(link).not.toBeNull();
      expect((link!.metadata as SkillLinkMetadata).levelOnParent).toBe('INTRO');
    });

    it('preserves existing levelOnParent when set', async () => {
      const { data: link } = await ownerUser.sb
        .from('skill_link')
        .insert({
          upstream_skill: upstreamSkillId,
          downstream_skill: downstreamSkillId,
          metadata: { levelOnParent: 'ADVANCED' }
        })
        .select()
        .single();

      expect(link).not.toBeNull();
      expect((link!.metadata as SkillLinkMetadata).levelOnParent).toBe('ADVANCED');
    });

    it('preserves other metadata fields when setting default levelOnParent', async () => {
      const { data: link } = await ownerUser.sb
        .from('skill_link')
        .insert({
          upstream_skill: upstreamSkillId,
          downstream_skill: downstreamSkillId,
          metadata: { someOtherField: 'value' }
        })
        .select()
        .single();

      expect(link).not.toBeNull();
      expect((link!.metadata as SkillLinkMetadata).levelOnParent).toBe('INTRO');
      expect((link!.metadata as SkillLinkMetadata).someOtherField).toBe('value');
    });
  });

  describe('get_linked_skills_with_scores Function', () => {
    it('returns INTRO as levelOnParent when not set in skill link', async () => {
      // Create skill link without levelOnParent
      await ownerUser.sb
        .from('skill_link')
        .insert({
          upstream_skill: upstreamSkillId,
          downstream_skill: downstreamSkillId
        });

      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: downstreamSkillId
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      
      // Find the upstream skill in the results
      const upstreamSkillResult = data!.find(s => s.skill_id === upstreamSkillId);
      expect(upstreamSkillResult).toBeDefined();
      expect(upstreamSkillResult!.level_on_parent).toBe('INTRO');
    });

    it('returns correct levelOnParent when explicitly set', async () => {
      // Create skill link with explicit levelOnParent
      await ownerUser.sb
        .from('skill_link')
        .insert({
          upstream_skill: upstreamSkillId,
          downstream_skill: downstreamSkillId,
          metadata: { levelOnParent: 'ADVANCED' }
        });

      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: downstreamSkillId
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      
      // Find the upstream skill in the results
      const upstreamSkillResult = data!.find(s => s.skill_id === upstreamSkillId);
      expect(upstreamSkillResult).toBeDefined();
      expect(upstreamSkillResult!.level_on_parent).toBe('ADVANCED');
    });
  });
}); 