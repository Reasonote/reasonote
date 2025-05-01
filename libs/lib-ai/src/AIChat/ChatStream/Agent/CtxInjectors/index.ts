import { RNCtxInjector } from '../RNCtxInjector';
// This file ensures all context injectors are loaded and registered
import { BasicUserInfoCtxInjector } from './BasicUserInfoCtxInjector';
import { CourseCtxInjector } from './CourseCtxInjector';
import { RootSkillCtxInjector } from './RootSkillCtxInjector';
import { DomainCtxInjector } from './DomainCtxInjector';

// Register all implementations
RNCtxInjector.register(BasicUserInfoCtxInjector);
RNCtxInjector.register(CourseCtxInjector);
RNCtxInjector.register(RootSkillCtxInjector);
RNCtxInjector.register(DomainCtxInjector);

// Re-export them if needed
export * from './BasicUserInfoCtxInjector';
export * from './CourseCtxInjector';
export * from './RootSkillCtxInjector';
export * from './DomainCtxInjector';