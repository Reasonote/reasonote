import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

import {SuggestedLessonSchema} from "../get_suggested_lessons/routeSchema";

export const LessonEnhanceRouteRequestSchema = z.object({
    skillIdPath: z.array(z.string()).describe('The skill id to enhance based off of.'),
    lessons: z.array(SuggestedLessonSchema).describe('The lessons to enhance'),
    fieldsToEnhance: z.array(z.enum(['description', 'learningObjectives'])).describe('The fields to enhance'),
});
export type LessonEnhanceRouteRequestIn = z.input<
  typeof LessonEnhanceRouteRequestSchema
>

export type LessonEnhanceRouteRequest = z.infer<
  typeof LessonEnhanceRouteRequestSchema
>

export const LessonEnhanceRouteResponseSchema = z.object({
  lessons: z.array(SuggestedLessonSchema).describe('The enhanced lessons'),
});

export const LessonEnhanceRoute = new ApiRoute({
    path: "/api/lesson/enhance",
    method: "post",
    requestSchema: LessonEnhanceRouteRequestSchema,
    responseSchema: LessonEnhanceRouteResponseSchema,
});