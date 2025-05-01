import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const AddtoUserActivitySetRouteRequestSchema = z.object({
    addIds: z.array(z.string()),
});
export type AddtoUserActivitySetRouteRequestIn = z.input<
  typeof AddtoUserActivitySetRouteRequestSchema
>

export type AddtoUserActivitySetRouteRequest = z.infer<
  typeof AddtoUserActivitySetRouteRequestSchema
>

export const AddtoUserActivitySetRouteResponseSchema = z.object({
  activitySetId: z.string(),
  activitySetActivityIds: z.array(z.string()),
  activityIds: z.array(z.string()),
});

export const AddtoUserActivitySetRoute = new ApiRoute({
    path: "/api/activity/add_to_user_activity_set",
    method: "post",
    requestSchema: AddtoUserActivitySetRouteRequestSchema,
    responseSchema: AddtoUserActivitySetRouteResponseSchema,
});