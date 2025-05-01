import _ from "lodash";
import {NextResponse} from "next/server";
import {z} from "zod";

import {trimAllLines} from "@lukebechtel/lab-ts-utils";
import {SimpleSkillTreeFactory} from "@reasonote/lib-ai-common";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {
  CreateOperation,
  MoveOperation,
  OperationSchema,
  SkillsReorganizeTreeRoute,
} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const {
    POST,
    handler: ReorganizeSkillTreeRouteHandler,
} = makeServerApiHandlerV3({
    route: SkillsReorganizeTreeRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user, ai } = ctx;

        const { skillId, userId } = parsedReq;

        // Fetch the current skill tree
        const { data: treeData, error: treeError } = await supabase.rpc('get_linked_skills_with_scores', {
            input_skill_id: skillId,
            user_id: userId,
        });

        if (!treeData) {
            return NextResponse.json({
                error: `Error fetching skill tree for skill ${skillId}!`
            }, { status: 500 });
        }

        const simpleTree = SimpleSkillTreeFactory.fromSkillsWithScores({
            skillsWithScores: treeData,
            skillId: skillId,
        });

        const skillTreeAsString = SimpleSkillTreeFactory.toAiStringNoLevels({ skillTree: simpleTree, indent: 0 });

        // Create a map of skill names to IDs
        const skillNameToId = new Map(treeData.map(skill => [skill.skill_name, skill.skill_id]));

        // AI suggestion for reorganization
        const aiResult = await ai.genObject({
            prompt: trimAllLines(`
                You are an expert in organizing knowledge and skill trees. Your task is to analyze the given skill tree and suggest reorganization to improve its structure and coherence.

                Here are the types of operations you can suggest:
                1. Move one or more skills to a different parent (change their place in the hierarchy)
                2. Create a new skill as an intermediary grouping

                For move operations, provide:
                - Type: "move"
                - Skill names to be moved (array of strings)
                - New parent name
                - New level on parent

                For create operations, provide:
                - Type: "create"
                - New skill name
                - Parent name
                - New level on parent

                Focus on these aspects when reorganizing:
                - Logical grouping of related skills
                - Appropriate skill progression (from basic to advanced)
                - Clarity and coherence of the overall structure
                - Avoiding unnecessary intermediate layers or redundant categories

                Guidelines for reorganization:
                1. Only create new intermediate skills if they significantly improve the organization and understanding of the topic.
                2. Avoid creating categories that merely repeat the parent skill name or add no new information.
                3. If a skill has only one or two sub-skills, consider moving these sub-skills up a level rather than keeping a separate category.
                4. Look for opportunities to consolidate similar or overlapping skills.
                5. Ensure that each level of the hierarchy adds meaningful categorization or progression.

                Be conservative in your changes, only suggesting modifications that significantly improve the tree structure. Aim for a balance between depth and breadth, avoiding both overly flat and overly deep hierarchies.

                Here's a toy example of how your output should look:

                {
                    "operations": [
                        {
                            "type": "create",
                            "newSkillName": "Basic Arithmetic",
                            "parentName": "Mathematics",
                            "newLevel": "INTRO"
                        },
                        {
                            "type": "move",
                            "skillNames": ["Addition", "Subtraction"],
                            "newParentName": "Basic Arithmetic",
                            "newLevel": "INTRO"
                        },
                        {
                            "type": "create",
                            "newSkillName": "Advanced Arithmetic",
                            "parentName": "Mathematics",
                            "newLevel": "INTERMEDIATE"
                        },
                        {
                            "type": "move",
                            "skillNames": ["Multiplication", "Division"],
                            "newParentName": "Advanced Arithmetic",
                            "newLevel": "BASIC"
                        }
                    ],
                }

                Provide your suggestions as a list of operations.
            `),
            functionName: "suggest_tree_reorganization",
            functionDescription: "Suggest operations to reorganize the skill tree for better structure and coherence, avoiding unnecessary intermediate layers.",
            schema: z.object({
                operations: z.array(OperationSchema),
                // explanation: z.string().describe("A detailed explanation of the suggested changes and the rationale behind them"),
            }),
            messages: [
                {
                    role: 'user',
                    content: `Please analyze and suggest reorganization for the following skill tree. Remember to avoid creating unnecessary intermediate layers or redundant categories:\n\n${skillTreeAsString}`
                }
            ],
        });

        if (!aiResult.object) {
            throw new Error(`Error getting AI suggestions for tree reorganization!`);
        }

        const { operations } = aiResult.object;

        // Separate create and move operations
        const createOperations: CreateOperation[] = operations.filter(op => op.type === "create") as CreateOperation[];
        const moveOperations: MoveOperation[] = operations.filter(op => op.type === "move") as MoveOperation[];

        // Apply the create operations first
        for (const op of createOperations) {
            const { data: newSkill } = await supabase.from('skill')
                .insert({ _name: op.newSkillName })
                .select('id')
                .single();

            if (newSkill) {
                const parentId = skillNameToId.get(op.parentName);
                if (parentId) {
                    await supabase.from('skill_link')
                        .insert({
                            downstream_skill: parentId,
                            upstream_skill: newSkill.id,
                            metadata: { levelOnParent: op.newLevel },
                        });
                }
                // Add the new skill to our map
                skillNameToId.set(op.newSkillName, newSkill.id);
            }
        }

        // Then apply the move operations
        for (const op of moveOperations) {
            for (const skillName of op.skillNames) {
                const skillId = skillNameToId.get(skillName);
                const newParentId = skillNameToId.get(op.newParentName);
                
                if (skillId && newParentId) {
                    await supabase.from('skill_link')
                        .update({
                            downstream_skill: newParentId,
                            metadata: { levelOnParent: op.newLevel },
                        })
                        .eq('upstream_skill', skillId);
                }
            }
        }

        // Fetch the updated tree
        const { data: updatedTreeData } = await supabase.rpc('get_linked_skills_with_scores', {
            input_skill_id: skillId,
            user_id: userId,
        });

        if (!updatedTreeData) {
            return NextResponse.json({
                error: `Error fetching updated skill tree for skill ${skillId}!`
            }, { status: 500 });
        }

        const updatedSimpleTree = SimpleSkillTreeFactory.fromSkillsWithScores({
            skillsWithScores: updatedTreeData,
            skillId: skillId,
        });

        const updatedSkillTreeAsString = SimpleSkillTreeFactory.toAiStringNoLevels({ skillTree: updatedSimpleTree, indent: 0 });

        return {
            operations: operations,
            updatedTreeString: updatedSkillTreeAsString,
        };
    }
});