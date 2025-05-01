import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SkillVisitRoute = new ApiRoute({
  path: "/api/skill-visit",
  method: "post",
  requestSchema: z.object({
    skillId: z.string(),
  }),
  responseSchema: z.object({
    success: z.boolean(),
  }),
});