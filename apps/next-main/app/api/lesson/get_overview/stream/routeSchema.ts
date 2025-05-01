import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const LessonGetOverviewStreamRoute = new ApiRoute({
  path: "/api/lesson/get_overview/stream",
  method: "post",
  requestSchema: z.object({
    lessonId: z.string(),
    skillIdPath: z.array(z.string()).optional(),
    fieldsToGet: z.array(z.enum(['slides', 'practice'])).optional().default(['slides', 'practice']),
    forceGenerate: z.boolean().optional().default(false).describe('If true, will generate any requested fields even if they already exist.'),
  }),
  responseSchema: z.object({
    activityId: z.string(),
    type: z.enum(['slide', 'practice']),
  }) 
});