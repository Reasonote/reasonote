import z from 'zod';

export const CourseCtxInjectorConfigSchema = z.object({
  courseId: z.string(),
});
export type CourseCtxInjectorConfig = z.infer<typeof CourseCtxInjectorConfigSchema>;
