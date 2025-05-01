import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const FillInTheBlankActivityConfigSchemav0_0_0 = ActivityConfigBaseSchema.extend({
    type: z.literal("fill-in-the-blank").optional().default("fill-in-the-blank"),
    version: z.literal("0.0.0").optional().default("0.0.0"),
    text: z.string()
        .describe("The text of the question. DO NOT blank out the answer -- we will do that for you."),
    hiddenWords: z.array(z.string())
        .describe("The words to blank out of the question"),
});
export type FillInTheBlankActivityConfigv0_0_0 = z.infer<typeof FillInTheBlankActivityConfigSchemav0_0_0>;

export const FillInTheBlankActivityConfigSchemav0_0_1 = z.object({
    type: z.literal("fill-in-the-blank").optional().default("fill-in-the-blank"),
    version: z.literal("0.0.1").optional().default("0.0.1"),
    text: z.string()
        .describe("The text of the question. ALL HIDDEN WORDS OR PHRASES SHOULD BE INCLUDED VERBATIM. YOU SHOULD NOT BLANK OUT THE ANSWER."),
});
export type FillInTheBlankActivityConfigv0_0_1 = z.infer<typeof FillInTheBlankActivityConfigSchemav0_0_1>;


export const FillInTheBlankActivityConfigSchema = z.union([FillInTheBlankActivityConfigSchemav0_0_0, FillInTheBlankActivityConfigSchemav0_0_1]);
export type FillInTheBlankActivityConfig = z.infer<typeof FillInTheBlankActivityConfigSchema>;


export const FillInTheBlankSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: z.object({
        explanation: z.string(),
        gradePerWord: z.array(z.object({
            hiddenWord: z.string(),
            userAnswer: z.string(),
            grade0To100: z.number(),
        })),
    }),
});
export type FillInTheBlankSubmitResult = z.infer<typeof FillInTheBlankSubmitResultSchema>;


export const FillInTheBlankGradedActivityResultSchema = ActivityResultGradedBaseSchema.extend({
    activityType: z.literal('fill-in-the-blank').optional().default('fill-in-the-blank'),
    resultData: z.object({
        userAnswers: z.array(z.string()),
    }),
    submitResult: FillInTheBlankSubmitResultSchema.optional().nullable(),
    activityConfig: FillInTheBlankActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance."),
        aboveTheFoldAnswer: z.string().optional().nullable().describe("A 1 sentence answer to the question that is displayed above the fold."),
    }).optional().nullable(),
}).passthrough();

export const FillInTheBlankSkippedActivityResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('fill-in-the-blank').optional().default('fill-in-the-blank'),
    resultData: z.object({
        userAnswers: z.array(z.string()).optional().default([]),
    }),
    activityConfig: FillInTheBlankActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const FillInTheBlankActivityResultSchema = z.union([
    FillInTheBlankGradedActivityResultSchema,
    FillInTheBlankSkippedActivityResultSchema
]);

export type FillInTheBlankResultGraded = z.infer<typeof FillInTheBlankGradedActivityResultSchema>;
export type FillInTheBlankResultSkipped = z.infer<typeof FillInTheBlankSkippedActivityResultSchema>;
export type FillInTheBlankResult = z.infer<typeof FillInTheBlankActivityResultSchema>;