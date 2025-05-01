import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SkillsAddToSkillTreeRouteRequestSchema = z.object({
  skill: z.object({
      id: z.string(),
      name: z.string().optional().nullable(),
      parentSkillIds: z.array(z.string()).optional().nullable(),
  }),
  skillsToAdd: z.array(z.object({
    id: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    description: z.string().optional().nullable().optional().nullable(),
  })).optional().nullable().describe("A list of skills to add to the tree."),
  lessonId: z.string().optional().nullable(),
});

export type SkillsAddToSkillTreeRouteRequestIn = z.input<
  typeof SkillsAddToSkillTreeRouteRequestSchema
>

export type SkillsAddToSkillTreeRouteRequest = z.infer<
  typeof SkillsAddToSkillTreeRouteRequestSchema
>

export const SkillsAddToSkillTreeRouteResponseSchema = z.object({
  skillsAdded: z.object({
    id: z.string().optional().describe('The ID of the skill that was created'),
    name: z.string().describe('The name of the skill that was created'),
    link: z.string().optional().describe('The skill_link that was created'),
  }).array()
});

export type SkillsAddToSkillTreeRouteResponse = z.infer<
  typeof SkillsAddToSkillTreeRouteResponseSchema
>

export const SkillsAddToSkillTreeRoute = new ApiRoute({
    path: "/api/skills/add_to_skill_tree",
    method: "post",
    requestSchema: SkillsAddToSkillTreeRouteRequestSchema,
    responseSchema: SkillsAddToSkillTreeRouteResponseSchema,
});