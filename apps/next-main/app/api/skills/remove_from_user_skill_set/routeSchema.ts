import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RemoveFromUserSkillSetRouteRequestSchema = z.object({
    removeSkillIds: z.array(z.string()).optional().nullable(),
});
export type RemoveFromUserSkillSetRouteRequestIn = z.input<
  typeof RemoveFromUserSkillSetRouteRequestSchema
>

export type RemoveFromUserSkillSetRouteRequest = z.infer<
  typeof RemoveFromUserSkillSetRouteRequestSchema
>


export const RemoveFromUserSkillSetRouteResponseSchema = z.object({
  skillSetId: z.string(),
});

export const RemoveFromUserSkillSetRoute = new ApiRoute({
    path: "/api/skills/remove_from_user_skill_set",
    method: "post",
    requestSchema: RemoveFromUserSkillSetRouteRequestSchema,
    responseSchema: RemoveFromUserSkillSetRouteResponseSchema,
});