import {z} from "zod";

import {
  ActivityGenerateFromDocumentSchema,
  ActivityTypesPublic,
  ActivityTypesSchema,
} from "@reasonote/core";
import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SkillSchema = z.object({
  id: z.string().optional(),
  parentSkillIds: z.string().array().optional(),
  name: z.string().optional(),
  parentSkillNames: z.string().array().optional(),
})

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const ActivityGenStreamRouteRequestSchema = z.object({ 
  context: z.object({
    specialInstructions: z.string(),
    skill: z.object({
      id: z.string().nullish(),
      name: z.string().nullish(),
      parentIds: z.array(z.string()).nullish(),
    }).nullish(),
    lesson: z.object({
      id: z.string().nullish(),
      coreSkill: SkillSchema.nullish(),
      name: z.string(),
      description: z.string(),
      learningObjectives: z.array(z.object({
        name: z.string(),
        description: z.string().nullish(),
      })),
    }).nullish(),
    documents: ActivityGenerateFromDocumentSchema.array().nullish(),
    // activityIds: z.array(z.string()).nullish(),
    // activityConfigs: ActivityConfigSchema.array().nullish(),
    // snipIds: z.array(z.string()).nullish(),
  }),
  numActivities: z.number().nullish().default(1),
  activityTypes: z.array(ActivityTypesSchema).nullish().default([...ActivityTypesPublic]),

  // activityTypeSpecificConfig: z.any().nullish(),
  // otherMessages: z.array(CoreMessageSchema).nullish(),
});
export type ActivityGenStreamRouteRequestIn = z.input<
  typeof ActivityGenStreamRouteRequestSchema
>;
export type ActivityGenStreamRouteRequestOut = z.output<
  typeof ActivityGenStreamRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const ActivityGenStreamRouteResponseSchema = z.any();
export type ActivityGenStreamRouteResponse = z.infer<
  typeof ActivityGenStreamRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const ActivityGenStreamRoute = new ApiRoute({
  path: "/api/activity/gen-stream",
  method: "post",
  requestSchema: ActivityGenStreamRouteRequestSchema,
  responseSchema: ActivityGenStreamRouteResponseSchema,
});
