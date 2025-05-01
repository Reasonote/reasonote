import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const FillSubskillTreeRouteRequestSchema = z.object({
  skill: z.object({
      id: z.string(),
      parentSkillIds: z.array(z.string()).optional().nullable().describe("The parent skill IDs of the skill. If null, the skill is the root skill."),
      rootSkillId: z.string().optional().nullable().describe("The root skill ID of the skill. If null, the skill is the root skill."),
  }),
  maxDepth: z.number().max(3).optional().default(2).describe("The maximum depth to fill the tree to. If null, the tree will be filled to the maximum depth possible."),
  maxSubskillsPerSkill: z.number().max(6).optional().default(6).describe("The maximum number of subskills to generate per each skill. If null, the tree will be filled to the maximum depth possible."),
  skillsToAdd: z.array(z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
  })).optional().nullable().describe("A list of skills to add to the tree. The tree will be filled with other skills too, but these should be added with priority."),
  lessonId: z.string().optional().nullable(),
  sourceActivities: z.array(z.string()).optional().nullable().describe("Activities which will be used to determine the subskills of the skill. Commonly these are anki cards being imported."),
  relevantDocuments: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })).optional().nullable().describe("Documents which will be used to determine the subskills of the skill. Commonly these are course materials being imported."),
  extraContext: z.array(z.object({
    title: z.string(),
    description: z.string().optional().nullable(),
    body: z.string().optional().nullable(),
  })).optional().nullable().describe("Additional context which will be used to determine the subskills of the skill. Commonly these are course requirements being imported."),
});

export type FillSubskillTreeRouteRequestIn = z.input<
  typeof FillSubskillTreeRouteRequestSchema
>

export type FillSubskillTreeRouteRequest = z.infer<
  typeof FillSubskillTreeRouteRequestSchema
>

export const FillSubskillTreeRouteResponseSchema = z.object({
  newSkillIds: z.array(z.string()),
  treeWithIds: z.any(),
});

export type FillSubskillTreeRouteResponse = z.infer<
  typeof FillSubskillTreeRouteResponseSchema
>

export const FillSubskillTreeRoute = new ApiRoute({
    path: "/api/skills/fill_subskill_tree",
    method: "post",
    requestSchema: FillSubskillTreeRouteRequestSchema,
    responseSchema: FillSubskillTreeRouteResponseSchema,
});