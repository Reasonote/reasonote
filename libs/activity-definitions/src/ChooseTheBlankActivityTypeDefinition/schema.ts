import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
    CitationSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const ChooseTheBlankActivityConfigSchema = ActivityConfigBaseSchema.extend({
    type: z.literal("choose-the-blank").optional().default("choose-the-blank"),
    version: z.literal("0.0.0").optional().default("0.0.0"),
    text: z.string()
        .describe("The text of the question. ALL HIDDEN WORDS OR PHRASES SHOULD BE INCLUDED VERBATIM. YOU SHOULD NOT BLANK OUT THE ANSWER."),
    hiddenWords: z.array(z.string())
        .describe("The words to blank out of the question"),
    wordChoices: z.array(z.string())
        .describe("The list of words that users can choose from to fill in the blanks"),
    citations: z.array(CitationSchema).optional().nullable().describe('If document references are provided, all activities should pull their content from the provided documents, and provide citations to the documents.')
})
export type ChooseTheBlankActivityConfig = z.infer<typeof ChooseTheBlankActivityConfigSchema>;


export const ChooseTheBlankSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: z.object({
        explanation: z.string(),
        gradePerBlank: z.array(z.object({
            hiddenWord: z.string(),
            userAnswer: z.string(),
            grade0To100: z.number(),
        })),
    }),
});
export type ChooseTheBlankSubmitResult = z.infer<typeof ChooseTheBlankSubmitResultSchema>;


export const ChooseTheBlankGradedActivityResultSchema = ActivityResultGradedBaseSchema.extend({
    activityType: z.literal('choose-the-blank').optional().default('choose-the-blank'),
    resultData: z.object({
        selectedAnswers: z.array(z.string().nullable()),
    }),
    activityConfig: ChooseTheBlankActivityConfigSchema,
    feedback: z.object({
        markdownFeedback: z.string().optional().nullable().describe("A 1 sentence feedback on the user's performance."),
        aboveTheFoldAnswer: z.string().optional().nullable().describe("A 1 sentence answer to the question that is displayed above the fold."),
    }).optional().nullable(),
    submitResult: ChooseTheBlankSubmitResultSchema.optional().nullable(),
}).passthrough();

export const ChooseTheBlankSkippedActivityResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('choose-the-blank').optional().default('choose-the-blank'),
    resultData: z.object({
        selectedAnswers: z.array(z.string().nullable()).optional().default([]),
    }),
    activityConfig: ChooseTheBlankActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const ChooseTheBlankActivityResultSchema = z.union([
    ChooseTheBlankGradedActivityResultSchema,
    ChooseTheBlankSkippedActivityResultSchema
]);

export type ChooseTheBlankResult = z.infer<typeof ChooseTheBlankActivityResultSchema>;
