import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GetSubskillsDirectRouteRequestSchema = z.object({
  skill: z.object({
      id: z.string(),
      parentSkillIds: z.array(z.string()).optional().nullable(),
  }),
});

export type GetSubskillsDirectRouteRequestIn = z.input<
  typeof GetSubskillsDirectRouteRequestSchema
>

export type GetSubskillsDirectRouteRequest = z.infer<
  typeof GetSubskillsDirectRouteRequestSchema
>

// {
//   skill_id: string
//   skill_name: string
//   path_to: string[]
//   path_to_links: string[]
//   min_normalized_score_upstream: number
//   max_normalized_score_upstream: number
//   average_normalized_score_upstream: number
//   stddev_normalized_score_upstream: number
//   activity_result_count_upstream: number
//   all_scores: number[]
//   num_upstream_skills: number
//   level_on_parent: string
//   level_path: string[]
// }

export const GetSubskillsDirectRouteResponseSchema = z.array(z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  path_to: z.array(z.string()),
  path_to_links: z.array(z.string()),
  min_normalized_score_upstream: z.number().nullable().optional(),
  max_normalized_score_upstream: z.number().nullable().optional(),
  average_normalized_score_upstream: z.number().nullable().optional(),
  stddev_normalized_score_upstream: z.number().nullable().optional(),
  activity_result_count_upstream: z.number().nullable().optional(),
  all_scores: z.array(z.number()).nullable().optional(),
  num_upstream_skills: z.number().nullable().optional(),
  level_on_parent: z.string().nullable().optional(),
  level_path: z.array(z.string()),
}));

export const GetSubskillsDirectRoute = new ApiRoute({
    path: "/api/skills/get_subskills_direct",
    method: "post",
    requestSchema: GetSubskillsDirectRouteRequestSchema,
    responseSchema: GetSubskillsDirectRouteResponseSchema,
});