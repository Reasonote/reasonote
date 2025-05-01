import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  createAnonymousUser,
  createTestUser,
} from '../utils/testClient';

describe('link_anon_user_to_user', () => {
  describe('Data Migration', () => {
    let regularUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let anonUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let regularUserSkillSetId: string;
    let activityId: string;
    let skillId: string;
    let anonSkillSetId: string;
    let podcastId: string;
    let chapterId: string;
    let chatId: string;
    let lessonId: string;

    beforeEach(async () => {
      // Create a new regular user for each test
      regularUser = await createTestUser(`link.test.${Date.now()}@example.com`, 'test123456');

      // Create a skill set for the regular user
      const { data: regularSkillSet, error: regularSkillSetError } = await regularUser.sb
        .from('skill_set')
        .upsert({
          for_user: regularUser.rsnUserId,
          created_by: regularUser.rsnUserId,
          updated_by: regularUser.rsnUserId
        }, {
          onConflict: 'for_user'
        })
        .select()
        .single();

      if (regularSkillSetError) {
        throw new Error(`Failed to create regular user skill set: ${regularSkillSetError.message}`);
      }
      regularUserSkillSetId = regularSkillSet!.id;

      // Create a new anonymous user for each test
      anonUser = await createAnonymousUser();

      // Create test skill first since other entities depend on it
      const { data: skill, error: skillError } = await anonUser.sb
        .from('skill')
        .insert({
          _name: 'Test Skill',
          created_by: anonUser.rsnUserId,
          for_user: anonUser.rsnUserId
        })
        .select()
        .single();

      if (skillError) {
        throw new Error(`Failed to create skill: ${skillError.message}`);
      }
      skillId = skill!.id;

      // Create test data as anonymous user
      const { data: activity, error: activityError } = await anonUser.sb
        .from('activity')
        .insert({
          _name: 'Test Activity',
          _type: 'test',
          created_by: anonUser.rsnUserId,
          generated_for_user: anonUser.rsnUserId
        })
        .select()
        .single();

      if (activityError) {
        throw new Error(`Failed to create activity: ${activityError.message}`);
      }
      activityId = activity!.id;

      // Create a podcast
      const { data: podcast, error: podcastError } = await anonUser.sb
        .from('podcast')
        .insert({
          title: 'Test Podcast',
          topic: 'Test Topic',
          podcast_type: 'test',
          for_skill_path: [skillId],
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId,
          for_user: anonUser.rsnUserId
        })
        .select()
        .single();

      if (podcastError) {
        throw new Error(`Failed to create podcast: ${podcastError.message}`);
      }
      podcastId = podcast!.id;

      // Create a chapter
      const { data: chapter, error: chapterError } = await anonUser.sb
        .from('chapter')
        .insert({
          _name: 'Test Chapter',
          root_skill: skillId,
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId,
          for_user: anonUser.rsnUserId
        })
        .select()
        .single();

      if (chapterError) {
        throw new Error(`Failed to create chapter: ${chapterError.message}`);
      }
      chapterId = chapter!.id;

      // Create a chat
      const { data: chat, error: chatError } = await anonUser.sb
        .from('chat')
        .insert({
          topic: 'Test Chat',
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId
        })
        .select()
        .single();

      if (chatError) {
        throw new Error(`Failed to create chat: ${chatError.message}`);
      }
      chatId = chat!.id;

      // Create a lesson
      const { data: lesson, error: lessonError } = await anonUser.sb
        .from('lesson')
        .insert({
          _name: 'Test Lesson',
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId,
          for_user: anonUser.rsnUserId
        })
        .select()
        .single();

      if (lessonError) {
        throw new Error(`Failed to create lesson: ${lessonError.message}`);
      }
      lessonId = lesson!.id;

      // Create a skill set for the anonymous user
      const { data: anonSkillSet, error: anonSkillSetError } = await anonUser.sb
        .from('skill_set')
        .insert({
          for_user: anonUser.rsnUserId,
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId
        })
        .select()
        .single();

      if (anonSkillSetError) {
        throw new Error(`Failed to create anon skill set: ${anonSkillSetError.message}`);
      }
      anonSkillSetId = anonSkillSet!.id;

      // Add the skill to the skill set
      const { error: linkError } = await anonUser.sb
        .from('skill_set_skill')
        .insert({
          skill_set: anonSkillSetId,
          skill: skillId,
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId
        });

      if (linkError) {
        throw new Error(`Failed to link skill to set: ${linkError.message}`);
      }

      // Create some user settings for both users
      await regularUser.sb
        .from('user_setting')
        .insert({
          rsn_user: regularUser.rsnUserId,
          created_by: regularUser.rsnUserId,
          updated_by: regularUser.rsnUserId,
          ai_about_me: 'Regular user bio',
          ai_instructions: 'Regular user instructions',
          podcast_playback_speed: 1.5,
          ui_theme: 'dark'
        });

      await anonUser.sb
        .from('user_setting')
        .insert({
          rsn_user: anonUser.rsnUserId,
          created_by: anonUser.rsnUserId,
          updated_by: anonUser.rsnUserId,
          ai_about_me: 'Anon user bio',
          ai_instructions: 'Anon user instructions',
          podcast_playback_speed: 1.0,
          ui_theme: 'light'
        });
    });

    it('transfers ownership of activities to regular user', async () => {
      // Link anonymous user to regular user
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      // Check if activity ownership was transferred
      const { data: activity } = await regularUser.sb
        .from('activity')
        .select()
        .eq('id', activityId)
        .single();

      expect(activity).not.toBeNull();
      expect(activity!.created_by).toBe(regularUser.rsnUserId);
      expect(activity!.updated_by).toBe(regularUser.rsnUserId);
      expect(activity!.generated_for_user).toBe(regularUser.rsnUserId);
    });

    it('transfers ownership of skills and merges skill sets', async () => {
      // Link anonymous user to regular user
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      // Check if skill ownership was transferred
      const { data: skill } = await regularUser.sb
        .from('skill')
        .select()
        .eq('id', skillId)
        .single();

      expect(skill).not.toBeNull();
      expect(skill!.created_by).toBe(regularUser.rsnUserId);
      expect(skill!.updated_by).toBe(regularUser.rsnUserId);
      expect(skill!.for_user).toBe(regularUser.rsnUserId);

      // Check if old skill set was deleted
      const { data: oldSkillSet } = await regularUser.sb
        .from('skill_set')
        .select()
        .eq('id', anonSkillSetId);

      expect(oldSkillSet).toHaveLength(0);

      // Check if skills were moved to regular user's skill set
      const { data: newSkillSet } = await regularUser.sb
        .from('skill_set')
        .select('*, skill_set_skill(*)')
        .eq('for_user', regularUser.rsnUserId)
        .single();

      expect(newSkillSet).not.toBeNull();
      expect(newSkillSet!.skill_set_skill).toHaveLength(1);
    });

    it('transfers ownership of podcasts', async () => {
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      const { data: podcast } = await regularUser.sb
        .from('podcast')
        .select()
        .eq('id', podcastId)
        .single();

      expect(podcast).not.toBeNull();
      expect(podcast!.created_by).toBe(regularUser.rsnUserId);
      expect(podcast!.updated_by).toBe(regularUser.rsnUserId);
      expect(podcast!.for_user).toBe(regularUser.rsnUserId);
    });

    it('transfers ownership of chapters', async () => {
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      const { data: chapter } = await regularUser.sb
        .from('chapter')
        .select()
        .eq('id', chapterId)
        .single();

      expect(chapter).not.toBeNull();
      expect(chapter!.created_by).toBe(regularUser.rsnUserId);
      expect(chapter!.updated_by).toBe(regularUser.rsnUserId);
      expect(chapter!.for_user).toBe(regularUser.rsnUserId);
    });

    it('transfers ownership of chats', async () => {
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      const { data: chat } = await regularUser.sb
        .from('chat')
        .select()
        .eq('id', chatId)
        .single();

      expect(chat).not.toBeNull();
      expect(chat!.created_by).toBe(regularUser.rsnUserId);
      expect(chat!.updated_by).toBe(regularUser.rsnUserId);
    });

    it('transfers ownership of lessons', async () => {
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      const { data: lesson } = await regularUser.sb
        .from('lesson')
        .select()
        .eq('id', lessonId)
        .single();

      expect(lesson).not.toBeNull();
      expect(lesson!.created_by).toBe(regularUser.rsnUserId);
      expect(lesson!.updated_by).toBe(regularUser.rsnUserId);
      expect(lesson!.for_user).toBe(regularUser.rsnUserId);
    });

    it('prevents non-owners from linking anonymous users', async () => {
      const otherUser = await createTestUser(`other.test.${Date.now()}@example.com`, 'test123456');

      // Try to link anonymous user to a different regular user
      const { error } = await otherUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain('Unauthorized');
    });

    it('prevents linking non-anonymous users', async () => {
      const otherUser = await createTestUser(`other2.test.${Date.now()}@example.com`, 'test123456');

      // Try to link one regular user to another
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: otherUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain('not an anonymous user');
    });

    it('preserves regular user settings when linking anonymous user', async () => {
      // Link anonymous user to regular user
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      // Check user settings
      const { data: settings } = await regularUser.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', regularUser.rsnUserId)
        .single();

      expect(settings).not.toBeNull();
      
      // Should keep the regular user's settings
      expect(settings!.ai_about_me).toBe('Regular user bio');
      expect(settings!.ai_instructions).toBe('Regular user instructions');
      expect(settings!.podcast_playback_speed).toBe(1.5);
      expect(settings!.ui_theme).toBe('dark');
    });

    it('transfers anonymous user settings when regular user has none', async () => {
      // Delete regular user's settings first
      await regularUser.sb
        .from('user_setting')
        .delete()
        .eq('rsn_user', regularUser.rsnUserId);

      // Link anonymous user to regular user
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      // Check user settings
      const { data: settings } = await regularUser.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', regularUser.rsnUserId)
        .single();

      expect(settings).not.toBeNull();
      
      // Should have the anonymous user's settings
      expect(settings!.ai_about_me).toBe('Anon user bio');
      expect(settings!.ai_instructions).toBe('Anon user instructions');
      expect(settings!.podcast_playback_speed).toBe(1.0);
      expect(settings!.ui_theme).toBe('light');
    });

    it('merges metadata and feelings when both users have settings', async () => {
      // Update regular user's settings with metadata and feelings
      await regularUser.sb
        .from('user_setting')
        .update({
          metadata: {
            key1: 'value1',
            key2: 'value2'
          },
          feelings: [
            { subject_name: 'Math', subject_type: 'skill', feeling: 'love' }
          ]
        })
        .eq('rsn_user', regularUser.rsnUserId);

      // Update anon user's settings with different metadata and feelings
      await anonUser.sb
        .from('user_setting')
        .update({
          metadata: {
            key2: 'new_value2',  // This should be ignored since regular user has metadata
            key3: 'value3'       // This should be ignored since regular user has metadata
          },
          feelings: [
            { subject_name: 'Physics', subject_type: 'skill', feeling: 'like' }
          ]
        })
        .eq('rsn_user', anonUser.rsnUserId);

      // Link anonymous user to regular user
      const { error } = await regularUser.sb.rpc('link_anon_user_to_user', {
        p_anon_user_id: anonUser.rsnUserId,
        p_user_id: regularUser.rsnUserId
      });

      expect(error).toBeNull();

      // Check merged settings
      const { data: settings } = await regularUser.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', regularUser.rsnUserId)
        .single();

      expect(settings).not.toBeNull();
      
      // Metadata should be exactly the regular user's metadata, ignoring anon user's
      expect(settings!.metadata).toEqual({
        key1: 'value1',    // From regular user
        key2: 'value2'     // From regular user (not overwritten by anon)
      });

      // Feelings array should merge both entries without duplicates
      expect(settings!.feelings).toHaveLength(2);
      expect(settings!.feelings).toContainEqual({
        subject_name: 'Math',
        subject_type: 'skill',
        feeling: 'love'
      });
      expect(settings!.feelings).toContainEqual({
        subject_name: 'Physics',
        subject_type: 'skill',
        feeling: 'like'
      });

      // Other settings should remain unchanged
      expect(settings!.ai_about_me).toBe('Regular user bio');
      expect(settings!.podcast_playback_speed).toBe(1.5);
    });
  });
}); 