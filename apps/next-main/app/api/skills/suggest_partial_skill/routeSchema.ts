import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SuggestPartialSkillRoute = new ApiRoute({
    path: "/api/skills/suggest_partial_skill",
    method: "post",
    requestSchema: z.object({
        userInput: z.string().optional(),
        documents: z.array(z.object({ 
            resourceId: z.string().optional().describe("The ID of the resource to use for the partial skill. This can be a rsn_page ID or a snip ID."),
        })).optional(),
    }).refine(data => data.userInput || data.documents?.length, {
        message: "Either userInput or documents must be provided"
    }),
    responseSchema: z.object({
        partialSkillId: z.string(),
        skillId: z.string(),
    }),
}); 