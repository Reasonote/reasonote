import {
  afterEach,
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

const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

describe('get_activities_for_skill_paths', () => {
    it('should return activities for given skill paths', async () => {
        const { data, error } = await supabase.rpc('get_activities_for_skill_paths', {
            p_skill_paths: [['skill1', 'skill2'], ['skill3', 'skill4']],
            p_generated_for_user: 'test_user',
            p_activity_type: 'slide'
        });

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should return all activities when user filter is null', async () => {
        const { data, error } = await supabase.rpc('get_activities_for_skill_paths', {
            p_skill_paths: [['skill1', 'skill2']],
            p_activity_type: 'slide'
        });

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should return all activity types when type filter is null', async () => {
        const { data, error } = await supabase.rpc('get_activities_for_skill_paths', {
            p_skill_paths: [['skill1', 'skill2']],
            p_generated_for_user: 'test_user',
        });

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should handle empty skill paths array', async () => {
        const { data, error } = await supabase.rpc('get_activities_for_skill_paths', {
            p_skill_paths: [],
            p_generated_for_user: 'test_user',
            p_activity_type: 'slide'
        });

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(0);
    });
});

describe('get_activities_for_skill_paths Function', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  let skillId1: string;
  let skillId2: string;
  let activityIds: string[] = [];

  beforeAll(async () => {
    ownerUser = await createTestUser('activities.test@example.com', 'test123456');
  });

  beforeEach(async () => {
    // Create test skills
    const { data: skill1 } = await ownerUser.sb
      .from('skill')
      .insert({ _name: 'Test Skill 1' })
      .select()
      .single();

    const { data: skill2 } = await ownerUser.sb
      .from('skill')
      .insert({ _name: 'Test Skill 2' })
      .select()
      .single();

    if (!skill1 || !skill2) throw new Error('Failed to create test skills');
    skillId1 = skill1.id;
    skillId2 = skill2.id;

    // Create test activities with different skill paths
    const activities = await Promise.all([
      ownerUser.sb.from('activity').insert({
        _name: 'Activity 1',
        _type: 'slide',
        generated_for_user: ownerUser.rsnUserId,
        generated_for_skill_paths: [[skillId1, skillId2]]
      }).select().single(),
      ownerUser.sb.from('activity').insert({
        _name: 'Activity 2',
        _type: 'slide',
        generated_for_user: ownerUser.rsnUserId,
        generated_for_skill_paths: [[skillId2, skillId1]]
      }).select().single(),
      ownerUser.sb.from('activity').insert({
        _name: 'Activity 3',
        _type: 'multiple-choice',
        generated_for_user: ownerUser.rsnUserId,
        generated_for_skill_paths: [[skillId1, skillId2]]
      }).select().single()
    ]);

    activityIds = activities
      .map(result => result.data?.id)
      .filter((id): id is string => !!id);
  });

  afterEach(async () => {
    // Clean up test data
    await ownerUser.sb.from('activity').delete().in('id', activityIds);
    await ownerUser.sb.from('skill').delete().in('id', [skillId1, skillId2]);
  });

  it('returns activities matching exact skill path', async () => {
    const { data: activities } = await ownerUser.sb.rpc(
      'get_activities_for_skill_paths',
      {
        p_skill_paths: [[skillId1, skillId2]],
        p_generated_for_user: ownerUser.rsnUserId,
        p_activity_type: 'slide'
      }
    );

    expect(activities).toBeDefined();
    expect(activities).toHaveLength(1);
    expect(activities![0].id).toBe(activityIds[0]);
  });

  it('returns activities for all activity types when type not specified', async () => {
    const { data: activities } = await ownerUser.sb.rpc(
      'get_activities_for_skill_paths',
      {
        p_skill_paths: [[skillId1, skillId2]],
        p_generated_for_user: ownerUser.rsnUserId
      }
    );

    expect(activities).toBeDefined();
    expect(activities).toHaveLength(2); // Should return both slide and multiple-choice activities
  });

  it('returns activities for all users when user not specified', async () => {
    const { data: activities } = await ownerUser.sb.rpc(
      'get_activities_for_skill_paths',
      {
        p_skill_paths: [[skillId1, skillId2]],
        p_activity_type: 'slide'
      }
    );

    expect(activities).toBeDefined();
    expect(activities!.length).toBeGreaterThan(0);
  });

  it('handles empty skill paths array', async () => {
    const { data: activities } = await ownerUser.sb.rpc(
      'get_activities_for_skill_paths',
      {
        p_skill_paths: [],
        p_generated_for_user: ownerUser.rsnUserId,
        p_activity_type: 'slide'
      }
    );

    expect(activities).toBeDefined();
    expect(activities).toHaveLength(0);
  });
}); 