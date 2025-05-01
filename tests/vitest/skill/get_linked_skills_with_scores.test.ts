import { performance } from 'perf_hooks';
import {
  afterAll,
  beforeAll,
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

type LinkedSkillWithScore = {
  skill_id: string;
  skill_name: string;
  path_to: string[];
  path_to_links: string[];
  min_normalized_score_upstream: number;
  max_normalized_score_upstream: number;
  average_normalized_score_upstream: number;
  stddev_normalized_score_upstream: number;
  activity_result_count_upstream: number;
  all_scores: number[];
  num_upstream_skills: number;
  level_on_parent: string;
  level_path: string[];
};

describe('get_linked_skills_with_scores', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  // Track all created entities for cleanup
  const createdSkills: string[] = [];
  const createdActivities: string[] = [];
  const createdActivityResults: string[] = [];

  beforeAll(async () => {
    ownerUser = await createTestUser('skillpathv1@example.com', 'test123456');
  });

  afterAll(async () => {
    // Create a client with service key for cleanup
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables for cleanup');
      return;
    }
    
    const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    // Delete in reverse order to respect foreign key constraints
    // 1. Delete activity results
    if (createdActivityResults.length > 0) {
      const { error: resultError } = await adminClient
        .from('user_activity_result')
        .delete()
        .in('id', createdActivityResults);
      
      if (resultError) console.error('Error cleaning up activity results:', resultError);
    }
    
    // 2. Delete activity_skill links (using activity IDs)
    if (createdActivities.length > 0) {
      const { error: linkError } = await adminClient
        .from('activity_skill')
        .delete()
        .in('activity', createdActivities);
      
      if (linkError) console.error('Error cleaning up activity_skill links:', linkError);
    }
    
    // 3. Delete activities
    if (createdActivities.length > 0) {
      const { error: activityError } = await adminClient
        .from('activity')
        .delete()
        .in('id', createdActivities);
      
      if (activityError) console.error('Error cleaning up activities:', activityError);
    }
    
    // 4. Delete skill links (using skill IDs)
    if (createdSkills.length > 0) {
      const { error: skillLinkError } = await adminClient
        .from('skill_link')
        .delete()
        .or(`upstream_skill.in.(${createdSkills.join(',')}),downstream_skill.in.(${createdSkills.join(',')})`);
      
      if (skillLinkError) console.error('Error cleaning up skill links:', skillLinkError);
    }
    
    // 5. Delete skills
    if (createdSkills.length > 0) {
      const { error: skillError } = await adminClient
        .from('skill')
        .delete()
        .in('id', createdSkills);
      
      if (skillError) console.error('Error cleaning up skills:', skillError);
    }
  });

  async function createSkill(name: string) {
    const { data: skill, error } = await ownerUser.sb
      .from('skill')
      .insert({ _name: name, created_by: ownerUser.rsnUserId })
      .select()
      .single();
    expect(error).toBeNull();
    createdSkills.push(skill!.id); // Track for cleanup
    return skill!;
  }

  async function linkSkills(upstreamId: string, downstreamId: string) {
    const { data: link, error } = await ownerUser.sb
      .from('skill_link')
      .insert({ upstream_skill: upstreamId, downstream_skill: downstreamId, created_by: ownerUser.rsnUserId })
      .select()
      .single();
    expect(error).toBeNull();
    return link!;
  }

  async function createActivityForSkill(skillId: string, score: number) {
    const { data: activity, error: activityError } = await ownerUser.sb
      .from('activity')
      .insert({
        _name: 'Test Activity',
        created_by: ownerUser.rsnUserId,
        _type: 'test'
      })
      .select()
      .single();
    expect(activityError).toBeNull();
    createdActivities.push(activity!.id); // Track for cleanup

    // Link activity to skill
    const { error: linkError } = await ownerUser.sb
      .from('activity_skill')
      .insert({
        activity: activity!.id,
        skill: skillId
      });
    expect(linkError).toBeNull();

    // Create activity result for the user
    const { data: result, error: resultError } = await ownerUser.sb
      .from('user_activity_result')
      .insert({
        activity: activity!.id,
        _user: ownerUser.rsnUserId,
        score: score
      })
      .select()
      .single();
    expect(resultError).toBeNull();
    createdActivityResults.push(result!.id); // Track for cleanup

    return { activityId: activity!.id, resultId: result!.id };
  }

  describe('Basic Linear Path', () => {
    let A: any, B: any, C: any;

    it('setup linear path A->B->C', async () => {
      A = await createSkill('Skill A');
      B = await createSkill('Skill B');
      C = await createSkill('Skill C');

      await linkSkills(A.id, B.id);
      await linkSkills(B.id, C.id);

      // Add an activity result for skill B
      await createActivityForSkill(B.id, 0.8);
    });

    it('should traverse upstream from C to find A and B', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: C.id
      });
      
      expect(error).toBeNull();
      expect(data).toHaveLength(3); // C, B, A

      // Find each skill by id
      const skillA = data?.find(s => s.skill_id === A.id)!;
      const skillB = data?.find(s => s.skill_id === B.id)!;
      const skillC = data?.find(s => s.skill_id === C.id)!;

      // Check paths - C is the starting point with empty path
      expect(skillC.path_to).toHaveLength(0);
      
      // B should be in the path to C
      expect(skillB.path_to).toHaveLength(1);
      
      // A should be in path to B and path to C
      expect(skillA.path_to.length).toBeGreaterThan(0);

      // Check activity results
      expect(skillB.activity_result_count_upstream).toBeGreaterThan(0);
    });
  });

  describe('Diamond Pattern', () => {
    let A: any, B: any, C: any, D: any;

    it('setup diamond: A->B->D and A->C->D', async () => {
      A = await createSkill('Diamond A');
      B = await createSkill('Diamond B');
      C = await createSkill('Diamond C');
      D = await createSkill('Diamond D');

      await linkSkills(A.id, B.id);
      await linkSkills(A.id, C.id);
      await linkSkills(B.id, D.id);
      await linkSkills(C.id, D.id);
    });

    it('should find all upstream skills from D', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: D.id
      });
      
      expect(error).toBeNull();
      // D (starting point) + B + C + A = minimum 4 nodes
      // There may be additional path entries due to how the function counts paths
      expect(data?.length).toBeGreaterThanOrEqual(4);

      // Verify all skills are found
      const skillA = data?.find(s => s.skill_id === A.id);
      const skillB = data?.find(s => s.skill_id === B.id);
      const skillC = data?.find(s => s.skill_id === C.id);
      const skillD = data?.find(s => s.skill_id === D.id);
      
      expect(skillA).toBeDefined();
      expect(skillB).toBeDefined();
      expect(skillC).toBeDefined();
      expect(skillD).toBeDefined();
    });
  });

  describe('Cycle Handling', () => {
    let A: any, B: any, C: any, D: any;

    it('setup cycle: A->B->C->D->B (creates cycle)', async () => {
      A = await createSkill('Cycle A');
      B = await createSkill('Cycle B');
      C = await createSkill('Cycle C');
      D = await createSkill('Cycle D');

      await linkSkills(A.id, B.id);
      await linkSkills(B.id, C.id);
      await linkSkills(C.id, D.id);
      // D->B creates a cycle
      await linkSkills(D.id, B.id);
    });

    it('should handle cycles when traversing upstream from D', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: D.id
      });
      
      expect(error).toBeNull();
      // D + C + B + A = at least 4 nodes
      expect(data?.length).toBeGreaterThanOrEqual(4);
      
      // Function should return in a reasonable time without hanging
      const skillA = data?.find(s => s.skill_id === A.id);
      const skillB = data?.find(s => s.skill_id === B.id);
      const skillC = data?.find(s => s.skill_id === C.id);
      const skillD = data?.find(s => s.skill_id === D.id);
      
      expect(skillA).toBeDefined();
      expect(skillB).toBeDefined();
      expect(skillC).toBeDefined();
      expect(skillD).toBeDefined();
    });
  });

  describe('Figure 8 Pattern', () => {
    let A: any, B: any, C: any, D: any, E: any;

    it('setup figure 8: A->B->C->B and C->D->E->C', async () => {
      A = await createSkill('Fig8 A');
      B = await createSkill('Fig8 B');
      C = await createSkill('Fig8 C');
      D = await createSkill('Fig8 D');
      E = await createSkill('Fig8 E');

      await linkSkills(A.id, B.id);
      await linkSkills(B.id, C.id);
      await linkSkills(C.id, B.id); // First cycle
      await linkSkills(C.id, D.id);
      await linkSkills(D.id, E.id);
      await linkSkills(E.id, C.id); // Second cycle
    });

    it('should handle figure 8 pattern when traversing from E', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: E.id
      });
      
      expect(error).toBeNull();
      // Should find E, D, C, B, A
      expect(data?.length).toBeGreaterThanOrEqual(5);
      
      // Verify required skills were found
      const skillA = data?.find(s => s.skill_id === A.id);
      const skillB = data?.find(s => s.skill_id === B.id);
      const skillC = data?.find(s => s.skill_id === C.id);
      const skillD = data?.find(s => s.skill_id === D.id);
      const skillE = data?.find(s => s.skill_id === E.id);
      
      expect(skillA).toBeDefined();
      expect(skillB).toBeDefined();
      expect(skillC).toBeDefined();
      expect(skillD).toBeDefined();
      expect(skillE).toBeDefined();
    });
  });

  describe('Advanced Cycle Tests', () => {
    let A: any, B: any, C: any, D: any, E: any, F: any;

    it('setup complex cycles: A->B->C->A and C->D->E->F->D', async () => {
      A = await createSkill('Complex A');
      B = await createSkill('Complex B');
      C = await createSkill('Complex C');
      D = await createSkill('Complex D');
      E = await createSkill('Complex E');
      F = await createSkill('Complex F');

      // First cycle
      await linkSkills(A.id, B.id);
      await linkSkills(B.id, C.id);
      await linkSkills(C.id, A.id);
      
      // Connection to second cycle
      await linkSkills(C.id, D.id);
      
      // Second cycle
      await linkSkills(D.id, E.id);
      await linkSkills(E.id, F.id);
      await linkSkills(F.id, D.id);
    });

    it('should handle complex intersecting cycles when traversing from F', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: F.id
      });
      
      expect(error).toBeNull();
      // Should find at least F, E, D, C, B, A
      expect(data?.length).toBeGreaterThanOrEqual(6);
      
      // Verify required skills were found
      const skillA = data?.find(s => s.skill_id === A.id);
      const skillF = data?.find(s => s.skill_id === F.id);
      
      expect(skillA).toBeDefined();
      expect(skillF).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent skill', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: 'non_existent_skill'
      });
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('should handle isolated skill (no links)', async () => {
      const isolated = await createSkill('Isolated Skill');
      
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: isolated.id
      });
      
      expect(error).toBeNull();
      expect(data).toHaveLength(1); // Just the isolated skill
    });

    it('should use date filters correctly', async () => {
      const skill = await createSkill('Date Filter Skill');
      
      // Create activity result before filter date
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      await createActivityForSkill(skill.id, 0.8);
      
      // Test with future start date (should exclude results)
      const { data: futureData, error: futureError } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: skill.id,
        start_date: futureDate.toISOString()
      });
      
      expect(futureError).toBeNull();
      const futureSkill = futureData?.find(s => s.skill_id === skill.id)!;
      expect(futureSkill.activity_result_count_upstream).toBe(0);
      
      // Test with past start date (should include results)
      const { data: pastData, error: pastError } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: skill.id,
        start_date: pastDate.toISOString()
      });
      
      expect(pastError).toBeNull();
      const pastSkill = pastData?.find(s => s.skill_id === skill.id)!;
      expect(pastSkill.activity_result_count_upstream).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    const PERFORMANCE_THRESHOLD_MS = 2000;

    describe('Deep Linear Chain', () => {
      const CHAIN_LENGTH = 50; // Smaller than v2 test for safety
      let firstNode: any;
      let lastNode: any;
      let allNodes: any[] = [];

      it('setup deep linear chain', async () => {
        let currentNode = await createSkill('Chain_0');
        firstNode = currentNode;
        allNodes.push(currentNode);

        for (let i = 1; i < CHAIN_LENGTH; i++) {
          const nextNode = await createSkill(`Chain_${i}`);
          await linkSkills(currentNode.id, nextNode.id);
          currentNode = nextNode;
          allNodes.push(currentNode);
        }
        
        lastNode = currentNode;
      });

      it('should quickly traverse deep chain from the end', async () => {
        const start = performance.now();

        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: lastNode.id
        });

        const duration = performance.now() - start;

        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThanOrEqual(CHAIN_LENGTH);
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      });
    });
  });
});

