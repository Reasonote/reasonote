import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GetValidSubskillsV1RouteRequestSchema = z.object({
  skill: z.object({
      id: z.string(),
  }),
  parentSkillIds: z.array(z.string()).optional().nullable(),
  activitiesAlreadyQueued: z.array(z.object({
    activity: z.object({
      id: z.string().describe('The id of the activity.')
    }),
    skillIdStack: z.array(z.string()).optional().nullable().describe('The skill stack of the activity.'),
  })).optional().nullable().describe('The activities that are already queued.'),
});

export type GetValidSubskillsV1RouteRequestIn = z.input<
  typeof GetValidSubskillsV1RouteRequestSchema
>

export type GetValidSubskillsV1RouteRequest = z.infer<
  typeof GetValidSubskillsV1RouteRequestSchema
>

/**
 *     return {
        skill,
        validSubskillsAscendingScore,
        subskillsOrdered
    }
 */

export const GetValidSubskillsV1RouteResponseSchema = z.object({
  skill: z.object({
      id: z.string(),
  }),
  validSubskillsAscendingScore: z.array(z.object({
    obj: z.object({
      id: z.string(),
      _name: z.string(),
    }),
    skill_id: z.string(),
    skill_name: z.string(),
    path_to: z.array(z.string()),
    path_to_links: z.array(z.string()),
    min_normalized_score_upstream: z.number().nullable().optional(),
    max_normalized_score_upstream: z.number().nullable().optional(),
    average_normalized_score_upstream: z.number().nullable().optional(),
    stddev_normalized_score_upstream: z.number().nullable().optional(),
    activity_result_count_upstream: z.number(),
    all_scores: z.array(z.number()).nullable().optional(),
    num_upstream_skills: z.number().nullable().optional(),
    level_on_parent: z.string().nullable().optional(),
    level_path: z.array(z.string()),
  }).passthrough()),
  subskillsOrdered: z.array(z.object({

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
  }).passthrough()),
})
export type GetValidSubskillsV1RouteResponse = z.output<typeof GetValidSubskillsV1RouteResponseSchema>;

export const GetValidSubskillsV1Route = new ApiRoute({
    path: "/api/skills/get_valid_subskills_v1",
    method: "post",
    requestSchema: GetValidSubskillsV1RouteRequestSchema,
    responseSchema: GetValidSubskillsV1RouteResponseSchema,
});