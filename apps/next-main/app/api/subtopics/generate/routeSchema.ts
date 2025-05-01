import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GenerateSubtopicsRequestSchema = z.object({
    skillId: z.string(),
    numTopics: z.number().optional(),
    customPrompt: z.string().optional(),
    existingTopics: z.array(z.object({
        name: z.string(),
        description: z.string(),
        emoji: z.string()
    })).optional(),
    includeExpertQuestions: z.boolean().optional()
});

export const GenerateSubtopicsResponseSchema = z.object({
    topic: z.object({
        name: z.string(),
        description: z.string(),
        emoji: z.string(),
        expertQuestions: z.array(z.object({
            question: z.string(),
            answer: z.string()
        }))
    })
});

export const GenerateSubtopicsRoute = new ApiRoute({
    path: "/api/subtopics/generate",
    method: "post",
    requestSchema: GenerateSubtopicsRequestSchema,
    responseSchema: GenerateSubtopicsResponseSchema
}); 