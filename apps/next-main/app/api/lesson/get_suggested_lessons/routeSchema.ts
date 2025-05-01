import {z} from "zod";

import {
  LearningObjectiveAISchema,
} from "@/app/app/admin/testing/lesson-creator/genBloomTaxonomy";
import {ApiRoute} from "@reasonote/lib-api-sdk";

import {RouteWarningSchema} from "../../_common/schema/RouteWarningSchema";

export const SuggestedLessonSchema = z.object({
  id: z.string().nullish().describe('The id of the lesson'),
  lessonIconEmoji: z.string().nullish().describe('The emoji icon of the lesson (Should be a single emoji character -- e.g. 😄 or 💼 ... etc'),
  title: z.string().describe('The title of the lesson'),
  description: z.string().nullish().describe('The description of the lesson'),
  // skills: z.array(z.string()).describe('The skill names of the lesson'),
  learningObjectives: z.array(LearningObjectiveAISchema.omit({isOptional: true, timeToStudy: true})).nullish().describe('The learning objectives of the lesson'),
}).describe('A lesson')
export type SuggestedLesson = z.infer<typeof SuggestedLessonSchema>

export const GetSuggestedLessonsRouteRequestSchema = z.object({
    skillIdPath: z.array(z.string()).describe('The skill ids to get suggested lessons for'),
    variant: z.enum(['short', 'normal']).optional().default('normal').describe('The variant of the lesson'),
    existingLessons: z.array(SuggestedLessonSchema).optional().describe('The existing lessons'),
    numLessons: z.number().optional().default(3).describe('The number of lessons to output'),
    maxTokensPerLesson: z.number().optional().default(1000).describe('The max number of tokens per lesson'),
    forceFirstLesson: z.boolean().optional().default(false).describe('Whether to force-return only the first lesson.'),
});
export type GetSuggestedLessonsRouteRequestIn = z.input<
  typeof GetSuggestedLessonsRouteRequestSchema
>

export type GetSuggestedLessonsRouteRequest = z.infer<
  typeof GetSuggestedLessonsRouteRequestSchema
>



export const GetSuggestedLessonsRouteResponseSchema = z.object({
  lessons: z.array(SuggestedLessonSchema).describe('The lessons'),
  warnings: RouteWarningSchema.array().optional().describe('Any warnings'),
});

export const GetSuggestedLessonsRoute = new ApiRoute({
    path: "/api/lesson/get_suggested_lessons",
    method: "post",
    requestSchema: GetSuggestedLessonsRouteRequestSchema,
    responseSchema: GetSuggestedLessonsRouteResponseSchema,
});