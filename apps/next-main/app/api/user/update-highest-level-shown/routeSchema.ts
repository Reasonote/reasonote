import { z } from "zod";
import { ApiRoute } from "@reasonote/lib-api-sdk";

export const updateHighestLevelShownRoute = new ApiRoute({
    path: "/api/user/update-highest-level-shown",
    method: "post",
    requestSchema: z.object({
        level: z.number(),
        skillId: z.string()
    }),
    responseSchema: z.object({
        success: z.boolean()
    })
}); 