import {z} from "zod";

import {
  ActivityConfigSchema,
  ActivityTypesPublic,
} from "@reasonote/core";
import {ActivityTypesSchema} from "@reasonote/core/src/interfaces/ActivityType";
import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ActivityGenerateUniqueRoute = new ApiRoute({
    path: '/api/activity/generate_unique',
    method: 'post',
    requestSchema: z.object({
        skillName: z.string().optional().nullable(),
        skillPath: z.array(z.string()).optional().nullable(),
        skillId: z.string().optional().nullable(),
        level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional().nullable(),
        allowedActivityTypes: z.array(ActivityTypesSchema).optional().default([...ActivityTypesPublic]),
        activityIdsToAvoidSimilarity: z.array(z.string()).optional(),
        slideActivityIdToAnchorOn: z.string().optional(),
        domainCtxInjectors: z.boolean().optional().default(true),
    }),
    responseSchema: z.object({
        activities: z.array(z.object({
            id: z.string(),
            activityConfig: ActivityConfigSchema,
        })),
    }),
});
