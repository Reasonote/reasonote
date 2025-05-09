import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SkillScoresRoute = new ApiRoute({
  path: "/api/skill-scores",
  method: "post",
  requestSchema: z.object({
    topicOrId: z.string(),
  }),
  responseSchema: z.array(
    z.object({
      skill_id: z.string(),
      skill_name: z.string(),
      path_to: z.array(z.string()),
      min_normalized_score_upstream: z.number(),
      max_normalized_score_upstream: z.number(),
      average_normalized_score_upstream: z.number(),
      stddev_normalized_score_upstream: z.number(),
      activity_result_count_upstream: z.number(),
      all_scores: z.array(z.number()),
      num_upstream_skills: z.number(),
      level_on_parent: z.string(),
    })
  ),
}); 