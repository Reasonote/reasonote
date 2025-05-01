import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const updatePracticeScoreRoute = new ApiRoute({
    path: "/api/user/update-practice-score",
    method: "post",
    requestSchema: z.object({
        skillId: z.string(),
        practiceScore: z.number().min(0).max(100),
    }),
    responseSchema: z.object({
        success: z.boolean()
    })
}); 