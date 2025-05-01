import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const AddtoUserSkillSetRouteRequestSchema = z.object({
    addIds: z.array(z.string()).optional().nullable(),
    addSkills: z.array(z.object({
      name: z.string(),
      emoji: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
    })).optional().nullable(),
    addSkillResources: z.array(z.object({
      pageId: z.string().optional().nullable(),
      snipId: z.string().optional().nullable(),
    })).optional().nullable()
});
export type AddtoUserSkillSetRouteRequestIn = z.input<
  typeof AddtoUserSkillSetRouteRequestSchema
>

export type AddtoUserSkillSetRouteRequest = z.infer<
  typeof AddtoUserSkillSetRouteRequestSchema
>


export const AddtoUserSkillSetRouteResponseSchema = z.object({
  skillSetId: z.string(),
  skillSetSkillIds: z.array(z.string()),
  skillIds: z.array(z.string()),
  skillResourceIds: z.array(z.string()).optional().nullable(),
});

export const AddtoUserSkillSetRoute = new ApiRoute({
    path: "/api/skills/add_to_user_skill_set",
    method: "post",
    requestSchema: AddtoUserSkillSetRouteRequestSchema,
    responseSchema: AddtoUserSkillSetRouteResponseSchema,
});