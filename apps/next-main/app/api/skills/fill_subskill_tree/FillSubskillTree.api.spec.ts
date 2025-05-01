import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {createTestUser} from "@/app/_common/testing/signupBetaUser";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {FillSubskillTreeRoute} from "./routeSchema";

describe('FillSubskillTree', () => {
  let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string, authToken: string };

  beforeAll(async () => {
    // Create test user
    ownerUser = await createTestUser('fillsubskilltree@example.com', 'password123');
  });

  describe('Basic Functionality', () => {
    let skillId: string;
    
    beforeAll(async () => {
      // Create a root skill for testing basic functionality
      const { data: skill, error: skillError } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: 'Basic Test Skill',
          _description: 'A skill for testing basic tree generation'
        })
        .select()
        .single();

      if (skillError || !skill) {
        throw new Error(`Failed to create test skill: ${skillError?.message}`);
      }
      skillId = skill.id;
    });

    it('should generate a skill tree with multiple levels', async () => {
      const response = await FillSubskillTreeRoute.call(
        {
          skill: {
            id: skillId,
          },
          maxDepth: 2,
          maxSubskillsPerSkill: 3
        },
        {
          baseUrl: "http://localhost:3456",
          headers: {
            Authorization: `Bearer ${ownerUser.authToken}`,
          },
        }
      );

      expect(response.success).toBe(true);
      expect(response.data?.newSkillIds).toBeDefined();
      expect(response.data?.newSkillIds.length).toBeGreaterThan(0);

      // Verify the structure of created skills
      const { data: createdSkills } = await ownerUser.sb
        .from('skill')
        .select('*, skill_link!upstream_skill(*)')
        .in('id', response.data?.newSkillIds ?? []);

      expect(createdSkills).toBeDefined();
      expect(createdSkills!.length).toBeGreaterThan(0);

      // Verify that skills are properly linked
      const hasLinks = createdSkills?.some(skill => 
        skill.skill_link && skill.skill_link.length > 0
      );
      expect(hasLinks).toBe(true);
    });

    afterAll(async () => {
      // Clean up the basic test skill
      if (skillId) {
        await ownerUser.sb
          .from('skill')
          .delete()
          .eq('id', skillId);
      }
    });
  });

  describe('Resource Integration', () => {
    let skillId: string;
    let pageId: string;
    let snipId: string;

    const imaginarySkillName = 'BLEARGH';
    const imaginaryResources = [
      {
        name: 'BLEARGH FUNDAMENTALS',
        content: `
          # YEARGH
          When dealing with YEARGH, you must always remember to keep the FLOOBLEBERG in mind.

          # THE FROB
          When dealing with THE FROB, the NOMBY must be kept to a minimum.
        `
      }
    ];

    const imaginarySnip = {
      name: 'Advanced BLEARGH Concepts',
      content: `
        # ZOOP MECHANICS
        The ZOOP is a critical component of any BLEARGH system. When implementing ZOOP,
        you must ensure that the WAZZLEBLOT is properly calibrated.

        # QUIXXLE PATTERNS
        QUIXXLE patterns emerge when multiple BLEARGH instances interact. The resulting
        FIZZLEWICK formations can be quite spectacular.
      `,
      sourceUrl: 'https://example.com/bleargh-docs'
    };

    beforeAll(async () => {
      // Create root skill (unchanged)
      const { data: skill, error: skillError } = await ownerUser.sb
        .from('skill')
        .insert({
          _name: imaginarySkillName,
          _description: 'The study of algorithms that can learn from data'
        })
        .select()
        .single();

      if (skillError || !skill) {
        throw new Error(`Failed to create test skill: ${skillError?.message}`);
      }
      skillId = skill.id;

      // Create resource page (unchanged)
      const { data: page, error: pageError } = await ownerUser.sb
        .from('rsn_page')
        .insert(imaginaryResources.map((r) => ({
          _name: r.name,
          body: r.content,
          created_by: ownerUser.rsnUserId
        })))
        .select()
        .single();

      if (pageError || !page) {
        throw new Error(`Failed to create test page: ${pageError?.message}`);
      }
      pageId = page.id;

      // Create snip
      const { data: snip, error: snipError } = await ownerUser.sb
        .from('snip')
        .insert({
          _type: 'document',
          _name: imaginarySnip.name,
          text_content: imaginarySnip.content,
          source_url: imaginarySnip.sourceUrl,
          created_by: ownerUser.rsnUserId
        })
        .select()
        .single();

      if (snipError || !snip) {
        throw new Error(`Failed to create test snip: ${snipError?.message}`);
      }
      snipId = snip.id;

      // Link both resources to the skill
      const { error: resourceError } = await ownerUser.sb
        .from('resource')
        .insert([
          {
            parent_skill_id: skillId,
            child_page_id: pageId,
            created_by: ownerUser.rsnUserId
          },
          {
            parent_skill_id: skillId,
            child_snip_id: snipId,
            created_by: ownerUser.rsnUserId
          }
        ]);

      if (resourceError) {
        throw new Error(`Failed to create resource links: ${resourceError.message}`);
      }
    });

    it('should incorporate resource content into generated skills', async () => {
      const response = await FillSubskillTreeRoute.call(
        {
          skill: {
            id: skillId,
          },
          maxDepth: 2,
          maxSubskillsPerSkill: 3
        },
        {
          baseUrl: "http://localhost:3456",
          headers: {
            Authorization: `Bearer ${ownerUser.authToken}`,
          },
        }
      );

      console.log(JSON.stringify(response, null, 2));
      expect(response.success).toBe(true);
      expect(response.data?.newSkillIds).toBeDefined();
      expect(response.data?.newSkillIds.length).toBeGreaterThan(0);

      // Fetch all created skills
      const { data: createdSkills } = await ownerUser.sb
        .from('skill')
        .select('_name, _description')
        .in('id', response.data?.newSkillIds ?? []);

      expect(createdSkills).toBeDefined();

      // Check if any of the created skills reference concepts from our resource
      const hasResourceContent = createdSkills?.some(skill => {
        const skillContent = `${skill._name} ${skill._description}`.toLowerCase();
        return (
          // Terms from page
          skillContent.includes('yeargh') ||
          skillContent.includes('frob') ||
          // Terms from snip
          skillContent.includes('zoop') ||
          skillContent.includes('quixxle') ||
          skillContent.includes('wazzleblot') ||
          skillContent.includes('fizzlewick')
        );
      });

      expect(hasResourceContent).toBe(true);
    });

    afterAll(async () => {
      // Clean up all test resources
      if (skillId) {
        await ownerUser.sb
          .from('skill')
          .delete()
          .eq('id', skillId);
      }

      if (pageId) {
        await ownerUser.sb
          .from('rsn_page')
          .delete()
          .eq('id', pageId);
      }

      if (snipId) {
        await ownerUser.sb
          .from('snip')
          .delete()
          .eq('id', snipId);
      }
    });
  });
});
