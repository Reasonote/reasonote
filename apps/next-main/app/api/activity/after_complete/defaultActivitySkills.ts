import {z} from "zod";

import {
  ActivityConfig,
  SkillLevel,
  SkillLevelSchema,
} from "@reasonote/core";
import {AI} from "@reasonote/lib-ai";
import {SimpleSkillTreeFactory} from "@reasonote/lib-ai-common";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

export async function getDefaultActivitySkills({ai, rsnUserId, supabase, skillId, activityConfig}: {ai: AI, rsnUserId: string, supabase: SupabaseClient<Database>, skillId: string, activityConfig: ActivityConfig}): Promise<{skillsForActivity: {name: string, parent?: string, level?: SkillLevel}[], treeData: Database['public']['Functions']['get_linked_skills_with_scores']['Returns']}> {
    const {data: treeData, error: treeError} = await supabase.rpc('get_linked_skills_with_scores', {
        input_skill_id: skillId,
        user_id: rsnUserId,
    })

    if (!treeData){
        throw new Error(`Error fetching skill tree for skill ${skillId}! (siskillTreeError: ${JSON.stringify(treeError, null, 2)})`)

    }

    const simpleTree = SimpleSkillTreeFactory.fromSkillsWithScores({
        skillsWithScores: treeData,
        skillId: skillId,
    });

    const skillTreeAsString = SimpleSkillTreeFactory.toAiStringNoLevels({skillTree: simpleTree, indent: 0});

    const aiResp = await ai.genObject({
        prompt: `
        <YOUR_TASK>
        You are responsible for determining what skills an activity demonstrates knowledge of.

        You will be given an activity config, and skill tree.

        New skills must be learning objectives, must begin with "Can ",  and should be in the active voice (i.e. "Can interpret sign language", "Can identify parts of car", etc)

        You should examine the config to determine what parts of the skill tree the activity demonstrates knowledge of.

        If you MUST create a new skill, you may do so.
        </YOUR_TASK>

        <ACTIVITY_CONFIG>
        This is the configuration for the activity.
        \`\`\`json
        ${JSON.stringify({activityConfig}, null, 2)}
        \`\`\`
        </ACTIVITY_CONFIG>

        <EXISTING_SKILL_TREE>
        This is the existing skill tree.
        ${skillTreeAsString}
        </EXISTING_SKILL_TREE>

        <FINAL_NOTES>
        - Remember, use the existing skill tree as much as possible.
        - If you NEED to create a new skill -- do so -- but make sure it's set at an appropriate level on the parent.
        - Only output 1-5 skills; the system will overload if you output too many skills, so be careful.
        </FINAL_NOTES>
        `,
        schema: z.object({
            skills: z.array(z.object({
                name: z.string(),
                newSkillInfo: z.object({
                    parent: z.string(),
                    level: SkillLevelSchema.optional().describe('IF THIS IS A NEW SKILL, this is its level on the parent'),
                })
            })).describe("The related skills to send to the student."),
        })
    });

    return {
        skillsForActivity: aiResp.object?.skills.map((s) => ({
            name: s.name,
            parent: s.newSkillInfo.parent,
            level: s.newSkillInfo.level
        })) ?? [],
        treeData
    }
} 