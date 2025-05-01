import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {createTestUser} from "@/app/_common/testing/signupBetaUser";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {SuggestPartialSkillRoute} from "./routeSchema";

describe('SuggestPartialSkill', () => {
  let testUser: { sb: SupabaseClient<Database>, rsnUserId: string, authToken: string };

  beforeAll(async () => {
    // Create test user
    testUser = await createTestUser('suggestpartialskill@example.com', 'password123');
  });

  describe('Basic Functionality', () => {
    it('should suggest a skill based on user input', async () => {
      const response = await SuggestPartialSkillRoute.call(
        {
          userInput: "Python programming for beginners",
        },
        {
          baseUrl: "http://localhost:3456",
          headers: {
            Authorization: `Bearer ${testUser.authToken}`,
          },
        }
      );

      expect(response.success).toBe(true);
      expect(response.data?.skillId).toBeDefined();
      expect(response.data?.partialSkillId).toBeDefined();

      if (!response.data?.skillId || !response.data?.partialSkillId) {
        throw new Error('Response data is missing required fields');
      }

      // Verify the created skill
      const { data: skill } = await testUser.sb
        .from('skill')
        .select('*')
        .eq('id', response.data.skillId)
        .single();

      expect(skill).toBeDefined();
      expect(skill?._name).toBeDefined();
      expect(skill?._description).toBeDefined();
      expect(skill?.emoji).toBeDefined();

      // Verify the user_skill relationship
      const { data: userSkill } = await testUser.sb
        .from('user_skill')
        .select('*')
        .eq('skill', response.data.skillId)
        .eq('rsn_user', testUser.rsnUserId)
        .single();

      expect(userSkill).toBeDefined();
      expect(userSkill?.self_assigned_level).toBeDefined();
      expect(userSkill?.interest_reasons).toBeDefined();
      expect(Array.isArray(userSkill?.interest_reasons)).toBe(true);

      // Verify the partial_skill record
      const { data: partialSkill } = await testUser.sb
        .from('partial_skill')
        .select('*')
        .eq('id', response.data.partialSkillId)
        .single();

      expect(partialSkill).toBeDefined();
      expect(partialSkill?.user_input).toBe("Python programming for beginners");
      expect(partialSkill?.skill_id).toBe(response.data.skillId);
    });

    afterAll(async () => {
      // Clean up skills created during tests
      const { data: skills } = await testUser.sb
        .from('skill')
        .select('id')
        .eq('_name', 'Python Programming Basics');

      if (skills && skills.length > 0) {
        await testUser.sb
          .from('skill')
          .delete()
          .in('id', skills.map(s => s.id));
      }
    });
  });

  describe('Document Integration', () => {
    let documentId: string;
    // Track the IDs of skills created during tests for cleanup
    const createdSkillIds: string[] = [];
    
    beforeAll(async () => {
      // Create a sample document directly in the database
      const documentContent = `# Introduction to Machine Learning
        
      Machine learning is a field of artificial intelligence that uses statistical techniques to give computer systems the ability to "learn" from data, without being explicitly programmed.
      
      ## Types of Machine Learning
      
      1. **Supervised Learning**: The algorithm is trained on labeled data.
      2. **Unsupervised Learning**: The algorithm finds patterns in unlabeled data.
      3. **Reinforcement Learning**: The algorithm learns through trial and error.
      
      ## Common Algorithms
      
      - Linear Regression
      - Decision Trees
      - Neural Networks
      - Support Vector Machines
      - K-means Clustering
      
      ## Applications
      
      Machine learning is used in various fields including:
      - Image and speech recognition
      - Natural language processing
      - Recommendation systems
      - Fraud detection
      - Autonomous vehicles`;
      
      // Insert the document directly into rsn_page
      const { data: page, error } = await testUser.sb
        .from('rsn_page')
        .insert({
          _name: 'Introduction to Machine Learning',
          body: documentContent,
          original_filename: 'intro_to_ml.md',
          file_type: 'text/markdown',
          created_by: testUser.rsnUserId
        })
        .select()
        .single();
      
      if (error || !page) {
        throw new Error(`Failed to create test page: ${error?.message}`);
      }
      
      documentId = page.id;
      
      // Wait a moment to allow vector embedding to be generated
      // This simulates the waiting that would happen in the actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
    
    it('should suggest a skill based on document content', async () => {
      const response = await SuggestPartialSkillRoute.call(
        {
          documents: [
            {
              resourceId: documentId,
            }
          ],
        },
        {
          baseUrl: "http://localhost:3456",
          headers: {
            Authorization: `Bearer ${testUser.authToken}`,
          },
        }
      );
      
      expect(response.success).toBe(true);
      expect(response.data?.skillId).toBeDefined();
      expect(response.data?.partialSkillId).toBeDefined();
      
      if (!response.data?.skillId || !response.data?.partialSkillId) {
        throw new Error('Response data is missing required fields');
      }
      
      // Track the created skill ID for cleanup
      createdSkillIds.push(response.data.skillId);
      
      // Verify the created skill
      const { data: skill } = await testUser.sb
        .from('skill')
        .select('*')
        .eq('id', response.data.skillId)
        .single();
      
      expect(skill).toBeDefined();
      expect(skill?._name).toBeDefined();
      expect(skill?._description).toBeDefined();
      
      // Verify the skill content is related to machine learning
      const skillContent = `${skill?._name} ${skill?._description}`.toLowerCase();
      expect(
        skillContent.includes('machine') || 
        skillContent.includes('learning') || 
        skillContent.includes('ai') || 
        skillContent.includes('algorithm')
      ).toBe(true);
      
      // Verify the partial_skill record
      const { data: partialSkill } = await testUser.sb
        .from('partial_skill')
        .select('*')
        .eq('id', response.data.partialSkillId)
        .single();
      
      expect(partialSkill).toBeDefined();
      expect(partialSkill?.pages).toContain(documentId);
    });
    
    it('should suggest a skill based on both user input and document content', async () => {
      const response = await SuggestPartialSkillRoute.call(
        {
          userInput: "I want to learn about supervised learning techniques",
          documents: [
            {
              resourceId: documentId,
            }
          ],
        },
        {
          baseUrl: "http://localhost:3456",
          headers: {
            Authorization: `Bearer ${testUser.authToken}`,
          },
        }
      );
      
      expect(response.success).toBe(true);
      expect(response.data?.skillId).toBeDefined();
      expect(response.data?.partialSkillId).toBeDefined();
      
      if (!response.data?.skillId || !response.data?.partialSkillId) {
        throw new Error('Response data is missing required fields');
      }
      
      // Track the created skill ID for cleanup
      createdSkillIds.push(response.data.skillId);
      
      // Verify the created skill
      const { data: skill } = await testUser.sb
        .from('skill')
        .select('*')
        .eq('id', response.data.skillId)
        .single();
      
      expect(skill).toBeDefined();
      
      // Verify the skill content is related to supervised learning
      const skillContent = `${skill?._name} ${skill?._description}`.toLowerCase();
      expect(
        skillContent.includes('supervised') || 
        skillContent.includes('learning')
      ).toBe(true);
      
      // Verify the partial_skill record
      const { data: partialSkill } = await testUser.sb
        .from('partial_skill')
        .select('*')
        .eq('id', response.data.partialSkillId)
        .single();
      
      expect(partialSkill).toBeDefined();
      expect(partialSkill?.user_input).toBe("I want to learn about supervised learning techniques");
      expect(partialSkill?.pages).toContain(documentId);
    });
    
    afterAll(async () => {
      // Clean up only the specific document we created
      if (documentId) {
        await testUser.sb
          .from('rsn_page')
          .delete()
          .eq('id', documentId);
      }
      
      // Clean up only the specific skills we created
      if (createdSkillIds.length > 0) {
        await testUser.sb
          .from('skill')
          .delete()
          .in('id', createdSkillIds);
      }
    });
  });
}); 