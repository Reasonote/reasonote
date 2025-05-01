import './AIChat/ChatStream/Agent/CtxInjectors';  // This ensures all injectors are registered

import {
  CoreMessage,
  CoreTool,
  experimental_createProviderRegistry as createProviderRegistry,
  LanguageModel,
} from 'ai';
import _ from 'lodash';
import { z } from 'zod';

import {
  notEmpty,
  typedUuidV4,
} from '@lukebechtel/lab-ts-utils';
import {
  ctxInjectorRegistryToList,
  CtxInjectorRegistryWithUnknowns,
  OneShotAIArgs,
  OneShotAIResponse,
  RNCtxInjectorInvokeConfig,
} from '@reasonote/core';
import {
  AIGenerator,
  AIGenObjectArgs,
  AIGenTextArgs,
  AIStreamGenObjectArgs,
  AIStreamRNAgentArgs,
  AIStreamRNAgentResult,
  AIStreamSuggestedNextMessagesArgs,
  AIStreamSuggestedNextMessagesResult,
  GenObjectResult,
  GenTextResult,
  ObserveOptions,
  StreamGenObjectResult,
} from '@reasonote/lib-ai-common';
import {
  Maybe,
  runMaybify,
  unsafeJsonSchemaToZod,
  unsafeRecursiveJsonSchemaToZod,
} from '@reasonote/lib-utils';

import { AIAudio } from './AIAudio/AIAudio';
import { ChatRunner } from './AIChat/ChatRunner';
import {
  ViewingActivityCMR,
} from './AIChat/ChatStream/Agent/CMRs/ViewingActivityCMR';
import {
  ViewingLessonCMR,
} from './AIChat/ChatStream/Agent/CMRs/ViewingLessonCMR';
import { RNAgent } from './AIChat/ChatStream/Agent/RNAgent';
import { RNCtxInjector } from './AIChat/ChatStream/Agent/RNCtxInjector';
import {
  OfferUserOptionsTool,
} from './AIChat/ChatStream/Agent/Tools/OfferUserOptionsTool';
import { SearchRNTool } from './AIChat/ChatStream/Agent/Tools/SearchRNTool';
import {
  SuggestLessonsTool,
} from './AIChat/ChatStream/Agent/Tools/SuggestLessonsTool';
import {
  UpdateUserSkillTool,
} from './AIChat/ChatStream/Agent/Tools/UpdateUserSkillTool';
// NOTE: All these items must be imported DIRECTLY FROM THE FILE OF THEIR DEFINITION.
// Otherwise, we get a cyclic dependency error.
import { CondenserSubtree } from './AICondenser/CondenserSubtree';
import { AIContext } from './AIContext/AIContext';
import { AIEmbeddings } from './AIEmbeddings/AIEmbeddings';
import {
  genObject,
  genText,
  streamGenObject,
} from './drivers';
import { AIPrompt } from './prompt/AIPrompt';
import {
  suggestPartialSkill,
} from './skills/suggestPartialSkill/index.priompt';
import {
  SuggestSkillArgs,
  SuggestSkillResult,
} from './skills/suggestPartialSkill/types';
import { Panel } from './Squads/Panel/Panel';
import { AITokens } from './tokens/AITokens';
import { JsonStreamHelper } from './utils/JsonStreamHelper';
import { AIVectorStore } from './vectors/VectorStore';

function getJsonDiff(previousObj: any, currentObj: any): string {
    const previousStr = JSON.stringify(previousObj);
    const currentStr = JSON.stringify(currentObj);

    // Find the first differing character
    let i = 0;
    while (i < previousStr.length && i < currentStr.length && previousStr[i] === currentStr[i]) {
        i++;
    }

    // Return the new characters from the first difference to the end
    return currentStr.slice(i);
}

export class AI implements AIGenerator {
    instId = typedUuidV4('AI');
    registry: ReturnType<typeof createProviderRegistry>
    _audio?: AIAudio;

    embed: AIEmbeddings;

    // TODO: replace this back or put it in the SDK
    // observe = observe;
    async observe<A extends unknown[], F extends (...args: A) => ReturnType<F>>({ name, sessionId, userId, traceType, spanType, traceId, }: ObserveOptions, fn: F, ...args: A): Promise<ReturnType<F>> {
        return fn(...args);
    };

