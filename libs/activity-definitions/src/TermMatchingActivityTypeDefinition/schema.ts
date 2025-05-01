import _ from "lodash";
import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

// Schema
import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const TermMatchingActivityConfigSchemav0_0_0 = ActivityConfigBaseSchema.extend({
    type: z.literal("term-matching"),
    version: z.literal("0.0.0").optional().default("0.0.0"),
    termPairs: z.array(z.object({
        term: z.string().describe("The term to be matched"),
        definition: z.string().describe("The definition of the term"),
    })).min(2).max(10).describe("An array of term-definition pairs"),
    instructions: z.string().optional().describe("Optional instructions for the activity"),
});
export const TermMatchingActivityConfigSchemav0_0_1 = TermMatchingActivityConfigSchemav0_0_0.extend({
    version: z.literal("0.0.1").optional().default("0.0.1"),
    hardMode: z.boolean().optional().default(false).describe("If true, the user will lose 10% of their total points for incorrect matches."),
});
export const TermMatchingActivityConfigGeneratorSchema = TermMatchingActivityConfigSchemav0_0_1;

export type TermMatchingActivityConfigv0_0_0 = z.infer<typeof TermMatchingActivityConfigSchemav0_0_0>;
export type TermMatchingActivityConfigv0_0_1 = z.infer<typeof TermMatchingActivityConfigSchemav0_0_1>;
export type TermMatchingActivityConfigGenerator = z.infer<typeof TermMatchingActivityConfigGeneratorSchema>;

export const TermMatchingActivityConfigSchema = z.union([TermMatchingActivityConfigSchemav0_0_0, TermMatchingActivityConfigSchemav0_0_1]);
export type TermMatchingActivityConfig = z.infer<typeof TermMatchingActivityConfigSchema>;

export const TermMatchingGradedActivityResultSchema = ActivityResultGradedBaseSchema.extend({
    gradeType: z.literal('graded-numeric'),
    activityType: z.literal('term-matching').optional().default('term-matching'),
    resultData: z.object({
        userMatches: z.array(z.object({
            term: z.string(),
            matchedDefinition: z.string(),
        })),
    }),
    activityConfig: TermMatchingActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance. THIS MUST BE ONLY ONE SENTENCE."),
        aboveTheFoldAnswer: z.string().optional().nullable().describe("A 1 sentence answer to the question that is displayed above the fold. THIS MUST BE ONLY ONE SENTENCE."),
    }).optional().nullable(),
}).passthrough();

export const TermMatchingSkippedActivityResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('term-matching').optional().default('term-matching'),
    resultData: z.object({
        userMatches: z.array(z.object({
            term: z.string(),
            matchedDefinition: z.string(),
        })).optional().default([]),
    }),
    activityConfig: TermMatchingActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const TermMatchingActivityResultSchema = z.union([
    TermMatchingGradedActivityResultSchema,
    TermMatchingSkippedActivityResultSchema
]);

export type TermMatchingResult = z.infer<typeof TermMatchingActivityResultSchema>;

// Define the TermMatchingSubmitRequest schema and type
export const TermMatchingSubmitRequestSchema = z.object({
    userMatches: z.array(z.object({
        term: z.string(),
        matchedDefinition: z.string(),
    })),
    mistakeCount: z.number().optional(),
});
export type TermMatchingSubmitRequest = z.infer<typeof TermMatchingSubmitRequestSchema>;

// Define the TermMatchingSubmitResultDetails schema and type
export const TermMatchingSubmitResultDetailsSchema = z.object({
    grade0To100: z.number(),
    shortExplanation: z.string(),
    explanation: z.string(),
});
export type TermMatchingSubmitResultDetails = z.infer<typeof TermMatchingSubmitResultDetailsSchema>;

// Define the TermMatchingSubmitResult schema and type
export const TermMatchingSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: TermMatchingSubmitResultDetailsSchema,
});
export type TermMatchingSubmitResult = z.infer<typeof TermMatchingSubmitResultSchema> & {
    details: TermMatchingSubmitResultDetails;
};
