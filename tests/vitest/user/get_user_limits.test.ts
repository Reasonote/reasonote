import {
  beforeAll,
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

type UserLimitsResponse = Database['public']['Functions']['get_user_limits']['Returns'];

async function getUserLimits(sb: SupabaseClient<Database>): Promise<UserLimitsResponse[number]> {
  const { data: dataArray, error } = await sb.rpc('get_user_limits');
  if (error) {
    throw new Error(`Error getting user limits: ${error.message}`);
  }

  if (!dataArray) {
    throw new Error('No data array returned');
  }
  const data = dataArray[0];
  if (!data) {
    throw new Error('Array was returned but no data was within it');
  }

  return data;
}

describe('get_user_limits', () => {
  let user: { sb: SupabaseClient<Database>, rsnUserId: string };
  let adminUser: { sb: SupabaseClient<Database>, rsnUserId: string };

  beforeAll(async () => {
    user = await createTestUser('limits.test@example.com', 'test123456');
    adminUser = await createTestUser('system@reasonote.com', 'rootchangeme');

    // Grant admin license to admin user
    await user.sb.from('rsn_user_sysdata')
      .upsert({
        auth_id: (await adminUser.sb.auth.getUser()).data.user!.id,
        extra_license_info: { 'Reasonote-Admin': true }
      });
  });

  describe('License Type Detection', () => {
    it('returns Free plan for new users who has logged in', async () => {
      const data = await getUserLimits(user.sb);

      const currentPlan = data.currentPlan;
      if (!currentPlan) {
        throw new Error('No current plan found');
      }

      expect(currentPlan.type).toBe('Reasonote-Free');
      expect(currentPlan.name).toBe('Free');
    });

    it('returns Admin plan for admin users', async () => {
      const data = await getUserLimits(adminUser.sb);

      expect(data.currentPlan.type).toBe('Reasonote-Admin');
      expect(data.currentPlan.name).toBe('Admin');
    });

    it('returns Anonymous plan for anonymous users', async () => {
      // Create anonymous user
      const anonUser = await createAnonymousUser();

      const data = await getUserLimits(anonUser.sb);
      
      expect(data.currentPlan.type).toBe('Reasonote-Anonymous');
      expect(data.currentPlan.name).toBe('Anonymous');
    });
  });

  describe('Feature Usage Tracking', () => {
    beforeEach(async () => {
      // Clear existing usage data
      await user.sb.from('user_lesson_result').delete().eq('_user', user.rsnUserId);
      await user.sb.from('podcast').delete().eq('created_by', user.rsnUserId);
      await user.sb.from('user_activity_result').delete().eq('_user', user.rsnUserId);
    });

    it('tracks lesson generation usage', async () => {
      await user.sb.from('user_lesson_result').insert([
        { _user: user.rsnUserId },
        { _user: user.rsnUserId }
      ]);

      const data = await getUserLimits(user.sb);
        
      expect(data).toBeDefined();
      const lessonFeature = data.features.find((f: any) => f.featureId === 'lessons_generated');
      expect(lessonFeature?.usage.numberInPeriod).toBe(2);
    });

    it('tracks podcast generation usage', async () => {
      // Create some podcasts
      await user.sb.from('podcast').insert([
        { created_by: user.rsnUserId, podcast_type: 'podcast', title: 'Podcast 1', topic: 'Topic 1' },
        { created_by: user.rsnUserId, podcast_type: 'podcast', title: 'Podcast 2', topic: 'Topic 2' },
        { created_by: user.rsnUserId, podcast_type: 'podcast', title: 'Podcast 3', topic: 'Topic 3' }
      ]);

      const data = await getUserLimits(user.sb);
      
      console.log('data: ', data);
      
      const podcastFeature = data.features?.find((f: any) => f.featureId === 'podcasts_generated');
      expect(podcastFeature?.usage?.numberInPeriod).toBe(3);
    });

    it('tracks practice activity usage', async () => {
      // Create some practice activities
      await user.sb.from('user_activity_result').insert([
        { _user: user.rsnUserId }
      ]);

      const data = await getUserLimits(user.sb);
      
      const practiceFeature = data.features?.find?.((f: any) => f.featureId === 'practice_activities');
      expect(practiceFeature?.usage?.numberInPeriod).toBe(1);
    });
  });

  describe('Plan Limits', () => {
    it('enforces Free plan limits', async () => {
      const data = await getUserLimits(user.sb);
      
      const lessonFeature = data.features?.find(f => f.featureId === 'lessons_generated');
      expect(lessonFeature?.usage.numberInPeriodAllowed).toBe(3);
      expect(lessonFeature?.usage.isUnlimitedPerPeriod).toBe(false);
    });

    it('has unlimited limits for Admin users', async () => {
      const data = await getUserLimits(adminUser.sb);

      const lessonFeature = data.features?.find(f => f.featureId === 'lessons_generated');
      expect(lessonFeature?.usage.isUnlimitedPerPeriod).toBe(true);
      expect(lessonFeature?.usage.isUnlimitedTotal).toBe(true);
    });
  });

  describe('Period Calculations', () => {
    it('uses correct day boundaries for period', async () => {
      const data = await getUserLimits(user.sb);
      
      const feature = data.features?.[0];
      
      const periodStart = new Date(feature.usage.periodStart);
      const periodEnd = new Date(feature.usage.periodEnd);
      
      // Should be same day
      expect(periodStart.getDate()).toBe(periodEnd.getDate());
      expect(periodStart.getMonth()).toBe(periodEnd.getMonth());
      expect(periodStart.getFullYear()).toBe(periodEnd.getFullYear());
      
      // Start should be midnight
      expect(periodStart.getHours()).toBe(0);
      expect(periodStart.getMinutes()).toBe(0);
      
      // End should be end of day
      expect(periodEnd.getHours()).toBe(23);
      expect(periodEnd.getMinutes()).toBe(59);
    });
  });
}); 