import { z } from "zod";

import { ActivityResultUngradedBaseSchema } from "@reasonote/core";
import { formatMarkdownAdvice } from "@reasonote/core-static-prompts";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const SlideActivityConfigSchema = ActivityConfigBaseSchema.extend({
    type: z.literal('slide').optional().default('slide'),
    version: z.literal('0.0.0').optional().default('0.0.0'),
    titleEmoji: z.string().describe(`The emoji to use for the title of the Slide. ALWAYS SET THIS.`),
    title: z.string().describe(`The title of the Slide. ALWAYS SET THIS. ${formatMarkdownAdvice()}`),
    markdownContent: z.string()
        .describe(`The body of the Slide. ${formatMarkdownAdvice()}`),  
});
export type SlideActivityConfig = z.infer<typeof SlideActivityConfigSchema>;

export const SlideResultSchema =  ActivityResultUngradedBaseSchema.extend({
    activityType: z.literal('slide').optional().default('slide'),
    activityConfig: SlideActivityConfigSchema,
}).passthrough()

export type SlideResult = z.infer<typeof SlideResultSchema>;