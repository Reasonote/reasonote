import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GetSimilarSkillsRouteRequestSchema = z.object({
  skill: z.union([
    z.object({
      type: z.literal('skill'),
      id: z.string(),
    }),
    z.object({
      type: z.literal('stub'),
      name: z.string(),
      description: z.string().optional(),
      nameEmbedding: z.any().nullish(),
      descriptionEmbedding: z.any().nullish(),
    })
  ]).describe('The skill to get similar skills for.'),
  combinedMatchThreshold: z.number().optional().default(.9).describe('The minimum similarity between the skill name and the similar skill name, and the skill description and the similar skill description.'),
  nameMatchThreshold: z.number().optional().default(.9).describe("The minimum similarity between the skill name and the similar skill name."),
  descriptionMatchThreshold: z.number().optional().default(.8).describe('The minimum similarity between the skill description and the similar skill description. NOTE: if description is absent, this is discounted.'),
  matchCount: z.number().optional().default(10).describe('The number of similar skills to return.'),
  nameMinContentLength: z.number().optional().default(2).describe('The minimum length of the skill name to consider it for similarity.'),
  descriptionMinContentLength: z.number().optional().default(8).describe('The minimum length of the skill description to consider it for similarity.'),
  extraFilters: z.any().optional().describe('Extra filters to apply to the similar skills query.'),
});

export type GetSimilarSkillsRouteRequestIn = z.input<
  typeof GetSimilarSkillsRouteRequestSchema
>

export type GetSimilarSkillsRouteRequest = z.infer<
  typeof GetSimilarSkillsRouteRequestSchema
>

export const GetSimilarSkillsRouteResponseSchema = z.object({
  similarSkills: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    nameSimilarity: z.number().optional(),
    descriptionSimilarity: z.number().optional(),
    combinedSimilarity: z.number().optional(),
  })),
});

export const GetSimilarSkillsRoute = new ApiRoute({
    path: "/api/skills/get_similar_skills",
    method: "post",
    requestSchema: GetSimilarSkillsRouteRequestSchema,
    responseSchema: GetSimilarSkillsRouteResponseSchema,
});