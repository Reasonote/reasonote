import z from 'zod';

export const BasicUserInfoCtxInjectorConfigSchema = z.null().optional();
export type BasicUserInfoCtxInjectorConfig = z.infer<typeof BasicUserInfoCtxInjectorConfigSchema>;
