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

// Test user credentials
  const OWNER_EMAIL = 'ownerUser@example.com';
  const OWNER_PASSWORD = 'test123456';
  const OTHER_EMAIL = 'otherUser@example.com';
  const OTHER_PASSWORD = 'test123456';
  
  describe('rsn_vec Permissions', () => {
    describe('Permission Inheritance from Skill', () => {
      let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
      let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
      let skillId: string;
      let vecId: string;
  
      beforeAll(async () => {
        ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
        otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
      });
  
      beforeEach(async () => {
        // Create a skill
        const { data: skill } = await ownerUser.sb
          .from('skill')
          .insert({
            _name: 'Test Skill',
            _description: 'Description for test skill'
          })
          .select()
          .single();
  
        if (!skill) throw new Error('Failed to create test skill');
        skillId = skill.id;
  
        // Create a vector for the skill
        const { data: vec, error: vecError } = await ownerUser.sb
          .from('rsn_vec')
          .insert({
            _ref_id: skillId,
            raw_content: 'Test skill content',
            content_offset: 0,
          })
          .select()
          .single();
  
        if (!vec) throw new Error(`Failed to create test vector -- ${JSON.stringify(vecError)}`);
        vecId = vec.id;
      });
  
      it('skill owner can read associated vectors', async () => {
        const { data, error } = await ownerUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);
  
        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data?.[0].id).toBe(vecId);
      });
  
      it('skill owner can update associated vectors', async () => {
        const { error } = await ownerUser.sb
          .from('rsn_vec')
          .update({ raw_content: 'Updated skill content' })
          .eq('id', vecId);
  
        expect(error).toBeNull();
      });
  
      it('skill owner can delete associated vectors', async () => {
        const { error, count } = await ownerUser.sb
          .from('rsn_vec')
          .delete()
          .eq('id', vecId);
  
        expect(error).toBeNull();
      });
  
      it('other users cannot read vectors for skills they do not own', async () => {
        const { data } = await otherUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);
  
        expect(data).toHaveLength(0);
      });
  
      it('other users cannot update vectors for skills they do not own', async () => {
        const { data, error } = await otherUser.sb
          .from('rsn_vec')
          .update({ raw_content: 'Unauthorized update' })
          .eq('id', vecId)
          .select()
          .single();

        expect(error).not.toBeNull();
      });
  
      it('other users cannot delete vectors for skills they do not own', async () => {
        const { error } = await otherUser.sb
          .from('rsn_vec')
          .delete()
          .eq('id', vecId)
          .select()
          .single();
  
        expect(error).not.toBeNull();
      });
    });
  
    describe('Permission Inheritance from RSN Page', () => {
      let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
      let otherUser: { sb: SupabaseClient<Database>, rsnUserId: string };
      let pageId: string;
      let vecId: string;
  
      beforeAll(async () => {
        ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
        otherUser = await createTestUser(OTHER_EMAIL, OTHER_PASSWORD);
      });
  
      beforeEach(async () => {
        // Create a page
        const { data: page } = await ownerUser.sb
          .from('rsn_page')
          .insert({
            _name: 'Test Page',
            body: 'Test page content',
            created_by: ownerUser.rsnUserId
          })
          .select()
          .single();
  
        if (!page) throw new Error('Failed to create test page');
        pageId = page.id;
  
        // Create a vector for the page
        const { data: vec, error: vecError } = await ownerUser.sb
          .from('rsn_vec')
          .insert({
            tablename: 'rsn_page',
            _ref_id: pageId,
            embedding_openai_text_embedding_3_small: Array(1536).fill(0.1),
            raw_content: 'Test page content',
            content_offset: 0,
          })
          .select()
          .single();
  
        if (!vec) throw new Error(`Failed to create test vector -- ${JSON.stringify(vecError)}`);
        vecId = vec.id;
      });
  
      it('page owner can read associated vectors', async () => {
        const { data, error } = await ownerUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);
  
        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data?.[0].id).toBe(vecId);
      });
  
      it('page owner can update associated vectors', async () => {
        const { error } = await ownerUser.sb
          .from('rsn_vec')
          .update({ raw_content: 'Updated page content' })
          .eq('id', vecId);
  
        expect(error).toBeNull();
      });
  
      it('page owner can delete associated vectors', async () => {
        const { error } = await ownerUser.sb
          .from('rsn_vec')
          .delete()
          .eq('id', vecId);
  
        expect(error).toBeNull();
      });
  
      it('other users cannot read vectors for pages they do not own', async () => {
        const { data } = await otherUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);
  
        expect(data).toHaveLength(0);
      });
  
      it('other users cannot update vectors for pages they do not own', async () => {
        const { error, count } = await otherUser.sb
          .from('rsn_vec')
          .update({ raw_content: 'Unauthorized update' })
          .eq('id', vecId)
          .select('*', { count: 'exact' })

        expect(count).toBeNull();
      });
  
      it('other users cannot delete vectors for pages they do not own', async () => {
        const { error } = await otherUser.sb
          .from('rsn_vec')
          .delete()
          .eq('id', vecId);
  
        // Now check if the vector was deleted
        const { data: afterData } = await ownerUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);

        expect(afterData).toHaveLength(1);
      });
    });
  
    describe('Inheritance with Shared Resources', () => {
      let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
      let viewerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
      let courseId: string;
      let pageId: string;
      let vecId: string;
  
      beforeAll(async () => {
        ownerUser = await createTestUser(OWNER_EMAIL, OWNER_PASSWORD);
        viewerUser = await createTestUser('viewer@example.com', 'password123');
      });
  
      beforeEach(async () => {
        // Create a course
        const { data: course } = await ownerUser.sb
          .from('course')
          .insert({ _name: 'Test Course' })
          .select()
          .single();
  
        if (!course) throw new Error('Failed to create test course');
        courseId = course.id;
  
        // Create a page
        const { data: page } = await ownerUser.sb
          .from('rsn_page')
          .insert({
            _name: 'Test Page',
            body: 'Test page content in course',
            created_by: ownerUser.rsnUserId
          })
          .select()
          .single();
  
        if (!page) throw new Error('Failed to create test page');
        pageId = page.id;
  
        // Create a resource linking the page to the course
        const { error: resourceError } = await ownerUser.sb
          .from('resource')
          .insert({
            parent_course_id: courseId,
            child_page_id: pageId,
            created_by: ownerUser.rsnUserId
          });
  
        if (resourceError) throw new Error('Failed to create resource');
  
        // Create a vector for the page
        const { data: vec, error: vecError } = await ownerUser.sb
          .from('rsn_vec')
          .insert({
            tablename: 'rsn_page',
            _ref_id: pageId,
            embedding_openai_text_embedding_3_small: Array(1536).fill(0.1),
            raw_content: 'Test page content in course',
            content_offset: 0,
          })
          .select()
          .single();
  
        if (!vec) throw new Error(`Failed to create test vector -- ${JSON.stringify(vecError)}`);
        vecId = vec.id;
  
        // Grant viewer access to course
        await ownerUser.sb.from('memauth').insert({
          resource_entity_id: courseId,
          resource_entity_type: 'course',
          access_level: 'viewer',
          principal_user_id: viewerUser.rsnUserId
        });
      });
  
      it('course viewer can read page vectors through course resources', async () => {
        const { data, error } = await viewerUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);
  
        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data?.[0].id).toBe(vecId);
      });
  
      it('course viewer cannot update page vectors through course resources', async () => {
        const { error } = await viewerUser.sb
          .from('rsn_vec')
          .update({ raw_content: 'Attempted viewer update' })
          .eq('id', vecId);
  
        // Now check if the vector was not updated
        const { data: afterData } = await ownerUser.sb
          .from('rsn_vec')
          .select('*')
          .eq('id', vecId);

        expect(afterData).toHaveLength(1);
        expect(afterData?.[0].raw_content).not.toBe('Attempted viewer update');
      });
  
      it('course editor can update page vectors through course resources', async () => {
        // Upgrade to editor
        await ownerUser.sb
          .from('memauth')
          .update({ access_level: 'editor' })
          .eq('resource_entity_id', courseId)
          .eq('principal_user_id', viewerUser.rsnUserId);
  
        const { error } = await viewerUser.sb
          .from('rsn_vec')
          .update({ raw_content: 'Editor update' })
          .eq('id', vecId);
  
        expect(error).toBeNull();
      });
  
      it('course viewer loses vector access when removed from course', async () => {
        // First verify we have access
        const { data: beforeData } = await viewerUser.sb
          .from('rsn_vec')
          .select()
          .eq('id', vecId);
        expect(beforeData).toHaveLength(1);
  
        // Remove course access
        await ownerUser.sb
          .from('memauth')
          .delete()
          .eq('resource_entity_id', courseId)
          .eq('resource_entity_type', 'course')
          .eq('principal_user_id', viewerUser.rsnUserId);
  
        // Add a small delay to allow permission changes to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
  
        // Verify access is removed
        const { data: afterData } = await viewerUser.sb
          .from('rsn_vec')
          .select()
          .eq('id', vecId);
  
        expect(afterData).toHaveLength(0);
      });
    });
  });