import { z } from 'zod';

import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { AIGenerator } from '@reasonote/lib-ai-common';

import { AIExtraContext } from '../../../../utils/AIExtraContext';
import { skillTreeToPrereqSkillTree } from '../../../../utils/prereqSkillTree';
import { SkillTreeNode } from '../../interfaces';

export const SkillTreeFeedbackSchema = z.object({
    chainOfThoughts: z.array(z.string()),
    feedback: z.object({
        suggestedChanges: z.array(z.object({
            skillName: z.string().describe('The name of the skill that should be changed.'),
            changes: z.string().describe('A description of the changes that should be made to the skill.'),
        })).nullable(),
        grading: z.object({
            detailScore0To100: z.number().describe('A score between 0 and 100, representing how detailed the skill tree is.'),
            lowLevelCoverage0To100: z.number().describe('A score between 0 and 100, representing how much of the subject was covered at the lowest level.'),
            highLevelCoverage0To100: z.number().describe('A score between 0 and 100, representing how much of the subject was covered at the highest level.'),
            grade0To100: z.number().describe('A score between 0 and 100, representing how complete the skill tree is.'),
        }),
    }),
});

export type SkillTreeFeedback = z.infer<typeof SkillTreeFeedbackSchema>;
export async function giveFeedbackOnSkillTree({
    ai,
    rootSkill,
    extraContext,
    treeVisualizationMode,
    feedback,
}: {
    ai: AIGenerator;
    rootSkill: SkillTreeNode;
    extraContext?: AIExtraContext[];
    treeVisualizationMode?: 'prereqTree' | 'skillTree';
    feedback?: string;
}): Promise<SkillTreeFeedback[]> {
    // Handle the root node first
    const rootResult = await ai.genObject({
        prompt: trimAllLines(`
            <YOUR_TASK>
                You are a world class AI tutor.
                You are responsible for determining if the skill tree is complete.
                You will be given a skill tree for a subject, and asked to grade it.
            </YOUR_TASK>

            <REQUIREMENTS>
                <GRANULARITY>
                    In order to properly teach students, we need to keep track of their "knowledge tree".
                    We want the skill tree to be *very* granular, as it is intended to be the foundation for a very granular piece of software.
                </GRANULARITY>
                <REDUNDANCY>
                    We will list skills multiple times if they are prerequisites for multiple skills.

                    DO NOT COMMENT ON THIS.

                    This is an expected behavior.
                </REDUNDANCY>
            </REQUIREMENTS>

            ${extraContext ? `
                <EXTRA_CONTEXT>
                    ${extraContext.map(c => `
                        <${c.title}>
                            <APPLIES_WHEN description="When this context applies">
                                ${c.appliesWhen ?? ''}
                            </APPLIES_WHEN>
                            <BODY description="The context body">
                                ${c.body ?? ''}
                            </BODY>
                        </${c.title}>
                    `).join('\n')}
                </EXTRA_CONTEXT>` 
                : 
                ''
            }

            <SKILL_TREE>
                ${treeVisualizationMode === 'prereqTree' ? 
                    JSON.stringify(skillTreeToPrereqSkillTree(rootSkill), null, 2) : 
                    JSON.stringify(rootSkill, null, 2)
                }
            </SKILL_TREE>
        `),
        schema: SkillTreeFeedbackSchema,
        model: 'openai:gpt-4o-mini-2024-07-18',
        mode: 'json',
        providerArgs: {
            structuredOutputs: true,
        }
    });

    const results: SkillTreeFeedback[] = [rootResult.object];

    // Rate immediate children in parallel if they exist
    // if (rootSkill?.subskills) {
    //     const childPromises: Promise<SkillTreeFeedback>[] = [];

    //     Object.entries(rootSkill.subskills).forEach(([level, skills]) => {
    //         const promise = ai.genObject({
    //             prompt: trimAllLines(`
    //                 <YOUR_TASK>
    //                     You are a world class AI tutor.
    //                     You are responsible for determining if this specific skill and its immediate subskills are complete.
    //                     You will be given a skill tree node to evaluate.
    //                 </YOUR_TASK>

    //                 <REQUIREMENTS>
    //                     <GRANULARITY>
    //                         We want the skill tree to be *very* granular, as it is intended to be the foundation for a very granular piece of software.
    //                     </GRANULARITY>
    //                 </REQUIREMENTS>
                    
    //                 ${extraContext ? `
    //                     <ADDITIONAL_CONTEXT>
    //                         ${extraContext.map(c => c.toPrompt()).join('\n')}
    //                     </ADDITIONAL_CONTEXT>` 
    //                     : 
    //                 ''}

    //                 <SKILL_TREE>
    //                     <ROOT_SKILL name="${rootSkill.name}">
    //                         <${level.toUpperCase()}_LEVEL_SUBSKILLS>
    //                             ${JSON.stringify(skills, null, 2)}
    //                         </${level.toUpperCase()}_LEVEL_SUBSKILLS>
    //                     </ROOT_SKILL>
    //                 </SKILL_TREE>
    //             `),
    //             schema: SkillTreeFeedbackSchema,
    //             model: 'openai:gpt-4o-mini-2024-07-18',
    //             mode: 'json',
    //             providerArgs: {
    //                 structuredOutputs: true,
    //             }
    //         }).then(result => result.object);

    //         childPromises.push(promise);
    //     });

    //     const childResults = await Promise.all(childPromises);
    //     results.push(...childResults);
    // }

    return results;
}