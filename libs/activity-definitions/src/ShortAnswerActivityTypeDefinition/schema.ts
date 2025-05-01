import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const ShortAnswerActivityConfigSchemav0_0_0 = ActivityConfigBaseSchema.extend({
    type: z.literal("short-answer").optional().default("short-answer"),
    version: z.literal("0.0.0").optional().default("0.0.0"),
    questionText: z.string()
        .describe("The text of the question."),
    gradingCriteria: z.string()
        .describe("(TEACHER-ONLY) The criteria that will be used to grade the user's performance on this question, including expected answers."),
});
export type ShortAnswerActivityConfigv0_0_0 = z.infer<typeof ShortAnswerActivityConfigSchemav0_0_0>;

export const ShortAnswerActivityConfigSchema = ShortAnswerActivityConfigSchemav0_0_0;
export type ShortAnswerActivityConfig = z.infer<typeof ShortAnswerActivityConfigSchema>;

// Submit request schema
export const ShortAnswerSubmitRequestSchema = z.object({
    userAnswer: z.string().describe("The user's answer to the short answer question"),
});
export type ShortAnswerSubmitRequest = z.infer<typeof ShortAnswerSubmitRequestSchema>;

// Submit result details schema
export const ShortAnswerSubmitResultDetailsSchema = z.object({
    shortExplanation: z.string().describe("A short explanation of the grade"),
    explanation: z.string().describe("A detailed explanation of the grade"),
});
export type ShortAnswerSubmitResultDetails = z.infer<typeof ShortAnswerSubmitResultDetailsSchema>;

// Submit result schema
export const ShortAnswerSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: ShortAnswerSubmitResultDetailsSchema,
});
export type ShortAnswerSubmitResult = z.infer<typeof ShortAnswerSubmitResultSchema> & {
    details: ShortAnswerSubmitResultDetails;
};

export const ShortAnswerGradedActivityResultSchema = ActivityResultGradedBaseSchema.extend({
    gradeType: z.literal('graded-numeric'),
    activityType: z.literal('short-answer').optional().default('short-answer'),
    resultData: z.object({
        userAnswer: z.string().optional().nullable(),
    }),
    activityConfig: ShortAnswerActivityConfigSchema,
    submitResult: ShortAnswerSubmitResultSchema,
}).passthrough();

export const ShortAnswerSkippedActivityResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('short-answer').optional().default('short-answer'),
    activityConfig: ShortAnswerActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const ShortAnswerActivityResultSchema = z.union([
    ShortAnswerGradedActivityResultSchema,
    ShortAnswerSkippedActivityResultSchema
]);

export type ShortAnswerResult = z.infer<typeof ShortAnswerActivityResultSchema>;