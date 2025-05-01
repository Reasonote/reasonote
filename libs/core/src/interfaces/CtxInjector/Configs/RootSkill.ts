import z from 'zod';

export const RootSkillCtxInjectorConfigSchema = z.object({
    skillId: z.string().optional(),
    skillIdPath: z.array(z.string()).optional(),
    rsnUserId: z.string().optional(),
});
export type RootSkillCtxInjectorConfig = z.infer<typeof RootSkillCtxInjectorConfigSchema>;
