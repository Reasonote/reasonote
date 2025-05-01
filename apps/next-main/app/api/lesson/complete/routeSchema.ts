import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const LessonCompleteRouteRequestSchema = z.object({
    lessonSessionId: z.string().describe('The lesson Session id'),
});
export type LessonCompleteRouteRequestIn = z.input<
  typeof LessonCompleteRouteRequestSchema
>

export type LessonCompleteRouteRequest = z.infer<
  typeof LessonCompleteRouteRequestSchema
>

export const LessonCompleteRouteResponseSchema = z.object({
  lessonSessionId: z.string().describe('The lesson session id'),
  finishText: z.string().describe('The finish text'),
});

export const LessonCompleteRoute = new ApiRoute({
    path: "/api/lesson/complete",
    method: "post",
    requestSchema: LessonCompleteRouteRequestSchema,
    responseSchema: LessonCompleteRouteResponseSchema,
});