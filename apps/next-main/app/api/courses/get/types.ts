import { z } from "zod";

export const ResourceSchema = z.object({
    id: z.string(),
    name: z.string(),
    body: z.string(),
    createdDate: z.string(),
    createdBy: z.string(),
});

export const LessonSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    emoji: z.string().nullable().optional(),
    rootSkillId: z.string(),
    orderIndex: z.number(),
});

export const CourseSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rootSkillId: z.string(),
    createdDate: z.string(),
    updatedDate: z.string(),
    canEdit: z.boolean(),
    coverImageUrl: z.string(),
    lessons: z.array(LessonSchema),
    resources: z.array(ResourceSchema),
});

export type Resource = z.infer<typeof ResourceSchema>;
export type Lesson = z.infer<typeof LessonSchema>; 
export type Course = z.infer<typeof CourseSchema>;