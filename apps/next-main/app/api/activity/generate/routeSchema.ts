import {z} from "zod";

import {
  ActivityConfigSchema,
  ActivityGenerateFromDocumentSchema,
  ActivityTypesPublic,
  ActivityTypesSchema,
  CtxInjectorRegistryListItemSchema,
} from "@reasonote/core";
import {CoreMessageSchema} from "@reasonote/lib-ai-common";
import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RouteWarningSchema = z.object({
  code: z.string(),
  text: z.string(),
});

export const ActivityGenerateRouteRequestSchema = z.object({
    fillActivityId: z.string().optional().nullable().describe('If provided, the generation will focus on filling out the activity with the given activity id'),
    from: z.object({
      skill: z.object({
        id: z.string().optional().nullable(),
        name: z.string().optional().nullable(),
        parentIds: z.array(z.string()).optional().nullable(),
      }).optional().nullable(),
      documents: ActivityGenerateFromDocumentSchema.array().optional().nullable(),
      activityIds: z.array(z.string()).optional().nullable(),
      activityConfigs: ActivityConfigSchema.array().optional().nullable(),
      snipIds: z.array(z.string()).optional().nullable(),
    }).optional().nullable(),
    numActivities: z.number().optional().default(1),
    activityTypes: z.array(ActivityTypesSchema).optional().default([...ActivityTypesPublic]),
    lessonSessionId: z.string().optional().nullable(),
    additionalInstructions: z.string().optional().nullable(),
    lesson: z.object({
      id: z.string().optional().nullable(),
      parentSkill: z.object({
        name: z.string(),
      }).optional().nullable(),
      name: z.string(),
      description: z.string(),
      learningObjectives: z.array(z.object({
        name: z.string(),
        description: z.string().optional().nullable(),
      })),
    }).optional().nullable(),
    activityTypeSpecificConfig: z.any().optional().nullable(),
    otherMessages: z.array(CoreMessageSchema).optional().nullable(),
    ctxInjectors: z.array(CtxInjectorRegistryListItemSchema).optional().nullable(),
});
export type ActivityGenerateRouteRequestIn = z.input<
  typeof ActivityGenerateRouteRequestSchema
>

export type ActivityGenerateRouteRequest = z.infer<
  typeof ActivityGenerateRouteRequestSchema
>

export const ActivityGenerateRouteResponseSchema = z.object({
  activityIds: z.array(z.string()),
  activities: z.array(z.object({
    id: z.string(),
    activityConfig: ActivityConfigSchema,
  })),
  warnings: z.array(RouteWarningSchema).optional(),
});

export const ActivityGenerateRoute = new ApiRoute({
    path: "/api/activity/generate",
    method: "post",
    requestSchema: ActivityGenerateRouteRequestSchema,
    responseSchema: ActivityGenerateRouteResponseSchema,
});