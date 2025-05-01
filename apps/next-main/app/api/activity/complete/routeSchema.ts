import { z } from 'zod';
import { ApiRoute } from '@reasonote/lib-api-sdk';

export const ActivityCompleteRoute = new ApiRoute({
  path: '/api/activity/complete',
  method: 'post',
  requestSchema: z.object({
    activityId: z.string(),
    lessonSessionId: z.string().optional(),
    score: z.number().optional(),
    resultData: z.any(),
    skipped: z.boolean().optional(),
  }),
  responseSchema: z.object({
    xpEarned: z.number().optional(),
    activityResultId: z.string().optional(),
  }),
});
