import { z } from "zod";
import { ApiRoute } from "@reasonote/lib-api-sdk";

export const updateDailyCelebrationTimeRoute = new ApiRoute({
    path: "/api/user/update-daily-celebration-time",
    method: "post",
    requestSchema: z.object({
        dailyXpGoalCelebrationTime: z.string()
    }),
    responseSchema: z.object({
        success: z.boolean()
    })
}); 