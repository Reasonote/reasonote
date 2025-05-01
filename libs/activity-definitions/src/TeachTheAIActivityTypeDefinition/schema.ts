import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const TeachTheAIActivityConfigV0_0_0Schema = ActivityConfigBaseSchema.extend({
    type: z.literal('teach-the-ai').optional().default('teach-the-ai'),
    version: z.literal('0.0.0').optional().default('0.0.0'),
    aiInstructions: z.string(),
    skillName: z.string(),
})
export type TeachTheAIActivityConfigV0_0_0 = z.infer<typeof TeachTheAIActivityConfigV0_0_0Schema>;

export const TeachTheAIActivityConfigV0_1_0Schema = ActivityConfigBaseSchema.extend({
    type: z.literal('teach-the-ai').optional().default('teach-the-ai'),
    version: z.literal('0.1.0').optional().default('0.1.0'),
    setting: z.object({
        emoji: z.string().describe('An emoji to represent the setting.'),
        name: z.string(),
        description: z.string(),
    }).passthrough().describe("The setting of the activity."),
    narratorIntro: z.string().describe(`A short introduction to the activity, geared towards the user -- i.e. "You are in... X, and you're doing Y. {CHARACTER_NAME} approaches you, looking confused."`),
    characterInstructions: z.string().describe('How the system should roleplay the character.'),
    characterName: z.string().describe('The name of the character that the system will roleplay.'),
    characterEmoji: z.string().describe('An emoji that will be used to represent the character in the chat.'),
    teachingObjectives: z.array(z.object({
        objectiveName: z.string().describe("A short name for the objective"),
        objectiveDescription: z.string().describe("A short description of the objective."),
        private: z.object({
            gradingCriteria: z.string().describe("The criteria that will be used to grade the user's ability to teach this to the character, based on the chat history."),
        }).passthrough()
    }).passthrough()).describe("The teachers will be graded on these objectives."),
    skillName: z.string(),
})
export type TeachTheAIActivityConfigV0_1_0 = z.infer<typeof TeachTheAIActivityConfigV0_1_0Schema>;

export const TeachTheAIActivityConfigSchema = z.union([
    TeachTheAIActivityConfigV0_0_0Schema,
    TeachTheAIActivityConfigV0_1_0Schema
]);
export type TeachTheAIActivityConfig = z.infer<typeof TeachTheAIActivityConfigSchema>;


export const TeachTheAIGradedResultSchema = ActivityResultGradedBaseSchema.extend({
    gradeType: z.literal('graded-numeric').optional().default('graded-numeric'),
    activityType: z.literal('teach-the-ai').optional().default('teach-the-ai'),
    resultData: z.object({
        conversation: z.array(z.object({
            role: z.enum(['user', 'assistant', 'system', 'function']),
            content: z.string().nullable().optional(),
        })),
    }),
    activityConfig: TeachTheAIActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance."),
        aboveTheFoldAnswer: z.string().optional().nullable().describe("A 1 sentence answer to the question that is displayed above the fold."),
    }).optional().nullable(),
}).passthrough();

export const TeachTheAISkippedResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('teach-the-ai').optional().default('teach-the-ai'),
    activityConfig: TeachTheAIActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const TeachTheAIResultSchema = z.union([
    TeachTheAIGradedResultSchema,
    TeachTheAISkippedResultSchema
]);

export type TeachTheAIResult = z.infer<typeof TeachTheAIResultSchema>;

// Submit request schema
export const TeachTheAISubmitRequestSchema = z.object({
    conversation: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system', 'function']),
        content: z.string().nullable().optional(),
    })).describe("The conversation between the user and the AI character"),
});
export type TeachTheAISubmitRequest = z.infer<typeof TeachTheAISubmitRequestSchema>;

// Submit result details schema
export const TeachTheAISubmitResultDetailsSchema = z.object({
    objectiveGrades: z.array(z.object({
        objectiveName: z.string(),
        grade: z.number(),
        feedback: z.string(),
    })).describe("Grades for each teaching objective"),
    overallFeedback: z.string().describe("Overall feedback on the teaching session"),
});
export type TeachTheAISubmitResultDetails = z.infer<typeof TeachTheAISubmitResultDetailsSchema>;

// Submit result schema
export const TeachTheAISubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: TeachTheAISubmitResultDetailsSchema,
});
export type TeachTheAISubmitResult = z.infer<typeof TeachTheAISubmitResultSchema> & {
    details: TeachTheAISubmitResultDetails;
};