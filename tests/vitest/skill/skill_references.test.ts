import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import { SupabaseClient } from '@supabase/supabase-js';

import { createTestUser } from '../utils/testClient';

describe('skill references', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };

  beforeAll(async () => {
    ownerUser = await createTestUser('skillreferences@example.com', 'test123456');
  });

  async function createSkill(name: string) {
    const { data: skill, error } = await ownerUser.sb
      .from('skill')
      .insert({ _name: name, created_by: ownerUser.rsnUserId })
      .select()
      .single();
    expect(error).toBeNull();
    return skill!;
  }

  async function createRsnVec(content: string) {
    // Create a rsn_page first
    const { data: rsnPage, error: rsnPageError } = await ownerUser.sb
      .from('rsn_page')
      .insert({ _name: 'Test RSN Page' })
      .select()
      .single();
    expect(rsnPageError).toBeNull();

    if (!rsnPage) {
      throw new Error('Failed to create rsn_page');
    }

    // Create a rsn_vec referencing the rsn_page
    const { data: vec, error } = await ownerUser.sb
      .from('rsn_vec')
      .insert({
        raw_content: content,
        content_offset: 0,
        _ref_id: rsnPage.id
      })
      .select()
      .single();
    expect(error).toBeNull();
    return vec!;
  }

  async function createReference(content: string, isExact: boolean, rsnVecId: string) {
    const { data: reference, error } = await ownerUser.sb
      .from('reference')
      .insert({
        raw_content: content,
        is_exact: isExact,
        rsn_vec_id: rsnVecId,
        _ref_id: 'test_ref'
      })
      .select()
      .single();
    expect(error).toBeNull();
    return reference!;
  }

  describe('Basic Reference Operations', () => {
    it('should create a skill with null reference_ids and rsn_vec_ids by default', async () => {
      const skill = await createSkill('Test Skill');
      expect(skill.reference_ids).toBeNull();
      expect(skill.rsn_vec_ids).toBeNull();
    });

    it('should allow setting reference_ids and chunk_ids', async () => {
      // Create a chunk first
      const chunk = await createRsnVec('Test chunk content');

      // Create a reference
      const reference = await createReference('Test reference', true, chunk.id);

      // Create skill with references and chunks
      const { data: skill, error } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Skill with refs',
          created_by: ownerUser.rsnUserId,
          reference_ids: [reference.id],
          rsn_vec_ids: [chunk.id]
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(skill!.reference_ids).toHaveLength(1);
      expect(skill!.reference_ids![0]).toBe(reference.id);
      expect(skill!.rsn_vec_ids).toHaveLength(1);
      expect(skill!.rsn_vec_ids![0]).toBe(chunk.id);
    });

    it('should enforce foreign key constraints for reference_ids', async () => {
      // Attempt to create skill with non-existent reference
      const { error } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Invalid Ref Skill',
          created_by: ownerUser.rsnUserId,
          reference_ids: ['ref_nonexistent']
        });

      expect(error).not.toBeNull();
      expect(error!.message).toBe('Invalid reference_id found in reference_ids array');
    });

    it('should enforce foreign key constraints for rsn_vec_ids', async () => {
      // Attempt to create skill with non-existent chunk
      const { error } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Invalid Chunk Skill',
          created_by: ownerUser.rsnUserId,
          rsn_vec_ids: ['rsnv_nonexistent']
        });

      expect(error).not.toBeNull();
      expect(error!.message).toBe('Invalid rsn_vec_id found in rsn_vec_ids array');
    });
  });

  describe('Array Operations', () => {
    let skill: any;
    let reference1: any;
    let reference2: any;
    let chunk1: any;
    let chunk2: any;

    beforeAll(async () => {
      // Create test data
      chunk1 = await createRsnVec('Chunk 1 content');
      chunk2 = await createRsnVec('Chunk 2 content');
      reference1 = await createReference('Reference 1', true, chunk1.id);
      reference2 = await createReference('Reference 2', false, chunk2.id);

      // Create skill with initial references and chunks
      const { data, error } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Array Test Skill',
          created_by: ownerUser.rsnUserId,
          reference_ids: [reference1.id],
          rsn_vec_ids: [chunk1.id]
        })
        .select()
        .single();

      expect(error).toBeNull();
      skill = data!;
    });

    it('should allow adding new references and chunks', async () => {
      const { data, error } = await ownerUser.sb
        .from('skill')
        .update({
          reference_ids: [reference1.id, reference2.id],
          rsn_vec_ids: [chunk1.id, chunk2.id]
        })
        .eq('id', skill.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.reference_ids).toHaveLength(2);
      expect(data!.rsn_vec_ids).toHaveLength(2);
    });

    it('should allow removing references and chunks', async () => {
      const { data, error } = await ownerUser.sb
        .from('skill')
        .update({
          reference_ids: [reference1.id],
          rsn_vec_ids: [chunk1.id]
        })
        .eq('id', skill.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.reference_ids).toHaveLength(1);
      expect(data!.rsn_vec_ids).toHaveLength(1);
    });

    it('should allow setting arrays to null', async () => {
      const { data, error } = await ownerUser.sb
        .from('skill')
        .update({
          reference_ids: null,
          rsn_vec_ids: null
        })
        .eq('id', skill.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.reference_ids).toBeNull();
      expect(data!.rsn_vec_ids).toBeNull();
    });
  });
}); 