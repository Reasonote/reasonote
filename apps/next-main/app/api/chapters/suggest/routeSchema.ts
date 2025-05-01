import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

import {RouteWarningSchema} from "../../_common/schema/RouteWarningSchema";

export const SuggestedChaptersSchema = z.object({
  id: z.string().optional().describe('The id of the chapter'),
  iconEmoji: z.string().optional().describe('The emoji icon of the chapter (Should be a single emoji character -- e.g. 😄 or 💼 ... etc'),
  name: z.string().describe('The title of the chapter'),
  description: z.string().optional().describe('The description of the chapter -- something like "Learn"'),
  // lessons: SuggestedLessonSchema.array().optional().describe('The suggested lessons in the chapter.'),
}).describe('A chapter');

export const SkillResourceSchema = z.object({
  
})

export const ChaptersSuggestRouteRequestSchema = z.object({
    subject: z.union([
      z.object({
        skillResources: z.array(z.object({
          snipId: z.string().describe('The snip id of the skill resource'),
        })).optional().describe('The skill resources to add to the skills, if not already extant'),
        skillIdPath: z.array(z.string()).describe('The skill ids to get suggested lessons for'),
      }),
      z.object({
        skillResources: z.array(z.object({
          snipId: z.string().describe('The snip id of the skill resource'),
        })).optional().describe('The skill resources to add to the skills, if not already extant'),
        skillNamePath: z.array(z.string()).describe('The nested names of the skills to get suggested lessons for (i.e. ["Calculus", "Differential Equations", "Introduction to Differential Equations"])')
      }),
    ]).describe('The subject to get suggested lessons for'),
    addToUserSkillSet: z.boolean().optional().default(false).describe('Whether to add the root skill to the user\'s skill library'),
    numChapters: z.number().optional().default(3).describe('The number of chapters to output'),
    // maxTokensPerChapter: z.number().optional().default(1000).describe('The max number of tokens per chapter'),
});
export type ChaptersSuggestRouteRequestIn = z.input<
  typeof ChaptersSuggestRouteRequestSchema
>

export type ChaptersSuggestRouteRequest = z.infer<
  typeof ChaptersSuggestRouteRequestSchema
>

export const ChaptersSuggestRouteResponseSchema = z.object({
  chapterIds: z.array(z.string()).describe('The ids of the suggested chapters'),
  skillPath: z.array(z.object({
    id: z.string().describe('The id of the skill'),
    name: z.string().describe('The name of the skill'),
  })).describe('The skill id path that was passed, or created from the skill name path'),
  warnings: RouteWarningSchema.array().optional().describe('Any warnings'),
});

export const ChaptersSuggestRoute = new ApiRoute({
    path: "/api/chapters/suggest",
    method: "post",
    requestSchema: ChaptersSuggestRouteRequestSchema,
    responseSchema: ChaptersSuggestRouteResponseSchema,
});