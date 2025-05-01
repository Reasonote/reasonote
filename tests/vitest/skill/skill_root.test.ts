import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import { SupabaseClient } from '@supabase/supabase-js';

import { createTestUser } from '../utils/testClient';

describe('Skill Root ID Behavior', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  
  beforeAll(async () => {
    ownerUser = await createTestUser('skillroot@example.com', 'test123456');
  });

  describe('Automatic Root Skill ID Assignment', () => {
    it('sets root_skill_id to self when creating a new skill', async () => {
      const { data: skill } = await ownerUser.sb
        .from('skill')
        .insert({ _name: 'Root Test Skill' })
        .select()
        .single();

      expect(skill).not.toBeNull();
      expect(skill!.root_skill_id).toBe(skill!.id);
    });

    it('uses first skill from generated_from_skill_path when available', async () => {
      // Create a root skill first
      const { data: rootSkill } = await ownerUser.sb
        .from('skill')
        .insert({ _name: 'Original Root Skill' })
        .select()
        .single();

      // Create a skill with generated_from_skill_path
      const { data: generatedSkill } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Generated Skill',
          generated_from_skill_path: [rootSkill!.id, 'some_other_id']
        })
        .select()
        .single();

      expect(generatedSkill).not.toBeNull();
      expect(generatedSkill!.root_skill_id).toBe(rootSkill!.id);
    });

    it('sets root_skill_id to self when generated_from_skill_path is empty', async () => {
      const { data: skill } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Empty Path Skill',
          generated_from_skill_path: []
        })
        .select()
        .single();

      expect(skill).not.toBeNull();
      expect(skill!.root_skill_id).toBe(skill!.id);
    });

    it('sets root_skill_id to self when generated_from_skill_path is null', async () => {
      const { data: skill } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Null Path Skill',
          generated_from_skill_path: null
        })
        .select()
        .single();

      expect(skill).not.toBeNull();
      expect(skill!.root_skill_id).toBe(skill!.id);
    });
  });
}); 