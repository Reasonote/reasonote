import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RemoveFromUserActivitySetRouteRequestSchema = z.object({
    removeActivityIds: z.array(z.string()),
});
export type RemoveFromUserActivitySetRouteRequestIn = z.input<
  typeof RemoveFromUserActivitySetRouteRequestSchema
>

export type RemoveFromUserActivitySetRouteRequest = z.infer<
  typeof RemoveFromUserActivitySetRouteRequestSchema
>


export const RemoveFromUserActivitySetRouteResponseSchema = z.object({
  activitiesRemoved: z.array(z.string()),
});

export const RemoveFromUserActivitySetRoute = new ApiRoute({
    path: "/api/activity/remove_from_user_activity_set",
    method: "post",
    requestSchema: RemoveFromUserActivitySetRouteRequestSchema,
    responseSchema: RemoveFromUserActivitySetRouteResponseSchema,
});