import { z } from "zod";


export const DomainCtxInjectorConfigSchema = z.object({
    subjectName: z.string().optional(),
    skillId: z.string().optional(),
    specificity: z.enum(['activityGeneration', 'lessonGeneration']).optional(),
});

export type DomainCtxInjectorConfig = z.infer<typeof DomainCtxInjectorConfigSchema>;
