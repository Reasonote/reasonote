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

const DATE_2024_01_01_NOON = new Date('2024-01-01T12:00:00Z');  // Jan 1st 12:00 UTC (clearly previous day)
const DATE_2024_01_02_EARLY = new Date('2024-01-02T05:00:00Z'); // Jan 1st 21:00 PST (non-DST)

describe('XP System', () => {
  let user: { sb: SupabaseClient<Database>, rsnUserId: string };
  let user2: { sb: SupabaseClient<Database>, rsnUserId: string };
  let skillId: string;
  let adminClient: SupabaseClient<Database>;

  beforeAll(async () => {
    user = await createTestUser('xp.test@example.com', 'test123456');
    user2 = await createTestUser('xp.test2@example.com', 'test123456');

    // Create admin client with service role key
    adminClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  });

  beforeEach(async () => {
    // Create a test skill
    const { data: skill } = await user.sb
      .from('skill')
      .insert({ _name: 'Test Skill' })
      .select()
      .single();

    if (!skill) throw new Error('Failed to create test skill');
    skillId = skill.id;
  });

  describe('Daily XP Tracking', () => {
    beforeEach(async () => {
      // Ensure user has settings record
      await user.sb
        .from('user_setting')
        .upsert({
          rsn_user: user.rsnUserId,
          daily_xp_goal: 500  // Default goal
        });
    });

    it('creates user_skill_sysdata on first XP add', async () => {
      const { error } = await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 100
      });

      expect(error).toBeNull();

      const { data: sysdata } = await user.sb
        .from('user_skill_sysdata')
        .select()
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId)
        .single();

      expect(sysdata).not.toBeNull();
      expect(sysdata!.daily_xp).toBe(100);
      expect(sysdata!.total_xp).toBe(100);
    });

    it('accumulates daily XP within same day', async () => {
      // Add XP twice
      await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 50
      });

      await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 75
      });

      const { data: sysdata } = await user.sb
        .from('user_skill_sysdata')
        .select()
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId)
        .single();

      expect(sysdata!.daily_xp).toBe(125); // 50 + 75
      expect(sysdata!.total_xp).toBe(125);
    });

    it('tracks total XP across multiple skills', async () => {
      // Create a new user specifically for this test
      const multiSkillUser = await createTestUser('xp.test3@example.com', 'test123456');

      const { data: multiSkill1 } = await multiSkillUser.sb
        .from('skill')
        .insert({ _name: 'Multi-Skill 1' })
        .select()
        .single();

      const { data: multiSkill2 } = await multiSkillUser.sb
        .from('skill')
        .insert({ _name: 'Multi-Skill 2' })
        .select()
        .single();

      // Add XP to both skills
      await adminClient.rpc('add_skill_xp', {
        user_id: multiSkillUser.rsnUserId,
        skill_id: multiSkill1!.id,
        xp_amount: 100
      });

      await adminClient.rpc('add_skill_xp', {
        user_id: multiSkillUser.rsnUserId,
        skill_id: multiSkill2!.id,
        xp_amount: 200
      });

      const { data: totalXp } = await multiSkillUser.sb.rpc('get_total_user_xp', {
        user_id: multiSkillUser.rsnUserId
      });

      expect(totalXp?.length).toEqual(1);
      expect(totalXp?.[0]).toEqual({
        total_xp: 300,
        daily_xp: 300
      });

      await adminClient.from('user_skill_sysdata').delete().eq('rsn_user', multiSkillUser.rsnUserId);  
    });
  });

  describe('Daily Goals', () => {
    beforeEach(async () => {
      // Ensure user has settings record
      await user.sb
        .from('user_setting')
        .upsert({
          rsn_user: user.rsnUserId,
          daily_xp_goal: 500  // Default goal
        });
    });

    it('allows setting temporary daily XP goal', async () => {
      const tempGoal = 1000;
      const now = DATE_2024_01_01_NOON.toISOString();

      const { error } = await user.sb
        .from('user_setting')
        .update({
          temporary_daily_xp_goal: tempGoal,
          temporary_daily_xp_goal_set_datetime: now
        })
        .eq('rsn_user', user.rsnUserId);

      expect(error).toBeNull();

      const { data: settings } = await user.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', user.rsnUserId)
        .single();

      expect(settings!.temporary_daily_xp_goal).toBe(tempGoal);
      expect(new Date(settings!.temporary_daily_xp_goal_set_datetime!).getTime())
        .toBe(new Date(now).getTime());
    });

    it('uses temporary goal over default goal when set', async () => {
      // Set temporary goal
      await user.sb
        .from('user_setting')
        .upsert({
          rsn_user: user.rsnUserId,
          daily_xp_goal: 500,
          temporary_daily_xp_goal: 1000,
          temporary_daily_xp_goal_set_datetime: DATE_2024_01_01_NOON.toISOString()
        });

      const { data: settings } = await user.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', user.rsnUserId)
        .single();

      expect(settings!.temporary_daily_xp_goal).toBe(1000);
    });
  });

  describe('Timezone Handling', () => {
    it('stores user timezone on login', async () => {
      const timezone = 'America/New_York';
      await user.sb.rpc('login_jwt', {
        browser_timezone: timezone
      });

      const { data: userData } = await user.sb
        .from('rsn_user')
        .select('timezone')
        .eq('id', user.rsnUserId)
        .single();

      expect(userData!.timezone).toBe(timezone);
    });

    it('defaults to UTC if no timezone provided', async () => {
      await user.sb.rpc('login_jwt');

      const { data: userData } = await user.sb
        .from('rsn_user')
        .select('timezone')
        .eq('id', user.rsnUserId)
        .single();

      expect(userData!.timezone).toBe('UTC');
    });
  });

  describe('Daily Reset Behavior', () => {
    beforeEach(async () => {
      // Set user timezone
      await user.sb.rpc('login_jwt', {
        browser_timezone: 'UTC'
      });

      // Ensure user has settings record
      await user.sb
        .from('user_setting')
        .upsert({
          rsn_user: user.rsnUserId,
          daily_xp_goal: 500
        });
    });

    it('resets daily XP when crossing midnight in user timezone', async () => {
      // Add initial XP
      await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 100
      });

      // Simulate crossing midnight by manually updating last_daily_reset using admin client
      const yesterdayReset = DATE_2024_01_01_NOON;  // Clearly previous day

      // Update the last_daily_reset field
      await adminClient
        .from('user_skill_sysdata')
        .update({ last_daily_reset: yesterdayReset.toISOString() })
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId);

      // Add more XP after "midnight"
      await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 50
      });

      const { data: sysdata } = await user.sb
        .from('user_skill_sysdata')
        .select('*')
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId)
        .single();

      expect(sysdata!.daily_xp).toBe(50); // Only the new XP
      expect(sysdata!.total_xp).toBe(150); // All XP combined
    });

    it('clears temporary goal when crossing midnight', async () => {
      // Set user timezone first
      await user.sb.rpc('login_jwt', {
        browser_timezone: 'UTC'
      });

      // Set temporary goal from yesterday
      await user.sb
        .from('user_setting')
        .update({
          temporary_daily_xp_goal: 1000,
          temporary_daily_xp_goal_set_datetime: DATE_2024_01_01_NOON.toISOString()  // Clearly previous day
        })
        .eq('rsn_user', user.rsnUserId);

      // Trigger cleanup
      await adminClient.rpc('crn_cleanup_daily_xp_and_goals');

      const { data: settings } = await user.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', user.rsnUserId)
        .single();


      expect(settings!.temporary_daily_xp_goal).toBeNull();
      expect(settings!.temporary_daily_xp_goal_set_datetime).toBeNull();
    });

    it('clears temporary goal based on user timezone, not UTC', async () => {
      // Set user timezone to Los Angeles
      await user.sb.rpc('login_jwt', {
        browser_timezone: 'America/Los_Angeles'
      });

      // Set time to Jan 2nd 05:00 UTC = Jan 1st 21:00 PST (during non-DST period)
      // This is previous day in LA but current day in UTC
      await user.sb
        .from('user_setting')
        .update({
          temporary_daily_xp_goal: 1000,
          temporary_daily_xp_goal_set_datetime: DATE_2024_01_02_EARLY.toISOString()
        })
        .eq('rsn_user', user.rsnUserId);

      // Trigger cleanup
      await adminClient.rpc('crn_cleanup_daily_xp_and_goals');

      const { data: settings } = await user.sb
        .from('user_setting')
        .select()
        .eq('rsn_user', user.rsnUserId)
        .single();

      // Should be cleared because in LA timezone this is Jan 1st 21:00 PST (previous day)
      expect(settings!.temporary_daily_xp_goal).toBeNull();
      expect(settings!.temporary_daily_xp_goal_set_datetime).toBeNull();
    });

    it('resets daily XP via cron job based on user timezone', async () => {
      // Set user timezone to Los Angeles
      await user.sb.rpc('login_jwt', {
        browser_timezone: 'America/Los_Angeles'
      });

      // Add some XP
      await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 100
      });

      // Set time to Jan 2nd 05:00 UTC = Jan 1st 21:00 PST (during non-DST period)
      // This is previous day in LA but current day in UTC
      await adminClient
        .from('user_skill_sysdata')
        .update({ last_daily_reset: DATE_2024_01_02_EARLY.toISOString() })
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId);

      // Trigger cleanup
      await adminClient.rpc('crn_cleanup_daily_xp_and_goals');

      const { data: sysdata } = await user.sb
        .from('user_skill_sysdata')
        .select('*')
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId)
        .single();

      // Should be reset because in LA timezone this is Jan 1st 21:00 PST (previous day)
      expect(sysdata!.daily_xp).toBe(0);
      expect(new Date(sysdata!.last_daily_reset).getTime())
        .toBeGreaterThan(DATE_2024_01_02_EARLY.getTime());
    });
  });

  describe('XP System Security', () => {
    it('prevents user from directly editing XP data', async () => {
      // Try to add XP directly through user client
      await user.sb
        .from('user_skill_sysdata')
        .update({ total_xp: 1000, daily_xp: 1000 })
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId);

      const { data } = await user.sb
        .from('user_skill_sysdata')
        .select('*')
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId);

      expect(data?.length).toEqual(0);
    });

    it('prevents user from adding XP', async () => {
      await user.sb.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 100
      });

      const { data } = await user.sb
      .from('user_skill_sysdata')
      .select('*')
      .eq('rsn_user', user.rsnUserId)
      .eq('skill', skillId);

      expect(data?.length).toEqual(0);
    });

    it('prevents user from getting another user\'s XP data', async () => {
      // Try to get user2's XP data using user1's client
      const { data } = await user.sb.rpc('get_total_user_xp', {
        user_id: user2.rsnUserId
      });

      expect(data?.length).toBe(1);
      expect(data?.[0]).toEqual({
        total_xp: null,
        daily_xp: null
      });
    });

    it('allows user to get their own XP data', async () => {
      const { data, error } = await user.sb.rpc('get_total_user_xp', {
        user_id: user.rsnUserId
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('prevents non-admin from calling cleanup function', async () => {
      // Add some initial XP
      await adminClient.rpc('add_skill_xp', {
        user_id: user.rsnUserId,
        skill_id: skillId,
        xp_amount: 100
      });

      /// Simulate crossing midnight by manually updating last_daily_reset using admin client
      await adminClient
        .from('user_skill_sysdata')
        .update({ last_daily_reset: DATE_2024_01_01_NOON.toISOString() })  // Clearly previous day
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId);

      // Get initial state
      const { data: initialData } = await user.sb
        .from('user_skill_sysdata')
        .select('*')
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId)
        .single();

      // Try to call cleanup directly through user client
      await user.sb.rpc('crn_cleanup_daily_xp_and_goals');

      // Verify data hasn't changed
      const { data: afterData } = await user.sb
        .from('user_skill_sysdata')
        .select('*')
        .eq('rsn_user', user.rsnUserId)
        .eq('skill', skillId)
        .single();

      expect(afterData).toEqual(initialData);
      expect(new Date(afterData!.last_daily_reset).getTime())
        .toBe(new Date(initialData!.last_daily_reset).getTime());
    });
  });
}); 