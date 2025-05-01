import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GenerateRootDAGRoute = new ApiRoute({
    path: "/api/skills/generate_root_dag",
    method: "post",
    requestSchema: z.object({
        rootSkillId: z.string().describe("The root skill ID to analyze"),
        threshold: z.number().optional().describe("The threshold for the chunks"),
    }),
    responseSchema: z.object({
        lessonSkillIds: z.array(z.string()),
    }),
}); 