describe('Problematic Production Skill Case', () => {
  const TIMEOUT_MS = 5000; // 5 second timeout for potentially problematic queries
  let systemUser: any; // Using any to avoid complex SupabaseClient typing issues
  
  beforeAll(async () => {
    // Using the system user account with the known problematic skill
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    
    systemUser = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await systemUser.auth.signInWithPassword({
      email: 'system@reasonote.com',
      password: 'rootchangeme',
    });
    
    if (error) {
      throw new Error(`Failed to sign in as system user: ${error.message}`);
    }
  });
  
  // No afterAll needed here because this test only queries existing production data
  // without creating any new entities. It uses fixed IDs of entities that already
  // exist in the production database.
  
  it('should handle the problematic skill without infinite loops', async () => {
    const targetSkillId = 'skill_819c92ea-8958-4906-85c4-1a3f78050576';
    const userId = 'rsnusr_a0273f39-1d55-4a93-9e4b-1c6a514bf53f';
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
    });
    
    // Create the actual query promise
    const queryPromise = systemUser.rpc('get_linked_skills_with_scores', {
      user_id: userId,
      input_skill_id: targetSkillId
    });
    
    // Race the timeout against the query
    let result;
    try {
      result = await Promise.race([queryPromise, timeoutPromise]) as {
        data: LinkedSkillWithScore[] | null;
        error: any;
      };
    } catch (error) {
      console.error('Query timed out or failed:', error);
      throw error;
    }
    
    // If we get here, the query completed without timing out
    const { data, error } = result;
    expect(error).toBeNull();
    
    // Check that we got some data
    console.log(`Found ${data?.length || 0} skills in the problematic case`);
    expect(data).toBeDefined();
    
    // Log some details to help debugging
    if (data && data.length > 0) {
      console.log('First 5 skills returned:');
      data.slice(0, 5).forEach((skill: LinkedSkillWithScore) => {
        console.log(`- Skill ${skill.skill_id} (${skill.skill_name}) has path length: ${skill.path_to?.length || 0}`);
      });
    }
  }, 10000); // Increase the test timeout to 10 seconds for this specific test
}); 