    getCtxInjectorsForInvokeConfigs(invokeConfigs: RNCtxInjectorInvokeConfig[]): RNCtxInjector[] { 
        return invokeConfigs.map(invokeConfig => {
            return this.ctx.ctxInjectors?.find(ctxInjector => ctxInjector.name.toLowerCase() === invokeConfig.name.toLowerCase());
        }).filter(notEmpty)
    }

    /**
     * Retrieves context descriptors from an array of context injector invoke configurations.
     * This method maps each invoke config to its corresponding injector and retrieves 
     * the context descriptor by calling the injector's get method.
     * 
     * Important: This method includes error handling for each individual context injector.
     * If any injector fails to retrieve its context, the error is caught and logged,
     * but the method continues processing other injectors. This ensures that a single
     * failing injector won't cause the entire context retrieval to fail.
     * 
     * @param invokeConfigs - Array of context injector invoke configurations
     * @returns Promise resolving to an array of context descriptors (name, description, content)
     */
    async getCtxDescriptorsFromInvokeConfigs(invokeConfigs: RNCtxInjectorInvokeConfig[]): Promise<{name: string, description?: string, content: string}[]> {
        const asList = invokeConfigs.map(invokeConfig => {
            return {
                name: invokeConfig.name,
                config: invokeConfig.config,
                injector: this.ctx.ctxInjectors?.find(ctxInjector => ctxInjector.name.toLowerCase() === invokeConfig.name.toLowerCase()),
            }
        });

        const ctxDescriptors = (await Promise.all(asList.map(async (ctxInjector) => {
            try {
                return await ctxInjector?.injector?.get(this, ctxInjector.config);
            } catch (error) {
                console.error(`Error getting context descriptor for ${ctxInjector?.name}:`, error);
                return null;
            }
        }))).filter(notEmpty);

        return ctxDescriptors;
    }

    async getCtxStringsFromInvokeConfigs(invokeConfigs: RNCtxInjectorInvokeConfig[]): Promise<string[]> {
        const ctxDescriptors = await this.getCtxDescriptorsFromInvokeConfigs(invokeConfigs);

        return ctxDescriptors.map(ctxDescriptor => {
            return `<${ctxDescriptor.name}>\n${ctxDescriptor.content}\n</${ctxDescriptor.name}>`;
        })
    }

    async getCtxStringFromInvokeConfigs(invokeConfigs: RNCtxInjectorInvokeConfig[]): Promise<string> {
        return (await this.getCtxStringsFromInvokeConfigs(invokeConfigs)).join('\n');
    }

    async getCtxMessagesFromInvokeConfigs(invokeConfigs: CtxInjectorRegistryWithUnknowns): Promise<CoreMessage[]> {
        const ctxDescriptors = await this.getCtxDescriptorsFromInvokeConfigs(ctxInjectorRegistryToList(invokeConfigs));

        // TODO: move this formatting to a class method on CtxInjector
        return ctxDescriptors.map(ctxDescriptor => {
            return {
                role: 'system',
                content: `<${ctxDescriptor.name}>\n${ctxDescriptor.content}\n</${ctxDescriptor.name}>`
            };
        });
    }

    constructor(readonly ctx: AIContext) {
        // Add all models from ctx to registry
        this.registry = createProviderRegistry(ctx.aiProviders ?? {});

        this.embed = new AIEmbeddings(this);

        try {
            let laminarEnabled = process.env.LMNR_ENABLED === 'true' || process.env.LMNR_ENABLED === '1';
            if (!laminarEnabled) {
                console.debug('Laminar is disabled -- set LMNR_ENABLED=true to enable');
                return;
            }

            let baseUrl = process.env.LMNR_BASE_URL;
            let httpPort = process.env.LMNR_HTTP_PORT;
            let grpcPort = process.env.LMNR_GRPC_PORT;
            const projectApiKey = process.env.LMNR_API_KEY;

            // Set default ports if baseUrl is localhost or 127.0.0.1
            if (baseUrl && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))) {
                httpPort = httpPort || '8000';
                grpcPort = grpcPort || '8001';
            }

            // Only API key is required
            if (!projectApiKey) {
                throw new Error(`LMNR_API_KEY is not set. To enable Laminar telemetry, follow the instructions here: https://docs.lmnr.ai/self-hosting/setup`);
            }

