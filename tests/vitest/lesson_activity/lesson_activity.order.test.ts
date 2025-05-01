import {
  beforeAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  afterAll,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestUser } from '../utils/testClient';
import { createSequentializer } from '../utils/sequentialTest';

const sequentialTest = createSequentializer();

describe('Lesson Activity Ordering', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  let lessonId: string;
  let activityIds: string[] = [];

  beforeAll(async () => {
    ownerUser = await createTestUser('owner@example.com', 'password123');

    // Create a lesson
    const { data: lesson } = await ownerUser.sb
      .from('lesson')
      .insert({ _name: 'Test Lesson' })
      .select()
      .single();
    
    if (!lesson) throw new Error('Failed to create lesson');
    lessonId = lesson.id;

    // Create some test activities
    const activities = await Promise.all([
      ownerUser.sb.from('activity').insert({ _name: 'Activity 1' }).select().single(),
      ownerUser.sb.from('activity').insert({ _name: 'Activity 2' }).select().single(),
      ownerUser.sb.from('activity').insert({ _name: 'Activity 3' }).select().single(),
    ]);

    activityIds = activities.map(result => {
      if (!result.data) throw new Error('Failed to create activity');
      return result.data.id;
    });
  });

  afterEach(async () => {
    // Clean up all lesson activities for this lesson
    await ownerUser.sb
      .from('lesson_activity')
      .delete()
      .eq('lesson', lessonId);
  });

  describe('Adding Activities', () => {
    it('can add activity to end of lesson', async () => {
      const { data, error } = await ownerUser.sb.rpc(
        'lesson_activity_add',
        {
          p_lesson_id: lessonId,
          p_activity_id: activityIds[0],
        }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (!data) throw new Error('Failed to add activity');

      // Verify position
      const { data: lessonActivity } = await ownerUser.sb
        .from('lesson_activity')
        .select('position')
        .eq('id', data)
        .single();

      if (!data) throw new Error('Failed to add activity');

      expect(lessonActivity?.position).toBe(1);
    });

    it('can add activity at specific position', async () => {
      const { data, error } = await ownerUser.sb.rpc(
        'lesson_activity_add',
        {
          p_lesson_id: lessonId,
          p_activity_id: activityIds[1],
          p_desired_position: 0.5,
        }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (!data) throw new Error('Failed to add activity');

      // Verify position
      const { data: lessonActivity } = await ownerUser.sb
        .from('lesson_activity')
        .select('position')
        .eq('id', data)
        .single();

      expect(lessonActivity?.position).toBe(0.5);
    });
  });

  describe('Reordering Activities', () => {
    let lessonActivityId: string;

    beforeEach(async () => {
      // Add an activity to reorder
      const { data } = await ownerUser.sb.rpc(
        'lesson_activity_add',
        {
          p_lesson_id: lessonId,
          p_activity_id: activityIds[2],
        }
      );
      if (!data) throw new Error('Failed to add activity');
      lessonActivityId = data;
    });

    it('can move activity to new position', async () => {
      const { error } = await ownerUser.sb.rpc(
        'lesson_activity_reorder',
        {
          p_lesson_activity_id: lessonActivityId,
          p_new_position: 0.75,
        }
      );

      expect(error).toBeNull();

      // Verify new position
      const { data: lessonActivity } = await ownerUser.sb
        .from('lesson_activity')
        .select('position')
        .eq('id', lessonActivityId)
        .single();

      expect(lessonActivity?.position).toBeGreaterThan(0.5);
      expect(lessonActivity?.position).toBeLessThan(1);
    });

    it('maintains order after multiple moves', async () => {
      // Move activity multiple times
      await ownerUser.sb.rpc('lesson_activity_reorder', {
        p_lesson_activity_id: lessonActivityId,
        p_new_position: 0.25,
      });

      await ownerUser.sb.rpc('lesson_activity_reorder', {
        p_lesson_activity_id: lessonActivityId,
        p_new_position: 0.75,
      });

      // Get all activities in order
      const { data: activities } = await ownerUser.sb
        .from('lesson_activity')
        .select('id, position')
        .eq('lesson', lessonId)
        .order('position');

      expect(activities).toBeDefined();
      expect(activities!.length).toBeGreaterThan(0);

      // Verify positions are in ascending order
      const positions = activities!.map(a => a.position);
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]).toBeGreaterThan(positions[i-1]);
      }
    });
  });

  describe('Removing Activities', () => {
    let lessonActivityId: string;

    beforeEach(async () => {
      // Clean up any existing activities first
      await ownerUser.sb
        .from('lesson_activity')
        .delete()
        .eq('lesson', lessonId);

      // Add an activity to remove
      const { data } = await ownerUser.sb.rpc(
        'lesson_activity_add',
        {
          p_lesson_id: lessonId,
          p_activity_id: activityIds[0],
        }
      );
      if (!data) throw new Error('Failed to add activity');
      lessonActivityId = data;
    });

    it('can remove activity from lesson', async () => {
      const { error } = await ownerUser.sb.rpc(
        'lesson_activity_remove',
        {
          p_lesson_activity_id: lessonActivityId,
        }
      );

      expect(error).toBeNull();

      // Verify removal
      const { data: lessonActivity } = await ownerUser.sb
        .from('lesson_activity')
        .select()
        .eq('id', lessonActivityId);

      expect(lessonActivity).toHaveLength(0);
    });

    it('maintains remaining activities order after removal', async () => {
      // Add more activities
      await ownerUser.sb.rpc('lesson_activity_add', {
        p_lesson_id: lessonId,
        p_activity_id: activityIds[1],
      });

      await ownerUser.sb.rpc('lesson_activity_add', {
        p_lesson_id: lessonId,
        p_activity_id: activityIds[2],
      });

      // Verify we have exactly 3 activities before removal
      const { data: beforeActivities } = await ownerUser.sb
        .from('lesson_activity')
        .select('position')
        .eq('lesson', lessonId)
        .order('position');

      expect(beforeActivities).toBeDefined();
      expect(beforeActivities!.length).toBe(3);

      // Remove middle activity
      await ownerUser.sb.rpc('lesson_activity_remove', {
        p_lesson_activity_id: lessonActivityId,
      });

      // Get remaining activities
      const { data: activities } = await ownerUser.sb
        .from('lesson_activity')
        .select('position')
        .eq('lesson', lessonId)
        .order('position');

      expect(activities).toBeDefined();
      expect(activities!.length).toBe(2);

      // Verify positions are still ordered
      const positions = activities!.map(a => a.position);
      expect(positions[1]).toBeGreaterThan(positions[0]);
    });
  });

  afterAll(async () => {
    // Clean up lesson activities
    await ownerUser.sb
      .from('lesson_activity')
      .delete()
      .eq('lesson', lessonId);

    // Clean up lesson
    await ownerUser.sb
      .from('lesson')
      .delete()
      .eq('id', lessonId);

    // Clean up activities
    await Promise.all(
      activityIds.map(id =>
        ownerUser.sb
          .from('activity')
          .delete()
          .eq('id', id)
      )
    );
  });
}); 