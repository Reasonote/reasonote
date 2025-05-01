import { z } from "zod";

export const LessonBasicConfigSchema = z.object({
    name: z.string().describe('The name of the lesson'),
    icon: z.string().optional().describe('The icon of the lesson'),
    summary: z.string().describe('The summary of the lesson'),
});

export type LessonBasicConfig = z.infer<typeof LessonBasicConfigSchema>;