            // If we're in the server, import and initialize Laminar.
            // This is probably okay if you are not using Laminar.
            if (typeof window === 'undefined' && baseUrl && projectApiKey) {
                const {Laminar} = require('@lmnr-ai/lmnr') as typeof import('@lmnr-ai/lmnr');

                console.log('LAMINAR_API_KEY', process.env.LMNR_API_KEY);
                Laminar.initialize({
                    baseUrl,
                    projectApiKey,
                    httpPort: httpPort ? parseInt(httpPort) : undefined,
                    grpcPort: grpcPort ? parseInt(grpcPort) : undefined,
                });
            }
        } catch (error) {
            console.warn('WARNING: Error While Initializing Laminar. Laminar will not be enabled. Error was:', error);
        }
    }



    get audio() {
        if (!this._audio) {
            this._audio = new AIAudio(this);
        }
        return this._audio;
    }

    /**
     * Prompt generation.
     */
    prompt = new AIPrompt(this);

    /**
     * Chat running.
     */
    chat = new ChatRunner(this);

    /**
     * AI-based tools.
     */
    tools = {
        /**
         * @deprecated
         */
        oneShotAI: <T extends z.ZodTypeAny>(args: OneShotAIArgs<T>): Promise<OneShotAIResponse<T>> => {
            return this.ctx.aiDriver.oneShotAI(args);
        },

        streamGenObject: <T>(args: AIStreamGenObjectArgs<T>): Promise<StreamGenObjectResult<T>> => {
            return this.streamGenObject(args);
        },

        genObject: <T>(args: AIGenObjectArgs<T>): Promise<GenObjectResult<T>> => {
            return this.genObject(args);
        }
    }

    resolveModels({ models, model, modelPicking, defaults }: { models?: (string | LanguageModel)[]; model?: (string | LanguageModel); modelPicking?: 'speed' | 'quality' | 'balance', defaults: (LanguageModel | string)[]; }): (LanguageModel | string)[] {
        if (modelPicking) {
            if (modelPicking === 'speed') {
                return Object.entries(this.ctx.modelProps ?? {})
                    .sort((a, b) => (a[1].speed ?? 0) - (b[1].speed ?? 0))
                    .map(([modelName]) => modelName);
            }
            else if (modelPicking === 'quality') {
                return Object.entries(this.ctx.modelProps ?? {})
                    .sort((a, b) => (a[1].quality ?? 0) - (b[1].quality ?? 0))
                    .map(([modelName]) => modelName);
            }
            else if (modelPicking === 'balance') {
                return Object.entries(this.ctx.modelProps ?? {})
                    .sort((a, b) => ((a[1].quality ?? 0) / (a[1].speed ?? 1)) - ((b[1].quality ?? 0) / (b[1].speed ?? 1)))
                    .map(([modelName]) => modelName);
            }
            else {
                throw new Error(`Unknown modelPicking: ${modelPicking}`);
            }
        }
        else if (model) {
            return [model];
        }
        else if (models) {
            return _.isArray(models) ? models : [models];
        } else if (defaults) {
            return defaults;
        }
        else {
            throw new Error('Model or models not provided and no default models set in context. Either provide model or models or set defaultGenObjectModels in the AIContext');
        }
    }

    registryResolveModels(models: (string | LanguageModel)[], providerArgs?: any): LanguageModel[] {
        return models.map(model => {
            // Now, resolve aliases.
            if (_.isString(model)) {
                const modelProvider = model.split(':')[0];
                // First, look through all our modelProps to see if we have an alias.
                const matches = Object.entries(this.ctx.modelProps ?? {})
                    .find(([modelName, modelProps]) => {
                        const entryProvider = modelName.split(':')[0];
                        // Full or final tag match.
                        return entryProvider === modelProvider && (modelProps.altTags?.includes(model) || modelProps.altTags?.includes(model.split(':')[1]));
                    })

                const fullName = matches ? matches[0] : model;

                // If we have providerArgs, we need to create the provider with them.
                if (!!providerArgs) {
                    const providerFunc = Object.entries(this.ctx.aiProviders ?? {}).find(([providerName, providerFunc]) => providerName === modelProvider)?.[1];
                    const modelName = fullName.split(':')[1];

                    if (!providerFunc) {
                        throw new Error(`Provider ${modelName} not found`);
                    }

                    //@ts-ignore
                    const provider = providerFunc?.(modelName, providerArgs);

                    return provider;
                }
                else {
                    return this.registry.languageModel(fullName);
                }
            }
            else {
                // TODO: this is being noisy because of default models...
                // possibly rethink our usage of default models?
                // if (providerArgs) {
                //     console.warn('providerArgs provided, but model was provided directly. Ignoring providerArgs.');
                // }

                return model;
            }
        });
    }

    async genObjectMaybify<T>(args: AIGenObjectArgs<T>): Promise<Maybe<GenObjectResult<T>>> {
        return await runMaybify(async () => await this.genObject(args));
    }

    /**
     * Streams a generated object from an AI model based on the provided schema.
     * 
     * @remarks
     * IMPORTANT: When using this function with structured outputs, certain schema constraints
     * will be removed and NOT enforced:
     * - default values (these would be ignored anyway)
     * - min/max constraints (minimum, maximum)
     * - array length constraints (minItems, maxItems)
     * - string length constraints (minLength, maxLength)
     * 
     * Additionally, all properties will be marked as required. If you need validation
     * with these constraints, you should validate the output after generation.
     * 
     * @param args - The arguments for streaming object generation
     * @returns A promise that resolves to a StreamGenObjectResult
     */
    async streamGenObject<T>(args: AIStreamGenObjectArgs<T>): Promise<StreamGenObjectResult<T>> {
        const models = this.resolveModels({
            model: args.model,
            defaults: this.ctx.defaultGenObjectModels ?? [],
        });

        if (!models || models.length === 0) {
            throw new Error('Model not provided and no default models set in context. Either provide model or set defaultGenObjectModels in the AIContext');
        }

        const resolvedModel = this.registryResolveModels(models, args.providerArgs)[0];

        // Get the context messages from the ctxInjectors, if applicable.
        const ctxMessages = args.ctxInjectors ? await this.getCtxMessagesFromInvokeConfigs(args.ctxInjectors) : [];

        // TODO: Something is wrong here with outputs.
        //@ts-ignore
        return await streamGenObject({
            ...args,
            model: resolvedModel,
            ctxMessages,
            suggestionPanel: args.suggestionPanel ? new Panel({ stub: args.suggestionPanel, ai: this }) : undefined,
        });
    }

    async streamRnagent<T>(args: AIStreamRNAgentArgs): Promise<AIStreamRNAgentResult<any>> {
        const models = this.resolveModels({
            model: args.genArgs.model,
            defaults: this.ctx.defaultGenObjectModels ?? [],
        });

        if (!models || models.length === 0) {
            throw new Error('Model not provided and no default models set in context. Either provide model or set defaultGenObjectModels in the AIContext');
        }

        const resolvedModel = this.registryResolveModels(models, args.genArgs.providerArgs)[0];

        const agent = new RNAgent({
            ai: this,
            contextInjectors: [
                ...RNCtxInjector.getNewImplementations(),
            ],
            contextMessageRenderers: [
                new ViewingActivityCMR(this),
                new ViewingLessonCMR(this),
            ],
            tools: [
                new SuggestLessonsTool(),
                new OfferUserOptionsTool(),
                new UpdateUserSkillTool(),
                new SearchRNTool(),
            ]
        });

        const res = await agent.stream({
            ...args,
            genArgs: {
                ...args.genArgs,
                model: resolvedModel,
            },
        });

        return res;
    }

    async streamSuggestedNextMessages(args: AIStreamSuggestedNextMessagesArgs): Promise<AIStreamSuggestedNextMessagesResult> {
        const models = this.resolveModels({
            model: args.genArgs.model,
            defaults: this.ctx.defaultGenObjectModels ?? [],
        });

        if (!models || models.length === 0) {
            throw new Error('Model not provided and no default models set in context. Either provide model or set defaultGenObjectModels in the AIContext');
        }

        const resolvedModel = this.registryResolveModels(models, args.genArgs.providerArgs)[0];

        const agent = new RNAgent({
            ai: this,
            contextInjectors: [
                ...RNCtxInjector.getNewImplementations(),
            ],
            contextMessageRenderers: [
                new ViewingActivityCMR(this),
                new ViewingLessonCMR(this),
            ],
            tools: [
                new SuggestLessonsTool(),
                new OfferUserOptionsTool(),
                new UpdateUserSkillTool(),
                new SearchRNTool(),
            ]
        });

        const res = await agent.streamSuggestedNextMessages({
            ...args,
            genArgs: {
                ...args.genArgs,
                model: resolvedModel,
            },
        });

        return res;
    }


    /**
     * Generates an object from an AI model based on the provided schema.
     * 
     * @remarks
     * IMPORTANT: When using this function with structured outputs, certain schema constraints
     * will be removed and NOT enforced:
     * - default values (these would be ignored anyway)
     * - min/max constraints (minimum, maximum)
     * - array length constraints (minItems, maxItems)
     * - string length constraints (minLength, maxLength)
     * 
     * Additionally, all properties will be marked as required. If you need validation
     * with these constraints, you should validate the output after generation.
     * 
     * @param args - The arguments for object generation
     * @returns A promise that resolves to a GenObjectResult
     */
    async genObject<T>(args: AIGenObjectArgs<T>): Promise<GenObjectResult<T>> {
        const models = this.resolveModels({
            models: args.models,
            model: args.model,
            modelPicking: args.modelPicking,
            defaults: this.ctx.defaultGenObjectModels ?? [],
        });

        const feedbackModels = this.resolveModels({
            models: args.feedbackModels,
            model: args.feedbackModel,
            modelPicking: args.modelPicking,
            defaults: this.ctx.defaultGenObjectModels ?? [],
        });

        if (!models) {
            throw new Error('Model or models not provided and no default models set in context. Either provide model or models or set defaultGenObjectModels in the AIContext');
        }

        if (!feedbackModels && (args.maxFeedbackLoops && args.maxFeedbackLoops > 0)) {
            throw new Error('Neither feedbackModel nor feedbackModels provided and maxFeedbackLoops > 0. Either provide feedbackModel or feedbackModels or set defaultGenObjectModels in the AIContext');
        }

        // Resolve models based on registry.
        const resolvedModels = this.registryResolveModels(models, args.providerArgs);
        const resolvedFeedbackModels = this.registryResolveModels(feedbackModels, args.providerArgs);

        // Get the context messages from the ctxInjectors, if applicable.
        const ctxMessages = args.ctxInjectors ? await this.getCtxMessagesFromInvokeConfigs(args.ctxInjectors) : [];

        return genObject({
            ...args,
            models: resolvedModels,
            model: undefined,
            feedbackModels: resolvedFeedbackModels,
            feedbackModel: undefined,
            ctxMessages,
        });
    }

    async genTextMaybify<T>(args: AIGenObjectArgs<T>): Promise<Maybe<GenObjectResult<T>>> {
        return await runMaybify(async () => await this.genObject(args));
    }

    async genText<TOOLS extends Record<string, CoreTool<any, any>>>(args: AIGenTextArgs<TOOLS>): Promise<GenTextResult<TOOLS>> {
        const models = this.resolveModels({
            models: args.models,
            model: args.model,
            modelPicking: args.modelPicking,
            defaults: this.ctx.defaultGenTextModels ?? [],
        });

        if (!models) {
            throw new Error('Model or models not provided and no default models set in context. Either provide model or models or set defaultGenObjectModels in the AIContext');
        }

        // Resolve models based on registry.
        const resolvedModels = this.registryResolveModels(models);

        return genText({
            ...args,
            models: resolvedModels,
            model: undefined,
        });
    }

    condense = new CondenserSubtree(this);

    /**
     * Vector store.
     */
    vectors = new AIVectorStore(this);

    tokens = new AITokens(this);

    get sb() {
        return this.ctx.sb;
    }

    get ac() {
        return this.ctx.ac;
    }

    /**
     * Serve up a request in a way that can be used by a server for a simple single-endpoint API.
     */
    async serve(req: { function: string; args: any }): Promise<any> {
        if (req.function === 'genObject') {
            // genObject needs a zod schema.
            // Convert jsonSchema to zod.
            const schema = unsafeJsonSchemaToZod(req.args.schema);

            return this.genObject({
                ...req.args,
                schema,
            });
        }
        else if (req.function === 'genText') {
            // Convert all tools to zod
            const tools = _.mapValues(req.args.tools, tool => {
                return {
                    description: tool.description,
                    parameters: unsafeJsonSchemaToZod(tool.parameters),
                };
            });

            return this.genText({
                ...req.args,
                tools,
            });
        }
        else {
            throw new Error(`Unknown function ${req.function}`);
        }
    }

    async serveTextStreamResponse(req: { function: string; args: any }) {
        const convertedArgs = unsafeRecursiveJsonSchemaToZod(req.args);

        if (req.function.toLowerCase() === 'streamgenobject') {
            // Create a stream
            const stream = new ReadableStream({
                start: async (controller) => {
                    // Your string update callback will use this to send data
                    const sendData = (chunk: any) => controller.enqueue(chunk);

                    // const abortController = new AbortController();

                    const startUpdates = async () => {
                        try {
                            const jsonHelper = new JsonStreamHelper();

                            const result = await this.streamGenObject({
                                ...convertedArgs,
                                
                            });

                            for await (const partialObject of result.partialObjectStream) {
                                const chunk = jsonHelper.getNextChunk(partialObject);

                                if (chunk) {
                                    sendData(chunk);
                                }
                            }

                            const finalObject = await result.object;
                            
                            // Send the final chunk, noting that it is the last chunk.
                            sendData(jsonHelper.getNextChunk(finalObject, true));
                        }
                        catch (error) {
                            console.error('Error in streamRnagent', error);
                            throw error;
                        }
                        finally {
                            try {
                                controller.close();
                            }
                            catch (error) {
                                console.error('Error closing stream', error);
                            }
                        }
                    }

                    startUpdates();

                    // // Close the stream when done(e.g., on process completion)
                    // setTimeout(
                    //     () => {
                    //         if (!abortController.signal.aborted) {
                    //             abortController.abort();
                    //             controller.close();
                    //         }
                    //         // 5 min max stream timeout
                    //     },
                    //     5 * 60 * 1000);
                },
            });


            // Return the stream response
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                },
            });
        }
        else if (req.function.toLowerCase() === 'rnagent') {
            const THEAI = this;

            // Create a stream
            const stream = new ReadableStream({
                start: async (controller) => {
                    // Your string update callback will use this to send data
                    const sendData = (chunk: any) => controller.enqueue(chunk);

                    // const abortController = new AbortController();

                    const startUpdates = async () => {
                        try {
                            const jsonHelper = new JsonStreamHelper();

                            const { outputs } = await this.streamRnagent({
                                ...convertedArgs,
                                onPartialOutputs: (partialOutputs) => {
                                    const chunk = jsonHelper.getNextChunk(partialOutputs);

                                    if (chunk) {
                                        sendData(chunk);
                                    }
                                }
                            });

                            // Send the final chunk, noting that it is the last chunk.
                            sendData(jsonHelper.getNextChunk(outputs, true));
                        }
                        catch (error) {
                            console.error('Error in streamRnagent', error);
                            throw error;
                        }
                        finally {
                            try {
                                controller.close();
                            }
                            catch (error) {
                                console.error('Error closing stream', error);
                            }
                        }
                    }

                    startUpdates();

                    // // Close the stream when done(e.g., on process completion)
                    // setTimeout(
                    //     () => {
                    //         if (!abortController.signal.aborted) {
                    //             abortController.abort();
                    //             controller.close();
                    //         }
                    //         // 5 min max stream timeout
                    //     },
                    //     5 * 60 * 1000);
                },
            });


            // Return the stream response
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                },
            });
        }
        else if (req.function.toLowerCase() === 'streamsuggestednextmessages') {
            // Create a stream
            const stream = new ReadableStream({
                start: async (controller) => {
                    // Your string update callback will use this to send data
                    const sendData = (chunk: any) => controller.enqueue(chunk);

                    const startUpdates = async () => {
                        try {
                            const jsonHelper = new JsonStreamHelper();
                            
                            console.log('AI - streamSuggestedNextMessages request:', {
                                contextInjectors: convertedArgs.contextInjectors,
                                contextMessageRenderers: convertedArgs.contextMessageRenderers
                            });

                            const { suggestedUserMessages } = await this.streamSuggestedNextMessages({
                                ...convertedArgs,
                                onPartialSuggestions: (partialSuggestions) => {
                                    const chunk = jsonHelper.getNextChunk({ suggestedUserMessages: partialSuggestions });

                                    if (chunk) {
                                        sendData(chunk);
                                    }
                                }
                            });

                            // Send the final chunk, noting that it is the last chunk.
                            sendData(jsonHelper.getNextChunk({ suggestedUserMessages }, true));
                        }
                        catch (error) {
                            console.error('Error in streamSuggestedNextMessages', error);
                            throw error;
                        }
                        finally {
                            try {
                                controller.close();
                            }
                            catch (error) {
                                console.error('Error closing stream', error);
                            }
                        }
                    }

                    startUpdates();
                },
            });

            // Return the stream response
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                },
            });
        }
        else {
            throw new Error(`Unknown function ${req.function}`);
        }
    }

    /**
     * Suggests a skill based on user input and/or documents.
     * If documents are provided, the skill will be fully focused on those documents.
     * 
     * @param args - The arguments for suggesting a skill
     * @returns The suggested skill details
     */
    async suggestSkill(args: SuggestSkillArgs): Promise<SuggestSkillResult> {
        return suggestPartialSkill(this, args);
    }

    // async initialize() {
    //     // ... (other initializations)
    //     await this.audio.initialize();
    // }
}

export { AIContext };
