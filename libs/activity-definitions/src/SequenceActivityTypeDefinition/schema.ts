import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

const formatMarkdownGuidance = "Format this in markdown. (NOTE: for LaTeX, you MUST wrap in \"$$...$$\" delimiters and use double backslashes \"\\\\\")";

// Add the new v0.0.2 schema with requested changes
export const SequenceActivityConfigSchemav0_0_1 = ActivityConfigBaseSchema.extend({
    type: z.literal("sequence").optional().default("sequence"),
    version: z.literal("0.0.1").optional().default("0.0.1"),
    prompt: z.string().describe(`The instruction for the sequencing task. ${formatMarkdownGuidance}`),
    items: z.array(z.object({
        id: z.string(),
        label: z.string().describe(formatMarkdownGuidance),
        hiddenPositionLabel: z.string().optional().describe("Item-specific information that will only be revealed after grading"),
    })).describe("The items to be sequenced, including their labels and optional hidden information -- Min 4, Max 6"),
    positionLabels: z.array(z.string()).optional().describe("Custom labels to display instead of default position numbering (1, 2, 3...)"),
    aiScoringEnabled: z.boolean().default(true).describe("Enable AI-driven partial credit scoring"),
});

export type SequenceActivityConfigv0_0_1 = z.infer<typeof SequenceActivityConfigSchemav0_0_1>;

// Update to support both schema versions
export const SequenceActivityConfigSchema = SequenceActivityConfigSchemav0_0_1;
export type SequenceActivityConfig = z.infer<typeof SequenceActivityConfigSchema>;


// Submit request schema
export const SequenceSubmitRequestSchema = z.object({
    userSequence: z.array(z.string()).describe("The user's sequence of item IDs"),
});
export type SequenceSubmitRequest = z.infer<typeof SequenceSubmitRequestSchema>;

// Submit result details schema
export const SequenceSubmitResultDetailsSchema = z.object({
    correctPositions: z.array(z.number()).describe("Indices of items that are in the correct position"),
    incorrectPositions: z.array(z.number()).describe("Indices of items that are in the incorrect position"),
});
export type SequenceSubmitResultDetails = z.infer<typeof SequenceSubmitResultDetailsSchema>;

// Submit result schema
export const SequenceSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: SequenceSubmitResultDetailsSchema,
});
export type SequenceSubmitResult = z.infer<typeof SequenceSubmitResultSchema> & {
    details: SequenceSubmitResultDetails;
};


export const SequenceResultSchema = ActivityResultGradedBaseSchema.extend({
    type: z.literal('graded').optional().default('graded'),
    gradeType: z.union([
        z.literal("graded-pass-fail"),
        z.literal("graded-numeric"),
    ]),
    activityType: z.literal('sequence').optional().default('sequence'),
    grade0to100: z.number().gte(0).lte(100),
    resultData: z.object({
        userSequence: z.array(z.string()),
    }),
    activityConfig: SequenceActivityConfigSchema,
    submitResult: SequenceSubmitResultSchema,
}).passthrough();

export type SequenceResultIn = z.input<typeof SequenceResultSchema>;
export type SequenceResult = z.infer<typeof SequenceResultSchema>;
