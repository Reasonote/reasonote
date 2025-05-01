import {z} from "zod";

import {ActivityResultBaseSchema} from "@reasonote/core";
import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ActivityAfterCompleteRouteRequestSchema = z.object({
  activityResult: ActivityResultBaseSchema,
  activityId: z.string(),
  lessonSessionId: z.string().optional().nullable(),
});
export type ActivityAfterCompleteRouteRequestIn = z.input<
  typeof ActivityAfterCompleteRouteRequestSchema
>

export type ActivityAfterCompleteRouteRequest = z.infer<
  typeof ActivityAfterCompleteRouteRequestSchema
>

export const ActivityAfterCompleteRouteResponseSchema = z.object({
  activityResult: ActivityResultBaseSchema,
});

export const ActivityAfterCompleteRoute = new ApiRoute({
    path: "/api/activity/after_complete",
    method: "post",
    requestSchema: ActivityAfterCompleteRouteRequestSchema,
    responseSchema: ActivityAfterCompleteRouteResponseSchema,
});