import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

import {RouteWarningSchema} from "../../_common/schema/RouteWarningSchema";

export const ChaptersCreateLessonsRouteRequestSchema = z.object({
    chapterId: z.string().optional().describe('The id of the chapter'),
    numLessons: z.number().optional().default(3).describe('The number of lessons to output'),
});
export type ChaptersCreateLessonsRouteRequestIn = z.input<
  typeof ChaptersCreateLessonsRouteRequestSchema
>

export type ChaptersCreateLessonsRouteRequest = z.infer<
  typeof ChaptersCreateLessonsRouteRequestSchema
>

export const ChaptersCreateLessonsRouteResponseSchema = z.object({
  lessonIds: z.array(z.string()).describe('The ids of the lessons that were created, in order'),
  warnings: RouteWarningSchema.array().optional().describe('Any warnings'),
});

export const ChaptersCreateLessonsRoute = new ApiRoute({
    path: "/api/chapters/create_lessons",
    method: "post",
    requestSchema: ChaptersCreateLessonsRouteRequestSchema,
    responseSchema: ChaptersCreateLessonsRouteResponseSchema,
});