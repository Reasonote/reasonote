import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const NeedsAssessmentRouteRequestSchema = z.object({
  skillId: z.string(),
  assessmentTypes: z.string().array().optional().nullable()
});

export type NeedsAssessmentRouteRequestIn = z.input<
  typeof NeedsAssessmentRouteRequestSchema
>

export type NeedsAssessmentRouteRequest = z.infer<
  typeof NeedsAssessmentRouteRequestSchema
>

export const NeedsAssessmentRouteResponseSchema = z.object({
  needsAnyAssessment: z.boolean(),
  assessmentTypesNeeded: z.string().array().optional().nullable()
});

export const NeedsAssessmentRoute = new ApiRoute({
    path: "/api/skills/needs_assessment",
    method: "post",
    requestSchema: NeedsAssessmentRouteRequestSchema,
    responseSchema: NeedsAssessmentRouteResponseSchema,
});