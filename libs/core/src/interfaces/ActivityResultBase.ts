import { z } from "zod";

import { ActivityConfigSchema } from "./ActivityConfig";

export const ActivityResultGradedBaseSchema = z.object({
    type: z.literal('graded').optional().default('graded'),
    gradeType: z.union([z.literal('graded-pass-fail'), z.literal('graded-numeric')]).optional().default('graded-numeric'),
    activityType: z.string(),
    grade0to100: z.number().gte(0).lte(100),
    resultData: z.object({}).passthrough(),
    activityConfig: ActivityConfigSchema.passthrough(), 
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable(),
        aboveTheFoldAnswer: z.string().optional().nullable(),
    }).optional().nullable(),
    submitResult: z.any().optional().nullable().describe("The result of the submission, usually including the grading details."),
}).passthrough();
export type ActivityResultGradedBase = z.infer<typeof ActivityResultGradedBaseSchema>;

export const ActivityResultUngradedBaseSchema = z.object({
    type: z.literal('ungraded').optional().default('ungraded'),
    activityType: z.string(),
    resultData: z.object({}).passthrough(),
    activityConfig: ActivityConfigSchema.passthrough(),
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable(),
        aboveTheFoldAnswer: z.string().optional().nullable(),
    }).optional().nullable(),
    submitResult: z.any().optional().nullable(),
}).passthrough();
export type ActivityResultUngradedBase = z.infer<typeof ActivityResultUngradedBaseSchema>;

export const ActivityResultSkippedBaseSchema = z.object({
    type: z.literal('skipped').optional().default('skipped'),
    activityType: z.string(),
    resultData: z.object({}).passthrough(),
    activityConfig: ActivityConfigSchema.passthrough(),
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable(),
        aboveTheFoldAnswer: z.string().optional().nullable(),
    }).optional().nullable(),
    skipReason: z.string().optional().nullable(),
}).passthrough();
export type ActivityResultSkippedBase = z.infer<typeof ActivityResultSkippedBaseSchema>;


export const ActivityResultBaseSchema = z.union([ActivityResultGradedBaseSchema, ActivityResultUngradedBaseSchema, ActivityResultSkippedBaseSchema]);
export type ActivityResultBase = z.infer<typeof ActivityResultBaseSchema>;