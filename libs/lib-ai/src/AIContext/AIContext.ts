import {
  EmbeddingModel,
  LanguageModel,
  LanguageModelV1,
} from 'ai';
import OpenAI from 'openai';

import { ProviderV1 } from '@ai-sdk/provider';
import { SimpleLogger } from '@lukebechtel/lab-ts-utils';
import { Database } from '@reasonote/lib-sdk';
import { ReasonoteApolloClient } from '@reasonote/lib-sdk-apollo-client';
import { SupabaseClient } from '@supabase/supabase-js';

import { RNCtxInjector } from '../AIChat/ChatStream/Agent/RNCtxInjector';
import { AIDriver } from '../AIDriver';
import {
  HuggingFaceTransformersEmbeddings,
} from '../AIEmbeddings/HuggingFaceTransformersEmbeddings';

export interface AIContextActivityTypeDefinition {
    type: string;
    typeHumanName: string;
    aiStringifier?: (config: any, result?: any) => string;
}

export interface AIProvider {
    name?: string;

    /**
     * Returns a language model with the given id.
     */
    languageModel?: (modelId: string) => LanguageModel;

    /**
     * Returns a text embedding model with the given id.
     */
    textEmbedding?: (modelId: string) => EmbeddingModel<string>;
}

export type AIModelProps = {
    speed?: number;
    quality?: number;
    contextLength?: number,
    toolOptimized?: boolean,
    altTags?: string[],
}

export interface AIContextConstructorArgs {
    sb: SupabaseClient<Database>;
    ac: ReasonoteApolloClient;
    aiDriver: AIDriver;
    embeddings?: {
        // We may want to provide an existing embeddings object,
        // as this takes some time to spinup / load the model for.
        supabaseGteSmall?: HuggingFaceTransformersEmbeddings
    }

    openaiApiKey?: string;

    /**
     * The context injectors to use for this generation.
     */
    ctxInjectors?: RNCtxInjector[];

    elevenLabsApiKey?: string;

    aiProviders?: Record<string, ProviderV1>;

    /**
     * Props for models hosted by different ai providers.
     */
    modelProps?: Record<string, AIModelProps>;

    /**
     * If no model is provided to genText, this will be used.
     */
    defaultGenTextModels?: (LanguageModel | string)[];

    /**
     * If no model is provided to genObject, this will be used.
     */
    defaultGenObjectModels?: (LanguageModelV1 | string)[];

    logger?: SimpleLogger;
    /**
     * A Getter for the activity type definition.
     * 
     * TODO: this would likely be better baked into the reasonote SDK itself.
     */
    getActivityTypeDefinition?: (args: {activityType: string}) => Promise<AIContextActivityTypeDefinition | undefined>;
    transformersPkg?: any;
}


export class AIContext {    
    constructor(
        readonly args: AIContextConstructorArgs
    ){}

    get sb(){
        return this.args.sb;
    }

    get ac(){
        return this.args.ac;
    }

    get ctxInjectors(){
        return this.args.ctxInjectors;
    }

    get openai(){
        return new OpenAI({
            apiKey: this.openaiApiKey,
        });
    }

    get openaiApiKey(){
        return this.args.openaiApiKey;
    }

    get elevenLabsApiKey(){
        return this.args.elevenLabsApiKey;
    }

    get modelProps(){
        return this.args.modelProps;
    }

    get aiDriver(){
        return this.args.aiDriver;
    }

    get embeddings(){
        return this.args.embeddings;
    }

    get defaultGenTextModels(){
        return this.args.defaultGenTextModels;
    }

    get defaultGenObjectModels(): (LanguageModelV1 | string)[] | undefined {
        return this.args.defaultGenObjectModels;
    }

    get aiProviders(){
        return this.args.aiProviders
    }

    get logger(){
        return this.args.logger;
    }

    get transformersPkg(){
        return this.args.transformersPkg;
    }

    async getActivityTypeDefinition(args: {activityType: string}): Promise<AIContextActivityTypeDefinition | undefined> {
        if (this.args.getActivityTypeDefinition){
            return this.args.getActivityTypeDefinition(args);
        }
        else {
            return undefined;
        }
    }
}