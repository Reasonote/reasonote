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
  skill_emoji: string;
  skill_links: any[];
  user_activity_result_ids: string[];
  skill_score: number;
};

describe('get_linked_skills_with_scores_v2', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  // Track all created entities for cleanup
  const createdSkills: string[] = [];
  const createdActivities: string[] = [];
  const createdActivityResults: string[] = [];

  beforeAll(async () => {
    ownerUser = await createTestUser('skillpath@example.com', 'test123456');
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
        score
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

    it('downstream from A should find A,B,C with proper links', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: A.id,
        direction: 'downstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(3);

      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA?.skill_links).toHaveLength(1);
      expect((skillA?.skill_links[0] as any).to).toBe(B.id);

      const skillB = data?.find(s => s.skill_id === B.id)!;
      expect(skillB?.skill_links).toHaveLength(1);
      expect((skillB?.skill_links[0] as any).to).toBe(C.id);
      expect(skillB?.user_activity_result_ids).toHaveLength(1);

      const skillC = data?.find(s => s.skill_id === C.id)!;
      expect(skillC?.skill_links).toHaveLength(0);
    });

    it('upstream from C should find A,B,C with proper links', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: C.id,
        direction: 'upstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(3);

      const skillC = data?.find(s => s.skill_id === C.id)!;
      expect(skillC?.skill_links).toHaveLength(1);
      expect((skillC?.skill_links[0] as any).to).toBe(B.id);

      const skillB = data?.find(s => s.skill_id === B.id)!;
      expect(skillB?.skill_links).toHaveLength(1);
      expect((skillB?.skill_links[0] as any).to).toBe(A.id);

      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA?.skill_links).toHaveLength(0);
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

    it('downstream from A should find A,B,C,D', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: A.id,
        direction: 'downstream'
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(4);

      const skillA = data?.find(s => s.skill_id === A.id)!;
      // A should have two direct links to B and C
      const toFromA = skillA?.skill_links.map((l: any) => l.to);
      expect(toFromA).toContain(B.id);
      expect(toFromA).toContain(C.id);

      const skillB = data?.find(s => s.skill_id === B.id)!;
      // B should have link to D
      expect(skillB?.skill_links).toHaveLength(1);
      expect((skillB?.skill_links[0] as any).to).toBe(D.id);

      const skillC = data?.find(s => s.skill_id === C.id)!;
      // C should have link to D
      expect(skillC?.skill_links).toHaveLength(1);
      expect((skillC?.skill_links[0] as any).to).toBe(D.id);

      const skillD = data?.find(s => s.skill_id === D.id)!;
      expect(skillD?.skill_links).toHaveLength(0);
    });

    it('upstream from D should find A,B,C,D', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: D.id,
        direction: 'upstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(4);

      const skillD = data?.find(s => s.skill_id === D.id)!;
      // D's links to B and C when going upstream
      const toD = skillD?.skill_links.map((l: any) => l.to);
      expect(toD).toContain(B.id);
      expect(toD).toContain(C.id);

      const skillB = data?.find(s => s.skill_id === B.id)!;
      expect(skillB.skill_links).toHaveLength(1);
      expect((skillB.skill_links[0] as any).to).toBe(A.id);

      const skillC = data?.find(s => s.skill_id === C.id)!;
      expect(skillC.skill_links).toHaveLength(1);
      expect((skillC.skill_links[0] as any).to).toBe(A.id);

      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA?.skill_links).toHaveLength(0);
    });
  });

  describe('Cycle Handling', () => {
    let A: any, B: any, C: any, D: any;

    it('setup cycle: A->B->C->D->B', async () => {
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

    it('downstream from A should return A,B,C,D but not get stuck in cycle', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: A.id,
        direction: 'downstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(4); // A,B,C,D

      // Ensure links are direct and no infinite paths
      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA.skill_links).toHaveLength(1);
      expect((skillA.skill_links[0] as any).to).toBe(B.id);

      const skillB = data?.find(s => s.skill_id === B.id)!;
      // B links: B->C
      expect(skillB.skill_links).toHaveLength(1);
      expect((skillB.skill_links[0] as any).to).toBe(C.id);

      const skillC = data?.find(s => s.skill_id === C.id)!;
      // C links: C->D
      expect(skillC.skill_links).toHaveLength(1);
      expect((skillC.skill_links[0] as any).to).toBe(D.id);

      const skillD = data?.find(s => s.skill_id === D.id)!;


      // D circular link is trimmed.
      expect(skillD.skill_links).toHaveLength(0);
    });
  });

  describe('Wide Tree', () => {
    let A: any, B: any, C: any, D: any, E: any, F: any;

    it('setup wide tree: A->B, A->C, A->D, A->E, A->F', async () => {
      A = await createSkill('Wide A');
      B = await createSkill('Wide B');
      C = await createSkill('Wide C');
      D = await createSkill('Wide D');
      E = await createSkill('Wide E');
      F = await createSkill('Wide F');

      await linkSkills(A.id, B.id);
      await linkSkills(A.id, C.id);
      await linkSkills(A.id, D.id);
      await linkSkills(A.id, E.id);
      await linkSkills(A.id, F.id);
    });

    it('downstream from A shows all children directly connected', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: A.id,
        direction: 'downstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(6);

      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA.skill_links).toHaveLength(5);
      const aTargets = skillA.skill_links.map((l: any) => l.to);
      expect(aTargets).toContain(B.id);
      expect(aTargets).toContain(C.id);
      expect(aTargets).toContain(D.id);
      expect(aTargets).toContain(E.id);
      expect(aTargets).toContain(F.id);

      // All others should have no downstream links
      [B, C, D, E, F].forEach(skl => {
        const node = data?.find(n => n.skill_id === skl.id)!;
        expect(node.skill_links).toHaveLength(0);
      });
    });

    it('upstream from one of the leaves (e.g., B) shows only A and B', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: B.id,
        direction: 'upstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);

      const skillB = data?.find(s => s.skill_id === B.id)!;
      expect(skillB.skill_links).toHaveLength(1);
      expect((skillB.skill_links[0] as any).to).toBe(A.id);

      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA.skill_links).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('non-existent skill should return empty', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: 'non_existent_skill',
        direction: 'downstream'
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('isolated skill (no links) should return just that skill', async () => {
      const isolated = await createSkill('Isolated Skill');

      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: isolated.id,
        direction: 'downstream'
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);

      const skillIso = data?.find(s => s.skill_id === isolated.id)!;
      expect(skillIso.skill_links).toHaveLength(0);
    });

    it('invalid direction should default to downstream', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: 'non_existent_skill',
        direction: 'invalid_direction'
      });
      // Non-existent skill returns empty, no error
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe('Double Diamond Pattern', () => {
    let A: any, B: any, C: any, D: any, E: any, F: any, G: any;
    let activityResults: { [key: string]: string[] } = {};  // Map skill IDs to their activity result IDs

    it('setup double diamond: A->B->D->E->G and A->C->D->F->G with activity results', async () => {
      // Create skills
      A = await createSkill('Double A');
      B = await createSkill('Double B');
      C = await createSkill('Double C');
      D = await createSkill('Double D');
      E = await createSkill('Double E');
      F = await createSkill('Double F');
      G = await createSkill('Double G');

      // Create links
      await linkSkills(A.id, B.id);
      await linkSkills(A.id, C.id);
      await linkSkills(B.id, D.id);
      await linkSkills(C.id, D.id);
      await linkSkills(D.id, E.id);
      await linkSkills(D.id, F.id);
      await linkSkills(E.id, G.id);
      await linkSkills(F.id, G.id);

      // Create activity results for each skill with different scores
      activityResults[A.id] = [];
      activityResults[B.id] = [];
      activityResults[C.id] = [];
      activityResults[D.id] = [];
      activityResults[E.id] = [];
      activityResults[F.id] = [];
      activityResults[G.id] = [];

      // A has one result
      const aResult = await createActivityForSkill(A.id, 0.9);
      activityResults[A.id].push(aResult.resultId);

      // B has two results
      const bResult1 = await createActivityForSkill(B.id, 0.7);
      const bResult2 = await createActivityForSkill(B.id, 0.8);
      activityResults[B.id].push(bResult1.resultId, bResult2.resultId);

      // C has one result
      const cResult = await createActivityForSkill(C.id, 0.6);
      activityResults[C.id].push(cResult.resultId);

      // D has three results
      const dResult1 = await createActivityForSkill(D.id, 0.5);
      const dResult2 = await createActivityForSkill(D.id, 0.6);
      const dResult3 = await createActivityForSkill(D.id, 0.7);
      activityResults[D.id].push(dResult1.resultId, dResult2.resultId, dResult3.resultId);

      // E has one result
      const eResult = await createActivityForSkill(E.id, 0.8);
      activityResults[E.id].push(eResult.resultId);

      // F has two results
      const fResult1 = await createActivityForSkill(F.id, 0.7);
      const fResult2 = await createActivityForSkill(F.id, 0.9);
      activityResults[F.id].push(fResult1.resultId, fResult2.resultId);

      // G has one result
      const gResult = await createActivityForSkill(G.id, 1.0);
      activityResults[G.id].push(gResult.resultId);
    });

    it('downstream from A should find all nodes with proper links and activity results', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: A.id,
        direction: 'downstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(7); // A,B,C,D,E,F,G

      // Verify each skill has correct number of activity results
      const skillA = data?.find(s => s.skill_id === A.id)!;
      expect(skillA.user_activity_result_ids).toHaveLength(1);
      expect(skillA.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[A.id]));

      const skillB = data?.find(s => s.skill_id === B.id)!;
      expect(skillB.user_activity_result_ids).toHaveLength(2);
      expect(skillB.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[B.id]));

      const skillC = data?.find(s => s.skill_id === C.id)!;
      expect(skillC.user_activity_result_ids).toHaveLength(1);
      expect(skillC.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[C.id]));

      const skillD = data?.find(s => s.skill_id === D.id)!;
      expect(skillD.user_activity_result_ids).toHaveLength(3);
      expect(skillD.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[D.id]));

      const skillE = data?.find(s => s.skill_id === E.id)!;
      expect(skillE.user_activity_result_ids).toHaveLength(1);
      expect(skillE.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[E.id]));

      const skillF = data?.find(s => s.skill_id === F.id)!;
      expect(skillF.user_activity_result_ids).toHaveLength(2);
      expect(skillF.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[F.id]));

      const skillG = data?.find(s => s.skill_id === G.id)!;
      expect(skillG.user_activity_result_ids).toHaveLength(1);
      expect(skillG.user_activity_result_ids).toEqual(expect.arrayContaining(activityResults[G.id]));

      // Also verify the links are still correct
      expect(skillA.skill_links).toHaveLength(2);
      expect(skillD.skill_links).toHaveLength(2);
      expect(skillG.skill_links).toHaveLength(0);
    });
  });

  describe('Irrelevant Parent Links', () => {
    let A: any, B: any, C: any, Q: any;

    it('setup path with irrelevant parent: A->B->C and Q->B', async () => {
      A = await createSkill('Main A');
      B = await createSkill('Main B');
      C = await createSkill('Main C');
      Q = await createSkill('Irrelevant Q');

      await linkSkills(A.id, B.id);
      await linkSkills(B.id, C.id);
      await linkSkills(Q.id, B.id);
    });

    it('downstream from A should not include Q->B link', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: A.id,
        direction: 'downstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(3); // A,B,C only, no Q

      const skillB = data?.find(s => s.skill_id === B.id)!;
      // B should only have B->C link, not Q->B
      expect(skillB.skill_links).toHaveLength(1);
      expect((skillB.skill_links[0] as any).to).toBe(C.id);

      // Q should not be in the results at all
      expect(data?.find(s => s.skill_id === Q.id)).toBeUndefined();
    });

    it('upstream from C should include Q->B link', async () => {
      const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
        user_id: ownerUser.rsnUserId,
        input_skill_id: C.id,
        direction: 'upstream'
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(4); // C,B,A,Q

      const skillB = data?.find(s => s.skill_id === B.id)!;
      // B should have two links: B->C and Q->B
      expect(skillB.skill_links).toHaveLength(2);

      // Q should be in the results
      expect(data?.find(s => s.skill_id === Q.id)).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    const PERFORMANCE_THRESHOLD_MS = 2000; // 1000ms max

    describe('Large Branching Tree', () => {
      const BRANCH_WIDTH = 10;  // 10 children per node
      const TREE_DEPTH = 2;     // 2 levels deep (1 + 10 + 100 = 111 nodes)
      let root: any;
      let allNodes: any[] = [];

      it('setup large branching tree', async () => {
        // Create root
        root = await createSkill('Root');
        allNodes.push(root);

        // Create first level
        let currentLevel = [root];
        for (let depth = 0; depth < TREE_DEPTH; depth++) {
          const nextLevel = [];
          for (const parent of currentLevel) {
            for (let i = 0; i < BRANCH_WIDTH; i++) {
              const child = await createSkill(`Node_${depth}_${i}`);
              await linkSkills(parent.id, child.id);
              nextLevel.push(child);
              allNodes.push(child);
            }
          }
          currentLevel = nextLevel;
        }
      });

      it('should quickly traverse large tree downstream', async () => {
        const start = performance.now();

        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: root.id,
          direction: 'downstream'
        });

        const duration = performance.now() - start;

        expect(error).toBeNull();
        expect(data).toHaveLength(1 + BRANCH_WIDTH + Math.pow(BRANCH_WIDTH, 2)); // All nodes
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      });
    });

    describe('Deep Linear Chain', () => {
      const CHAIN_LENGTH = 100;
      let firstNode: any;
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
      });

      it('should quickly traverse deep chain downstream', async () => {
        const start = performance.now();

        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: firstNode.id,
          direction: 'downstream'
        });

        const duration = performance.now() - start;

        expect(error).toBeNull();
        expect(data).toHaveLength(CHAIN_LENGTH);
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      });
    });

    describe('Complex Network', () => {
      const NETWORK_SIZE = 20;
      const CONNECTIONS_PER_NODE = 3;
      let nodes: any[] = [];

      it('setup complex network with multiple paths', async () => {
        // Create all nodes first
        for (let i = 0; i < NETWORK_SIZE; i++) {
          const node = await createSkill(`Network_${i}`);
          nodes.push(node);
        }

        // Create random connections, ensuring no cycles
        for (let i = 0; i < NETWORK_SIZE; i++) {
          const possibleTargets = nodes.slice(i + 1); // Only connect to nodes with higher index to avoid cycles
          const connections = Math.min(CONNECTIONS_PER_NODE, possibleTargets.length);

          // Randomly select targets
          for (let j = 0; j < connections; j++) {
            const targetIndex = Math.floor(Math.random() * possibleTargets.length);
            const target = possibleTargets[targetIndex];
            await linkSkills(nodes[i].id, target.id);
            possibleTargets.splice(targetIndex, 1); // Remove used target
          }
        }
      });

      it('should quickly traverse complex network downstream', async () => {
        const start = performance.now();

        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: nodes[0].id,
          direction: 'downstream'
        });

        const duration = performance.now() - start;

        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThan(1);
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      });
    });
  });

  describe('Advanced Edge Cases', () => {
    describe('Multiple Cycles', () => {
      let A: any, B: any, C: any, D: any, E: any, F: any;

      it('setup two independent cycles: A->B->C->A and D->E->F->D', async () => {
        // First cycle
        A = await createSkill('Cycle1 A');
        B = await createSkill('Cycle1 B');
        C = await createSkill('Cycle1 C');
        await linkSkills(A.id, B.id);
        await linkSkills(B.id, C.id);
        await linkSkills(C.id, A.id);

        // Second cycle
        D = await createSkill('Cycle2 D');
        E = await createSkill('Cycle2 E');
        F = await createSkill('Cycle2 F');
        await linkSkills(D.id, E.id);
        await linkSkills(E.id, F.id);
        await linkSkills(F.id, D.id);
      });

      it('should handle traversal from A without infinite loops', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
        expect(data).toHaveLength(3); // Only A,B,C, not D,E,F
      });
    });

    describe('Self References and Duplicates', () => {
      let A: any, B: any;

      it('should prevent self-referential links', async () => {
        A = await createSkill('Self A');

        // Attempt self reference
        const { error } = await ownerUser.sb
          .from('skill_link')
          .insert({
            upstream_skill: A.id,
            downstream_skill: A.id,
            created_by: ownerUser.rsnUserId
          });

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/violates check constraint/);
      });

      it('should handle duplicate links', async () => {
        B = await createSkill('Target B');

        // Create first link
        await linkSkills(A.id, B.id);

        // Attempt duplicate link
        const { error } = await ownerUser.sb
          .from('skill_link')
          .insert({
            upstream_skill: A.id,
            downstream_skill: B.id,
            created_by: ownerUser.rsnUserId
          });

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/unique constraint/);
      });

      it('should show single link in traversal', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
        expect(data).toHaveLength(2); // A and B only

        const skillA = data?.find(s => s.skill_id === A.id)!;
        expect(skillA.skill_links).toHaveLength(1); // Should only show one A->B link
      });
    });

    describe('Hub Nodes', () => {
      const HUB_CONNECTIONS = 50; // High number of connections
      let hub: any;
      let spokes: any[] = [];

      it('setup hub with many connections', async () => {
        hub = await createSkill('Hub');
        for (let i = 0; i < HUB_CONNECTIONS; i++) {
          const spoke = await createSkill(`Spoke_${i}`);
          await linkSkills(hub.id, spoke.id);
          spokes.push(spoke);
        }
      });

      it('should efficiently handle hub node traversal', async () => {
        const start = performance.now();

        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: hub.id,
          direction: 'downstream'
        });

        const duration = performance.now() - start;

        expect(error).toBeNull();
        expect(data).toHaveLength(HUB_CONNECTIONS + 1); // Hub + all spokes
        expect(duration).toBeLessThan(250); // Should still be fast
      });
    });

    describe('Special Characters and Lengths', () => {
      it('should handle empty skill names', async () => {
        const emptySkill = await createSkill('');
        const { data } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: emptySkill.id,
          direction: 'downstream'
        });
        expect(data).toHaveLength(1);
      });

      it('should handle special characters', async () => {
        const specialSkill = await createSkill('!@#$%^&*()_+-=[]{}|;:,.<>?/~`');
        const { data } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: specialSkill.id,
          direction: 'downstream'
        });
        expect(data).toHaveLength(1);
      });

      it('should handle very long skill names', async () => {
        const longName = 'a'.repeat(1000);
        const longSkill = await createSkill(longName);
        const { data } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: longSkill.id,
          direction: 'downstream'
        });
        expect(data).toHaveLength(1);
      });
    });
  });

  describe('Special Patterns', () => {
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

      it('should handle figure 8 traversal without loops', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
        expect(data).toHaveLength(5); // Should include all nodes but not get stuck
      });
    });
  });

  describe('Business Logic Cases', () => {
    describe('Multiple Activity Results', () => {
      let skill: any;

      it('setup skill with multiple activity results', async () => {
        skill = await createSkill('Multi-Activity Skill');

        // Create multiple activities with different scores
        await createActivityForSkill(skill.id, 0.8);
        await createActivityForSkill(skill.id, 0.6);
        await createActivityForSkill(skill.id, 0.9);
      });

      it('should return all activity result IDs', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: skill.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();

        const skillNode = data?.find(s => s.skill_id === skill.id)!;
        expect(skillNode.user_activity_result_ids).toHaveLength(3);
      });
    });
  });

  describe('Complex Graph Patterns', () => {
    describe('Butterfly Pattern', () => {
      let A: any, B1: any, B2: any, C1: any, C2: any, D: any;

      it('setup butterfly pattern: A->B1->C1->D and A->B2->C2->D', async () => {
        A = await createSkill('Start');
        B1 = await createSkill('Left Upper');
        B2 = await createSkill('Right Upper');
        C1 = await createSkill('Left Lower');
        C2 = await createSkill('Right Lower');
        D = await createSkill('End');

        // Left wing
        await linkSkills(A.id, B1.id);
        await linkSkills(B1.id, C1.id);
        await linkSkills(C1.id, D.id);

        // Right wing
        await linkSkills(A.id, B2.id);
        await linkSkills(B2.id, C2.id);
        await linkSkills(C2.id, D.id);
      });

      it('should traverse butterfly pattern downstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
        expect(data).toHaveLength(6); // All nodes

        const skillA = data?.find(s => s.skill_id === A.id)!;
        expect(skillA.skill_links).toHaveLength(2); // A->B1, A->B2

        const skillD = data?.find(s => s.skill_id === D.id)!;
        expect(skillD.skill_links).toHaveLength(0); // End node
      });
    });

    describe('Fully Connected Subgraph', () => {
      const SUBGRAPH_SIZE = 4;
      let nodes: any[] = [];

      it('setup fully connected subgraph', async () => {
        // Create nodes
        for (let i = 0; i < SUBGRAPH_SIZE; i++) {
          const node = await createSkill(`Full_${i}`);
          nodes.push(node);
        }

        // Connect every node to every other node (directed)
        for (let i = 0; i < SUBGRAPH_SIZE; i++) {
          for (let j = 0; j < SUBGRAPH_SIZE; j++) {
            if (i !== j) { // Avoid self-links
              await linkSkills(nodes[i].id, nodes[j].id);
            }
          }
        }
      });

      it('should handle fully connected graph traversal', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: nodes[0].id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
        expect(data).toHaveLength(SUBGRAPH_SIZE);

        // First node should have links to all others
        const startNode = data?.find(s => s.skill_id === nodes[0].id)!;
        expect(startNode.skill_links).toHaveLength(SUBGRAPH_SIZE - 1);
      });
    });

    describe('Isolated Subgraphs with Bridge', () => {
      let A1: any, B1: any, C1: any;  // First subgraph
      let A2: any, B2: any, C2: any;  // Second subgraph
      let bridge: any;

      it('setup isolated subgraphs with single connecting bridge', async () => {
        // Create first subgraph (triangle)
        A1 = await createSkill('Sub1 A');
        B1 = await createSkill('Sub1 B');
        C1 = await createSkill('Sub1 C');
        await linkSkills(A1.id, B1.id);
        await linkSkills(B1.id, C1.id);
        await linkSkills(C1.id, A1.id);

        // Create second subgraph (triangle)
        A2 = await createSkill('Sub2 A');
        B2 = await createSkill('Sub2 B');
        C2 = await createSkill('Sub2 C');
        await linkSkills(A2.id, B2.id);
        await linkSkills(B2.id, C2.id);
        await linkSkills(C2.id, A2.id);

        // Create bridge node and connect
        bridge = await createSkill('Bridge');
        await linkSkills(C1.id, bridge.id);
        await linkSkills(bridge.id, A2.id);
      });

      it('should traverse across bridge downstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A1.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
        expect(data).toHaveLength(7); // All nodes from both subgraphs + bridge

        const bridgeNode = data?.find(s => s.skill_id === bridge.id)!;
        expect(bridgeNode.skill_links).toHaveLength(1); // Only bridge->A2
      });

      it('should traverse across bridge upstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A2.id,
          direction: 'upstream'
        });
        expect(error).toBeNull();

        const bridgeNode = data?.find(s => s.skill_id === bridge.id)!;
        expect(bridgeNode.skill_links).toHaveLength(1); // Only C1->bridge
      });
    });


  });

  describe('Skill Scoring', () => {
    describe('Linear Path Scoring', () => {
      let A: any, B: any, C: any;
  
      it('setup linear path A->B->C with scores', async () => {
        A = await createSkill('Score A');
        B = await createSkill('Score B');
        C = await createSkill('Score C');
  
        await linkSkills(A.id, B.id);
        await linkSkills(B.id, C.id);
  
        // Add scores: A=0.5, B=1.0, C=0.75
        await createActivityForSkill(A.id, 0.5);
        await createActivityForSkill(B.id, 1.0);
        await createActivityForSkill(C.id, 0.75);
      });
  
      it('should calculate correct cascading scores downstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
  
        const skillA = data?.find(s => s.skill_id === A.id) as LinkedSkillWithScore;
        const skillB = data?.find(s => s.skill_id === B.id) as LinkedSkillWithScore;
        const skillC = data?.find(s => s.skill_id === C.id) as LinkedSkillWithScore;
  
        expect(skillC.skill_score).toBeCloseTo(0.75); // Just its own score
        expect(skillB.skill_score).toBeCloseTo((1.0 + 0.75) / 2); // Its score + C
        expect(skillA.skill_score).toBeCloseTo((0.5 + 1.0 + 0.75) / 3); // All scores
      });

      it('should calculate correct cascading scores upstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: C.id,
          direction: 'upstream'
        });
        expect(error).toBeNull();

        const skillA = data?.find(s => s.skill_id === A.id) as LinkedSkillWithScore;
        const skillB = data?.find(s => s.skill_id === B.id) as LinkedSkillWithScore;
        const skillC = data?.find(s => s.skill_id === C.id) as LinkedSkillWithScore;

        expect(skillA.skill_score).toBeCloseTo(0.5); // Just its own score
        expect(skillB.skill_score).toBeCloseTo((1.0 + 0.5) / 2); // Its score + A
        expect(skillC.skill_score).toBeCloseTo((0.75 + 1.0 + 0.5) / 3); // All scores
      });
    });
  
    describe('Diamond Pattern Scoring', () => {
      let A: any, B: any, C: any, D: any;
  
      it('setup diamond A->B->D and A->C->D with scores', async () => {
        A = await createSkill('Score Diamond A');
        B = await createSkill('Score Diamond B');
        C = await createSkill('Score Diamond C');
        D = await createSkill('Score Diamond D');
  
        await linkSkills(A.id, B.id);
        await linkSkills(A.id, C.id);
        await linkSkills(B.id, D.id);
        await linkSkills(C.id, D.id);
  
        // Add scores: A=0.5, B=1.0, C=0.8, D=0.6
        await createActivityForSkill(A.id, 0.5);
        await createActivityForSkill(B.id, 1.0);
        await createActivityForSkill(C.id, 0.8);
        await createActivityForSkill(D.id, 0.6);
      });
  
      it('should calculate correct scores with diamond pattern', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
  
        const skillA = data?.find(s => s.skill_id === A.id) as LinkedSkillWithScore;
        const skillB = data?.find(s => s.skill_id === B.id) as LinkedSkillWithScore;
        const skillC = data?.find(s => s.skill_id === C.id) as LinkedSkillWithScore;
        const skillD = data?.find(s => s.skill_id === D.id) as LinkedSkillWithScore;
  
        expect(skillD.skill_score).toBeCloseTo(0.6); // Just D
        expect(skillB.skill_score).toBeCloseTo((1.0 + 0.6) / 2); // B + D
        expect(skillC.skill_score).toBeCloseTo((0.8 + 0.6) / 2); // C + D
        expect(skillA.skill_score).toBeCloseTo((0.5 + 1.0 + 0.8 + 0.6) / 4); // All nodes
      });

      it('should calculate correct scores with diamond pattern upstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: D.id,
          direction: 'upstream'
        });
        expect(error).toBeNull();

        const skillA = data?.find(s => s.skill_id === A.id) as LinkedSkillWithScore;
        const skillB = data?.find(s => s.skill_id === B.id) as LinkedSkillWithScore;
        const skillC = data?.find(s => s.skill_id === C.id) as LinkedSkillWithScore;
        const skillD = data?.find(s => s.skill_id === D.id) as LinkedSkillWithScore;

        expect(skillA.skill_score).toBeCloseTo(0.5); // Just A
        expect(skillB.skill_score).toBeCloseTo((1.0 + 0.5) / 2); // B + A
        expect(skillC.skill_score).toBeCloseTo((0.8 + 0.5) / 2); // C + A
        expect(skillD.skill_score).toBeCloseTo((0.6 + 1.0 + 0.8 + 0.5) / 4); // All nodes
      });
    });
  
    describe('Double Diamond Pattern Scoring', () => {
      let A: any, B: any, C: any, D: any, E: any, F: any, G: any;
  
      it('setup double diamond with scores', async () => {
        A = await createSkill('Score Double A');
        B = await createSkill('Score Double B');
        C = await createSkill('Score Double C');
        D = await createSkill('Score Double D');
        E = await createSkill('Score Double E');
        F = await createSkill('Score Double F');
        G = await createSkill('Score Double G');
  
        // A->B->D->E->G and A->C->D->F->G
        await linkSkills(A.id, B.id);
        await linkSkills(A.id, C.id);
        await linkSkills(B.id, D.id);
        await linkSkills(C.id, D.id);
        await linkSkills(D.id, E.id);
        await linkSkills(D.id, F.id);
        await linkSkills(E.id, G.id);
        await linkSkills(F.id, G.id);
  
        // Add scores: A=0.5, B=1.0, C=0.8, D=0.7, E=0.9, F=0.6, G=1.0
        await createActivityForSkill(A.id, 0.5);
        await createActivityForSkill(B.id, 1.0);
        await createActivityForSkill(C.id, 0.8);
        await createActivityForSkill(D.id, 0.7);
        await createActivityForSkill(E.id, 0.9);
        await createActivityForSkill(F.id, 0.6);
        await createActivityForSkill(G.id, 1.0);
      });
  
      it('should calculate correct scores with double diamond pattern', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: A.id,
          direction: 'downstream'
        });
        expect(error).toBeNull();
  
        const skillA = data?.find(s => s.skill_id === A.id) as LinkedSkillWithScore;
        const skillD = data?.find(s => s.skill_id === D.id) as LinkedSkillWithScore;
        const skillG = data?.find(s => s.skill_id === G.id) as LinkedSkillWithScore;
  
        expect(skillG.skill_score).toBeCloseTo(1.0); // Just G
        expect(skillD.skill_score).toBeCloseTo((0.7 + 0.9 + 0.6 + 1.0) / 4); // D + E + F + G
        expect(skillA.skill_score).toBeCloseTo((0.5 + 1.0 + 0.8 + 0.7 + 0.9 + 0.6 + 1.0) / 7); // All nodes
      });

      it('should calculate correct scores with double diamond pattern upstream', async () => {
        const { data, error } = await ownerUser.sb.rpc('get_linked_skills_with_scores_v2', {
          user_id: ownerUser.rsnUserId,
          input_skill_id: G.id,
          direction: 'upstream'
        });
        expect(error).toBeNull();

        const skillA = data?.find(s => s.skill_id === A.id) as LinkedSkillWithScore;
        const skillD = data?.find(s => s.skill_id === D.id) as LinkedSkillWithScore;
        const skillG = data?.find(s => s.skill_id === G.id) as LinkedSkillWithScore;

        expect(skillA.skill_score).toBeCloseTo(0.5); // Just A
        expect(skillD.skill_score).toBeCloseTo((0.7 + 1.0 + 0.8 + 0.5) / 4); // D + B + C + A
        expect(skillG.skill_score).toBeCloseTo((1.0 + 0.9 + 0.6 + 0.7 + 1.0 + 0.8 + 0.5) / 7); // All nodes
      });
    });
  }); 
});


