import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const LessonGetActivityListRouteRequestSchema = z.object({
    lessonId: z.string().describe('The lesson id to get an overview for'),
    // skillIdPath: z.array(z.string()).optional().describe('The skill id to get suggested lessons for'),
    // lesson: z.union([
    //   LessonSchema,
    //   z.object({
    //     id: z.string().describe('The lesson id to get an overview for'),
    //   })
    // ]).describe('The lesson to get an overview for'),
    // fieldsToGet: z.array(z.enum(['slides', 'practice', 'review'])).optional().default(['slides', 'practice', 'review']).describe('The fields to get in the lesson overview'),
});
export type LessonGetActivityListRouteRequestIn = z.input<
  typeof LessonGetActivityListRouteRequestSchema
>

export type LessonGetActivityListRouteRequest = z.infer<
  typeof LessonGetActivityListRouteRequestSchema
>

export const LessonGetActivityListRouteResponseSchema = z.object({
  activityList: z.array(z.string().describe('The activity id')).describe('The activities the user will complete in the practice section of the lesson.'),
});

export const LessonGetActivityListRoute = new ApiRoute({
    path: "/api/lesson/get_activity_list",
    method: "post",
    requestSchema: LessonGetActivityListRouteRequestSchema,
    responseSchema: LessonGetActivityListRouteResponseSchema,
});