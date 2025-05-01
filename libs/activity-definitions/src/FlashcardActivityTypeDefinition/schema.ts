import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";
import { AI_EXPLAINERS } from "@reasonote/core-static-prompts";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const FlashcardActivityConfigSchema = ActivityConfigBaseSchema.extend({
    type: z.literal('flashcard').optional().default('flashcard'),
    version: z.literal('0.0.0').optional().default('0.0.0'),
    flashcardFront: z.string()
        .describe(`The front of the flashcard (the prompt/question). ${AI_EXPLAINERS.PARAMETER_FORMAT_MARKDOWN_LATEX.content}`),
    flashcardBack: z.string()
        .describe(`The back of the flashcard (the answer). ${AI_EXPLAINERS.PARAMETER_FORMAT_MARKDOWN_LATEX.content}`),
    metadata: z
        .optional(
            z.object({
                subSkills: z
                    .optional(z.array(z.string()))
                    .describe("What subskill areas does this flashcard cover? Break the skills of this flashcard down into several subskills. Title each skill like you would a Wikipedia article."),
                challengeSubSkills: z
                    .optional(z.array(z.string()))
                    .describe("If this flashcard goes well, what 2-3 skills would challenge the user even more? Out of the subskills above, which ones are the most challenging? Title each skill like you would a Wikipedia article."),
                improveSubSkills: z
                    .optional(z.array(z.string()))
                    .describe("If this flashcard goes poorly, what 2-3 skills would help the user understand it better? Out of the subskills above, which ones are the most important to understand? Title each skill like you would a Wikipedia article."),
            })) 
});
export type FlashcardActivityConfig = z.infer<typeof FlashcardActivityConfigSchema>;

// Submit request schema
export const FlashcardSubmitRequestSchema = z.object({
    attestedLevel: z.enum(['BAD', 'OK', 'GREAT']).describe("The user's self-assessment of their knowledge of the flashcard content"),
});
export type FlashcardSubmitRequest = z.infer<typeof FlashcardSubmitRequestSchema>;

// Submit result details schema
export const FlashcardSubmitResultDetailsSchema = z.object({
    subskills: z.object({
        improveSubSkills: z.array(z.string()).optional(),
        challengeSubSkills: z.array(z.string()).optional(),
    }).optional(),
});
export type FlashcardSubmitResultDetails = z.infer<typeof FlashcardSubmitResultDetailsSchema>;

// Submit result schema
export const FlashcardSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: FlashcardSubmitResultDetailsSchema,
});
export type FlashcardSubmitResult = z.infer<typeof FlashcardSubmitResultSchema> & {
    details: FlashcardSubmitResultDetails;
};

export const FlashcardGradedResultSchema = ActivityResultGradedBaseSchema.extend({
    gradeType: z.literal('graded-numeric').optional().default('graded-numeric'),
    activityType: z.literal('flashcard').optional().default('flashcard'),
    resultData: z.object({
        attestedLevel: z.enum(['BAD', 'OK', 'GREAT']),
    }),
    activityConfig: FlashcardActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance."),
        subskills: z.object({
            improveSubSkills: z.array(z.string()).optional(),
            challengeSubSkills: z.array(z.string()).optional(),
        }).optional()
    }).optional().nullable(),
}).passthrough();

export const FlashcardSkippedResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('flashcard').optional().default('flashcard'),
    activityConfig: FlashcardActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const FlashcardResultSchema = z.union([
    FlashcardGradedResultSchema,
    FlashcardSkippedResultSchema
]);

export type FlashcardResult = z.infer<typeof FlashcardResultSchema>;