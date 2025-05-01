import { z } from 'zod';

import {
  ActivityConfig,
  ActivityGenConfig,
  ActivityGenerateManyRequest,
  ActivityGenerateRequest,
} from '@reasonote/core';

import {
  AI,
  UnifiedResource,
} from '../';
import { ValidActivityTypeServer } from './ValidActivityTypeServer';

export type NewActivityTypeServer<TConfig extends ActivityConfig = any> = Omit<ValidActivityTypeServer<TConfig, any>, 'generate'> & {
    /**
     * This function is called after the activity is generated to post-process it.
     * 
     * @param config - The generated activity config
     * @returns The post-processed activity config
     */
    postProcessConfig?: ({config, request, ai}: {config: TConfig, request: ActivityGenerateRequest, ai: AI}) => Promise<TConfig>;

    /**
     * This function is called after the activity is generated to evaluate if it is valid.
     * If it is not valid, the agent is given N chances to fix it, where N
     * 
     * @param config - The generated activity config
     * @returns True if the activity is valid, false otherwise
     */
    evaluateConfig?: (args: {config: TConfig, ai: AI, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}}) => Promise<{isValid: boolean, feedback: any}>;
}


export type ActivityRequestHydratedValues = {
    resources: UnifiedResource[];
    validActivityTypeServers: ValidActivityTypeServerHydrated[];
    outputSchema: z.ZodObject<any, any, any>; 
    fromActivityPrompts?: string[];
    /**
     * The formatted activity configs to be used in the activity.
     */
    activityConfigsFormatted: string[];
    /**
     * An explainer string for the user.
     */
    userExplainerString?: string | null;

    /**
     * The context injectors to be used in the activity.
     */
    ctxInjectorsFormatted: string[];

    /**
     * Define the subject of the activity / activities to be generated.
     * 
     * Generally this is the skill string with context, but in some cases it may be different.
     */
    subjectDefinitionString: string;

    /**
     * The references and chunks to be used in the activity.
     */
    referencesAndChunks: {
        references: {id: string, content: string, docId: string, name: string}[], 
        chunks: {id: string, content: string, docId: string, name: string}[]
    };
}

export type  ActivityGeneratorV2ActivityGenerateRequest = ActivityGenerateManyRequest

export type ActivityGeneratorV2HydratedRequest = ActivityGeneratorV2ActivityGenerateRequest & {
    hydrated: ActivityRequestHydratedValues
}

export type ValidActivityTypeServerHydrated = NewActivityTypeServer & {
    genConfig: ActivityGenConfig;
}