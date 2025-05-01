import { z } from "zod";

import {
    ActivityResultGradedBaseSchema,
    ActivityResultSkippedBaseSchema,
    ActivitySubmitResultSchema,
} from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

const formatMarkdownGuidance = "Format this in markdown. (NOTE: for LaTeX, you MUST wrap in \"$$...$$\" delimiters and use double backslashes \"\\\\\")";



// Define the MultipleChoiceSubmitRequest schema and type
export const MultipleChoiceSubmitRequestSchema = z.object({
    userAnswer: z.string(),
});
export type MultipleChoiceSubmitRequest = z.infer<typeof MultipleChoiceSubmitRequestSchema>;

// Define the MultipleChoiceSubmitResultDetails schema and type
export const MultipleChoiceSubmitResultDetailsSchema = z.object({
    isCorrect: z.boolean(),
    followUp: z.string().optional(),
});
export type MultipleChoiceSubmitResultDetails = z.infer<typeof MultipleChoiceSubmitResultDetailsSchema>;

// Define the MultipleChoiceSubmitResult schema and type
export const MultipleChoiceSubmitResultSchema = ActivitySubmitResultSchema.extend({
    details: MultipleChoiceSubmitResultDetailsSchema,
});
export type MultipleChoiceSubmitResult = z.infer<typeof MultipleChoiceSubmitResultSchema> & {
    details: MultipleChoiceSubmitResultDetails;
};

export const MultipleChoiceActivityConfigSchemav0_0_0 = ActivityConfigBaseSchema.extend({
    type: z.literal("multiple-choice").optional().default("multiple-choice"),
    version: z.literal("0.0.0").optional().default("0.0.0"),
    question: z.string().describe(`The question to ask the user. ${formatMarkdownGuidance}`),
    answerChoices: z
        .array(z.string())
        .describe(`The answer choices to give the user. ${formatMarkdownGuidance}`),
    correctAnswer: z
        .string()
        .describe(`The correct answer to the question. ${formatMarkdownGuidance}`),
    answerChoiceFollowUps: z.array(z.object({
        answerChoice: z.string(),
        followUp: z.string(),
    })).describe(`This message will be shown to the user if they select the corresponding answer choice. It should be one sentence, maximum. For example, for a right answer, this may be a 'fun fact', for a wrong answer, this should be a tip to help the user do better next time. ${formatMarkdownGuidance}`),
});
export type MultipleChoiceActivityConfigv0_0_0 = z.infer<typeof MultipleChoiceActivityConfigSchemav0_0_0>;


export const MultipleChoiceActivityConfigSchemav0_0_1 = z.object({
    type: z.literal("multiple-choice").optional().default("multiple-choice"),
    version: z.literal("0.0.1").optional().default("0.0.1"),
    question: z.string().describe(`The question to ask the user. ${formatMarkdownGuidance}`),
    answerChoices: z
        .array(z.string())
        .describe(`The answer choices to give the user. ${formatMarkdownGuidance}`),
    correctAnswer: z
        .string()
        .describe(`The correct answer to the question. ${formatMarkdownGuidance}`),
    answerChoiceFollowUps: z.array(z.object({
        answerChoice: z.string(),
        followUp: z.string(),
    })).optional().describe("This message will be shown to the user if they select the corresponding answer choice. It should be one sentence, maximum. For example, for a right answer, this may be a 'fun fact', for a wrong answer, this should be a tip to help the user do better next time."),
});
export type MultipleChoiceActivityConfigv0_0_1 = z.infer<typeof MultipleChoiceActivityConfigSchemav0_0_1>;


export const MultipleChoiceActivityConfigSchemav1_0_0 = z.object({
    type: z.literal("multiple-choice").optional().default("multiple-choice"),
    version: z.literal("1.0.0").optional().default("1.0.0"),
    question: z.string().describe(`The question to ask the user. ${formatMarkdownGuidance}`),
    answerChoices: z
        .array(z.object({
            text: z.string().describe(`The text of the answer choice. ${formatMarkdownGuidance}`),
            isCorrect: z.boolean().describe(`Whether this is the correct answer.`),
            followUp: z.string().optional().describe(`This message will be shown to the user if they select the corresponding answer choice. It should be one sentence, maximum. For example, for a right answer, this may be a 'fun fact', for a wrong answer, this should be a tip to help the user do better next time. ${formatMarkdownGuidance}`),
        }))
        .describe(`The unique answer choices to give the user. ${formatMarkdownGuidance}`),
});
export type MultipleChoiceActivityConfigv1_0_0 = z.infer<typeof MultipleChoiceActivityConfigSchemav1_0_0>;


export const MultipleChoiceActivityConfigSchema = z.union([
    MultipleChoiceActivityConfigSchemav0_0_0, 
    MultipleChoiceActivityConfigSchemav0_0_1,
    MultipleChoiceActivityConfigSchemav1_0_0,
]);
export type MultipleChoiceActivityConfig = z.infer<typeof MultipleChoiceActivityConfigSchema>;


export const MultipleChoiceGradedResultSchema = ActivityResultGradedBaseSchema.extend({
    gradeType: z.literal('graded-pass-fail').optional().default('graded-pass-fail'),
    activityType: z.literal('multiple-choice').optional().default('multiple-choice'),
    resultData: z.object({
        userAnswer: z.string(),
    }),
    activityConfig: MultipleChoiceActivityConfigSchema,
    submitResult: MultipleChoiceSubmitResultSchema,
}).passthrough();

export const MultipleChoiceSkippedResultSchema = ActivityResultSkippedBaseSchema.extend({
    activityType: z.literal('multiple-choice').optional().default('multiple-choice'),
    activityConfig: MultipleChoiceActivityConfigSchema,
}).passthrough();

// Create a union type that accepts both graded and skipped results
export const MultipleChoiceResultSchema = z.union([
    MultipleChoiceGradedResultSchema,
    MultipleChoiceSkippedResultSchema
]);

export type MultipleChoiceResultGraded = z.infer<typeof MultipleChoiceGradedResultSchema>;
export type MultipleChoiceResultSkipped = z.infer<typeof MultipleChoiceSkippedResultSchema>;

export type MultipleChoiceResultIn = z.input<typeof MultipleChoiceResultSchema>;
export type MultipleChoiceResult = z.infer<typeof MultipleChoiceResultSchema>;
