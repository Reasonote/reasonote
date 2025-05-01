import { z } from "zod";

import {
    BasicUserInfoCtxInjectorConfig,
    BasicUserInfoCtxInjectorConfigSchema,
} from "./Configs/BasicUserInfo";
import {
    CourseCtxInjectorConfig,
    CourseCtxInjectorConfigSchema,
} from "./Configs/Course";
import {
    DomainCtxInjectorConfig,
    DomainCtxInjectorConfigSchema,
} from "./Configs/Domain";
import {
    RootSkillCtxInjectorConfig,
    RootSkillCtxInjectorConfigSchema,
} from "./Configs/RootSkill";

//////////////////////////////////////////////////////////////////////////////
// Ctx Injector Registry
//////////////////////////////////////////////////////////////////////////////

// Define the registry of all possible injector types
export interface CtxInjectorRegistry {
  BasicUserInfo: CtxInjectorRegistryItemBase<BasicUserInfoCtxInjectorConfig>;
  Course: CtxInjectorRegistryItemBaseRequiredConfig<CourseCtxInjectorConfig>;
  RootSkill: CtxInjectorRegistryItemBaseRequiredConfig<RootSkillCtxInjectorConfig>;
  Domain: CtxInjectorRegistryItemBaseRequiredConfig<DomainCtxInjectorConfig>;
}

export const CtxInjectorRegistryListItemSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("BasicUserInfo"),
    config: BasicUserInfoCtxInjectorConfigSchema
  }),
  z.object({
    name: z.literal("Course"),
    config: CourseCtxInjectorConfigSchema
  }),
  z.object({
    name: z.literal("RootSkill"),
    config: RootSkillCtxInjectorConfigSchema
  }),
  z.object({
    name: z.literal("Domain"),
    config: DomainCtxInjectorConfigSchema
  })
]);
export type CtxInjectorRegistryListItem = z.infer<typeof CtxInjectorRegistryListItemSchema>;


//////////////////////////////////////////////////////////////////////////////
// Helper types
//////////////////////////////////////////////////////////////////////////////

export interface CtxInjectorRegistryItemBase<TConfig> {
  config?: TConfig;
}

export interface CtxInjectorRegistryItemBaseRequiredConfig<TConfig> {
  config: TConfig;
}

export type CtxInjectorRegistryItem<T extends keyof CtxInjectorRegistry> = CtxInjectorRegistry[T] & CtxInjectorRegistryItemBase<CtxInjectorRegistry[T]['config']>;

export type CtxInjectorRegistryItemConfig<T extends keyof CtxInjectorRegistry> = CtxInjectorRegistry[T]['config'];


export type CtxInjectorRegistryWithUnknowns = {[key: string]: CtxInjectorRegistryItemBase<any>} & Partial<CtxInjectorRegistry>;


export function ctxInjectorRegistryToList(reg: CtxInjectorRegistryWithUnknowns): {name: string, config: any}[] {
  return Object.entries(reg).map(([key, value]) => ({
    name: key,
    config: value.config,
  }));
}

export type ctxInjectorRegistryItemType<TConfig> = {
  config: TConfig;
}