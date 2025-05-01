import { z } from "zod";

import { ActivityResultUngradedBaseSchema } from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const SocraticActivityConfigV0_0_0Schema = ActivityConfigBaseSchema.extend({
    type: z.literal('socratic').optional().default('socratic'),
    version: z.literal('0.0.0').optional().default('0.0.0'),
    setting: z.object({
        emoji: z.string().describe('An emoji to represent the setting.'),
        name: z.string(),
        description: z.string(),
    }).passthrough().describe("The setting of the activity."), 
    learningObjectives: z.array(z.object({
        name: z.string().describe("The name of the learning objective."),
        objective: z.string().describe("1-2 sentences describing the learning objective."),
    }).passthrough()).describe("The teachers will be graded on these objectives."),
    skillName: z.string(),
})
export type SocraticActivityConfigV0_0_0 = z.infer<typeof SocraticActivityConfigV0_0_0Schema>;

export const SocraticActivityConfigSchema = SocraticActivityConfigV0_0_0Schema;
export type SocraticActivityConfig = z.infer<typeof SocraticActivityConfigSchema>;

export const SocraticResultSchema = ActivityResultUngradedBaseSchema.extend({
    activityType: z.literal('socratic').optional().default('socratic'),
    resultData: z.object({
        conversation: z.array(z.object({
            role: z.enum(['user', 'assistant', 'system', 'function']),
            content: z.string().nullable().optional(),
        })),
    }),
    activityConfig: SocraticActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A markdown feedback on the user's performance. This will be shown to the user regardless of whether they got the question right or wrong."),
        aboveTheFoldAnswer: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance. This will be shown to the user regardless of whether they got the question right or wrong."),
    }).passthrough(),
}).passthrough();
export type SocraticResult = z.infer<typeof SocraticResultSchema>;