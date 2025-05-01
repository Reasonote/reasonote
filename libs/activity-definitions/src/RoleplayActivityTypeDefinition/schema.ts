import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const RoleplayActivityConfigSchemav0_0_0 = ActivityConfigBaseSchema.extend({
    type: z.literal('roleplay'),
    version: z.literal("0.0.0").optional().default("0.0.0"),
    userCharacter: z.object({
        objectives: z.array(z.object({
            objectiveName: z.string().describe("A short name for the objective"),
            objectiveDescription: z.string().describe("A short description of the objective."),
            private: z.object({
                gradingCriteria: z.string().describe("The criteria that will be used to grade the user's performance on this objective, based on the chat history."),
            }).passthrough()
        }).passthrough())
    }).passthrough().describe("The user's character -- defined simply by their objectives."),
    characters: z.array(z.object({
        public: z.object({
            emoji: z.string().describe('An emoji to represent this person / character. '),
            name: z.string(),
            description: z.string(),
        }).passthrough(),
        private: z.object({
            personality: z.string(),
            motivation: z.string(),
            otherInfo: z.string().optional(),
        }).passthrough(),
        isUser: z.boolean().optional(),
    })).min(1).max(20).describe("The non-user characters in the roleplay exercise. THIS DOES NOT INCLUDE THE USER'S CHARACTER."),
    setting: z.object({
        emoji: z.string().optional().describe('An emoji to represent the setting of the roleplay exercise.'),
        name: z.string(),
        description: z.string(),
    }).passthrough().describe("The setting of the roleplay exercise."),
});
export type RoleplayActivityConfigv0_0_0 = z.infer<typeof RoleplayActivityConfigSchemav0_0_0>;


export const RoleplayActivityConfigSchema = RoleplayActivityConfigSchemav0_0_0;
export type RoleplayActivityConfig = z.infer<typeof RoleplayActivityConfigSchema>;


export const EphMessageWithCharacterInfoSchema = z.object({
    role: z.enum(['user', 'assistant', 'system', 'function']),
    content: z.string().nullable().optional(),
    character: z.object({
        name: z.string(),
        emoji: z.string().describe('A SINGLE emoji character that will be used to represent this character in the roleplay chat, this should be a standard emoji, not a custom one.'),
    }).optional().nullable(),
});

export const RoleplaySubmitRequestSchema = z.object({
    messages: z.array(EphMessageWithCharacterInfoSchema),
});
export type RoleplaySubmitRequest = z.infer<typeof RoleplaySubmitRequestSchema>;

export const RoleplaySubmitResultDetailsSchema = z.object({});
export type RoleplaySubmitResultDetails = z.infer<typeof RoleplaySubmitResultDetailsSchema>;

// Define the RoleplaySubmitResult schema and type
export const RoleplaySubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: RoleplaySubmitResultDetailsSchema,
});

// Define the type with required details property to match ActivitySubmitResult constraint
export type RoleplaySubmitResult = z.infer<typeof RoleplaySubmitResultSchema> & {
    details: RoleplaySubmitResultDetails;
};

export const RoleplayGradedResultSchema = ActivityResultGradedBaseSchema.extend({
    gradeType: z.literal('graded-numeric'),
    activityType: z.literal('roleplay').optional().default('roleplay'),
    resultData: z.object({
        conversation: z.array(EphMessageWithCharacterInfoSchema),
    }),
    activityConfig: RoleplayActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance."),
        aboveTheFoldAnswer: z.string().optional().nullable().describe("A 1 sentence answer to the question that is displayed above the fold."),
    }).optional().nullable(),
}).passthrough();

export const RoleplaySkippedResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('roleplay').optional().default('roleplay'),
    activityConfig: RoleplayActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const RoleplayResultSchema = z.union([
    RoleplayGradedResultSchema,
    RoleplaySkippedResultSchema
]);

export type RoleplayResult = z.infer<typeof RoleplayResultSchema>;