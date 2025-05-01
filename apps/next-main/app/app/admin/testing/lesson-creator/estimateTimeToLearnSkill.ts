import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

import {TimeSchema} from "./genBloomTaxonomy";
import {
  formatUserSkillContext,
  UserSkillContext,
} from "./UserContext";

export interface SkillContext {
    skillName: string;
    userContext: UserSkillContext;
}

export const TimeToLearnSkillResultSchema = z.object({
    timeToLearn: TimeSchema.describe('The amount of time you expect it would take for the user to learn this skill, and demonstrate mastery of it.'),
})

export async function timeToLearnSkill({
    skill
}: {
    skill: SkillContext,
}) {
    return await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for estimating the amount of time it would take to learn the skill: "${skill.skillName}".

        --------------------------------------------
        
        ${formatUserSkillContext(skill.userContext)}

        `,
        functionName: "estimateTimeToLearnSkill",
        functionDescription: "Output Lessons based on Bloom's taxonomy for the subject.",
        functionParameters: TimeToLearnSkillResultSchema
    })
}