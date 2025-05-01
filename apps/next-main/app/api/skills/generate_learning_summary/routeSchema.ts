import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GenerateLearningSummaryRoute = new ApiRoute({
    path: "/api/skills/generate_learning_summary",
    method: "post",
    requestSchema: z.object({
        documentId: z.string().describe("The document ID to analyze"),
    }),
    responseSchema: z.object({
        rootSkillId: z.string().describe("The ID of the root skill created"),
        skillName: z.string().describe("The name of the root skill created"),
        emoji: z.string().describe("The emoji of the root skill created"),
        summary: z.string().describe("The summary of the root skill created"),
        learningObjectives: z.array(z.string()).describe("The learning objectives of the root skill created"),
    }),
}); 