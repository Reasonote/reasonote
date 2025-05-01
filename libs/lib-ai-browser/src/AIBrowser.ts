import { CoreTool } from 'ai';
import z, { ZodTypeAny } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import {
  DeepPartial,
  isDeepEqualData,
  parsePartialJson,
} from '@ai-sdk/ui-utils';
import { typedUuidV4 } from '@lukebechtel/lab-ts-utils';
import {
  OneShotAIArgs,
  OneShotAIResponse,
} from '@reasonote/core';
import {
  AIGenObjectArgs,
  AIGenTextArgs,
  AIStreamGenObjectArgs,
  AIStreamRNAgentArgs,
  AIStreamSuggestedNextMessagesArgs,
  CoreMessageWithId,
  driverConfigToRegistryString,
  GenObjectResult,
  GenTextResult,
} from '@reasonote/lib-ai-common';
import {
  isJsonSchemaLike,
  recursiveZodToJsonSchema,
} from '@reasonote/lib-utils';

import { AIBrowserContext } from './AIBrowserContext';
import { isZodLikeSchema } from './types';

export type AIBrowserGenObjectArgs<T> = Omit<AIGenObjectArgs<T>, 'schema'> & {
    // Schema required here.
    schema: z.ZodSchema<T>;
}

export type AIBrowserStreamGenObjectArgs<T> = Omit<AIStreamGenObjectArgs<T>, 'schema'> & {
    // Schema required here.
    schema: z.ZodSchema<T>;

    /**
     * Will be called with partial object as soon as it is available.
     */
    onPartialObject?: (data: DeepPartial<T>) => void;

    /**
     * Will be called with the final object or error if the object is not valid.
     */
    onFinish?: (res: {object: T, error: any | null} | {object?: undefined | null, error: any}) => void;
}

// TODO: improve types
export type AIBrowserRNAgentStreamArgs = AIStreamRNAgentArgs & {
    onPartialResponse?: (partialResponse: DeepPartial<CoreMessageWithId>[]) => void;
    onFinish?: (res: {object: any, error: any | null} | {object?: undefined | null, error: any}) => void;
}

export type AIBrowserStreamGenObjectCustomArgs<T> = {
    model: any;
    schema: z.ZodSchema<T>;
}

export type AIBrowserGenTextArgs<TOOLS extends Record<string, CoreTool<any, any>>> = Omit<AIGenTextArgs<TOOLS>, 'tools'> & {
    // Tools required here.
    tools?: Record<string, {
        description: string;
        parameters: z.ZodSchema;
    }>
}

export type AIBrowserSuggestedNextMessagesArgs = AIStreamSuggestedNextMessagesArgs & {
    onPartialSuggestions?: (partialSuggestions: DeepPartial<{content: string}[]>) => void;
    onFinish?: (res: {object: {content: string}[], error: any | null} | {object?: undefined | null, error: any}) => void;
}

export class AIBrowser {
    instId = typedUuidV4('AIBrowser');
    constructor(readonly ctx: AIBrowserContext){}

    async oneShotAI<T extends ZodTypeAny>(params: OneShotAIArgs<T>): Promise<OneShotAIResponse<T>> {
        const _params = params;
      
        const driverConfig = _params.driverConfig;
      
        if (typeof window === "undefined") {
          throw new Error("oneShotAIClient is only available in the browser");
        }
      
        try {
          const res = await this.genObject({
            system: _params.systemMessage,
            functionName: _params.functionName,
            functionDescription: _params.functionDescription,
            messages: _params.otherMessages,
            schema: _params.functionParameters,
            model: driverConfig ? driverConfigToRegistryString(driverConfig) : undefined,
          })
      
          return {
            success: true,
            data: res.object
          }
        }
        catch (e) {
          return {
            success: false,
            error: e
          }
        };
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
     * @returns A promise that resolves to an object containing the generated result
     */
    async streamGenObject<T>(args: AIBrowserStreamGenObjectArgs<T>): Promise<{object: T}> {
        const hostUrl = this.ctx.hostUrlTextStream;
        if (hostUrl == null) {
            throw new Error('`hostUrlTextStream` is not set. Please set `hostUrlTextStream` in the AIBrowserContext.');
        }
        
        if (!isZodLikeSchema(args.schema) && !isJsonSchemaLike(args.schema)) {
            throw new Error('Schema must be a Zod schema or JsonSchema object');
        }

        // console.log('ARGS', JSON.stringify(args, null, 2));

        /**
         * Any zod schemas we convert to jsonschema for transit.
         */
        const argsConverted = recursiveZodToJsonSchema(args);

        // TODO: we must call our host url with the stream.
        const abortController = new AbortController();
        const response = await this.ctx.fetch(hostUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
                function: 'streamGenObject',
                args: argsConverted
            })
        })

        if (!response.ok) {
            throw new Error(
                (await response.text()) ?? 'Failed to fetch the response.',
            );
        }

        if (response.body == null) {
            throw new Error('The response body is empty.');
        }

        let accumulatedText = '';
        let latestObject: DeepPartial<T> | undefined = undefined;

        let finalParsedResult: T | undefined = undefined;
        let finalError: any | undefined = undefined;

        try {
            await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
                new WritableStream<string>({
                    write(chunk) {
                        accumulatedText += chunk;

                        const parseResult = parsePartialJson(
                            accumulatedText,
                        );

                        const currentObject = parseResult.value as DeepPartial<T>;
        
                        if (!isDeepEqualData(latestObject, currentObject)) {
                            latestObject = currentObject;
        
                            args.onPartialObject?.(currentObject);
                        }
                    },
        
                    close() {
                        // if (args.onFinish != null) {
                        //     const validationResult = args.schema.safeParse(latestObject);
                        //     args.onFinish(
                        //         validationResult.success
                        //         ? { object: validationResult.data, error: undefined }
                        //         : { object: undefined, error: validationResult.error },
                        //     );
                        // }
                    },
                }),
            );
        }
        catch (e) {
            abortController.abort();
            throw e;
        } finally {
                const validationResult = args.schema.safeParse(latestObject);
                
                args.onFinish?.(
                    validationResult.success
                    ? { object: validationResult.data, error: undefined }
                    : { object: undefined, error: validationResult.error },
                );

                if (validationResult.success) {
                    finalParsedResult = validationResult.data;
                }
                else {
                    finalError = validationResult.error;
                    console.log('validationResult.error', validationResult.error)
                }
        }

        if (finalParsedResult == null) {
            throw new Error(`Failed to parse the response. (Error: ${finalError?.toString() ?? 'unknown'})`);
        }

        return {
            object: finalParsedResult,
        }
    }

    async RNAgentStream(args: AIBrowserRNAgentStreamArgs): Promise<{object: CoreMessageWithId[]}> {
        const hostUrl = this.ctx.hostUrlTextStream;
        if (hostUrl == null) {
            throw new Error('`hostUrlTextStream` is not set. Please set `hostUrlTextStream` in the AIBrowserContext.');
        }
        
        // if (!isZodLikeSchema(args.schema) && !isJsonSchemaLike(args.schema)) {
        //     throw new Error('Schema must be a Zod schema or JsonSchema object');
        // }

        /**
         * Any zod schemas we convert to jsonschema for transit.
         */
        // const argsConverted = recursiveZodToJsonSchema(args);


        const abortController = new AbortController();
        const response = await this.ctx.fetch(hostUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
                function: 'rnagent',
                args
            })
        })

        if (!response.ok) {
            throw new Error(
                (await response.text()) ?? 'Failed to fetch the response.',
            );
        }

        if (response.body == null) {
            throw new Error('The response body is empty.');
        }

        let accumulatedText = '';
        let latestObject: CoreMessageWithId[] | undefined = undefined;

        let finalParsedResult: CoreMessageWithId[] | undefined = undefined;
        let finalError: any | undefined = undefined;

        try {
            await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
                new WritableStream<string>({
                    write(chunk) {
                        accumulatedText += chunk;

                        const parseResult = parsePartialJson(
                            accumulatedText,
                        );

                        const currentObject = parseResult.value as CoreMessageWithId[];
   
                        if (!isDeepEqualData(latestObject, currentObject)) {
                            latestObject = currentObject;
        
                            args.onPartialResponse?.(currentObject as any);
                        }
                    },
        
                    close() {
                        // if (args.onFinish != null) {
                        //     const validationResult = args.schema.safeParse(latestObject);
                        //     args.onFinish(
                        //         validationResult.success
                        //         ? { object: validationResult.data, error: undefined }
                        //         : { object: undefined, error: validationResult.error },
                        //     );
                        // }
                    },
                }),
            );
        }
        catch (e) {
            abortController.abort();
            throw e;
        } finally {
                // const validationResult = args.schema.safeParse(latestObject);
                
                // args.onFinish?.(
                //     validationResult.success
                //     ? { object: validationResult.data, error: undefined }
                //     : { object: undefined, error: validationResult.error },
                // );

                // console.log('latestObject', latestObject)

                finalParsedResult = latestObject;
                args.onFinish?.({
                    object: latestObject,
                    error: finalError
                })
        }

        if (finalParsedResult == null) {
            throw new Error(`Failed to parse the response. (Error: ${finalError?.toString() ?? 'unknown'})`);
        }

        return {
            object: finalParsedResult,
        }
    }

    async streamSuggestedNextMessages(args: AIBrowserSuggestedNextMessagesArgs): Promise<{object: {content: string}[]}> {
        const hostUrl = this.ctx.hostUrlTextStream;
        if (hostUrl == null) {
            throw new Error('`hostUrlTextStream` is not set. Please set `hostUrlTextStream` in the AIBrowserContext.');
        }

        console.log('AIBrowser - streamSuggestedNextMessages args:', {
            contextInjectors: args.contextInjectors,
            contextMessageRenderers: args.contextMessageRenderers
        });

        const abortController = new AbortController();
        const response = await this.ctx.fetch(hostUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
                function: 'streamSuggestedNextMessages',
                args
            })
        });

        if (!response.ok) {
            throw new Error(
                (await response.text()) ?? 'Failed to fetch the response.',
            );
        }

        if (response.body == null) {
            throw new Error('The response body is empty.');
        }

        let accumulatedText = '';
        let latestObject: any = undefined;

        let finalParsedResult: {content: string}[] | undefined = undefined;
        let finalError: any | undefined = undefined;

        try {
            await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
                new WritableStream<string>({
                    write(chunk) {
                        accumulatedText += chunk;

                        const parseResult = parsePartialJson(
                            accumulatedText,
                        );

                        const currentObject = parseResult.value as any;
        
                        if (!isDeepEqualData(latestObject, currentObject)) {
                            latestObject = currentObject;
        
                            if (currentObject && currentObject.suggestedUserMessages) {
                                args.onPartialSuggestions?.(currentObject.suggestedUserMessages as DeepPartial<{content: string}[]>);
                            }
                        }
                    },
        
                    close() {
                        // Handle close if needed
                    },
                }),
            );
        }
        catch (e) {
            abortController.abort();
            throw e;
        } finally {
            if (latestObject?.suggestedUserMessages) {
                finalParsedResult = latestObject.suggestedUserMessages as {content: string}[];
                
                args.onFinish?.({
                    object: finalParsedResult,
                    error: null
                });
            } else {
                finalError = new Error('Failed to parse the response');
                args.onFinish?.({
                    object: undefined,
                    error: finalError
                });
            }
        }

        if (finalParsedResult == null) {
            throw new Error(`Failed to parse the response. (Error: ${finalError?.toString() ?? 'unknown'})`);
        }

        return {
            object: finalParsedResult,
        };
    }

    /**
     * TODO: This function should be able to support custom Stream endpoints which are streaming back objects.
     * 
     * The main diff from streamGenObject is:
     * (1) The Schema for the Input schema and the Output schema are specified by the Route...
     * (2) You can pass all args to streamGenObject, which will be used for all nested streamGenObject calls, except for schema...
     * 
     */
    async streamCustomObject<TOut>({
        routeUrl,
        args,
        onPartialObject,
        onFinish,
        headers,
    }: {
        // What endpoint to call.
        routeUrl: string,

        // The arguments to the route
        args: any & {
            /**
             * Additional args which will be passed through to streamGenObject calls.
             * 
             * NOTE: it is up to route designers to respect these parameters.
             */
            streamGenObjectArgs?: Omit<AIBrowserStreamGenObjectArgs<any>, 'schema'>,
        },

        /**
         * Will be called with partial object as soon as it is available.
         */
        onPartialObject?: (data: DeepPartial<TOut>) => void;

        /**
         * Will be called with the final object or error if the object is not valid.
         */
        onFinish?: (res: {object: TOut, error: any | null} | {object?: undefined | null, error: any}) => void;

        headers?: Record<string, string>;
    }){
        /**
         * Any zod schemas we convert to jsonschema for transit.
         */
        const argsConverted = recursiveZodToJsonSchema(args);

        const abortController = new AbortController();
        const response = await this.ctx.fetch(routeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            signal: abortController.signal,
            body: JSON.stringify(argsConverted)
        });

        if (!response.ok) {
            throw new Error(
                (await response.text()) ?? 'Failed to fetch the response.',
            );
        }

        if (response.body == null) {
            throw new Error('The response body is empty.');
        }

        let accumulatedText = '';
        let latestObject: DeepPartial<TOut> | undefined = undefined;

        let finalParsedResult: TOut | undefined = undefined;
        let finalError: any | undefined = undefined;

        try {
            await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
                new WritableStream<string>({
                    write(chunk) {
                        accumulatedText += chunk;

                        console.log('CHUNK', chunk)
        
                        const currentObject = (parsePartialJson(
                            accumulatedText,
                        ) as DeepPartial<TOut>)?.value;

                        
        
                        if (!isDeepEqualData(latestObject, currentObject)) {
                            latestObject = currentObject;
        
                            onPartialObject?.(currentObject);
                        }
                    },
        
                    close() {
                        // This is handled by finally block.
                    },
                }),
            );
        }
        catch (e) {
            abortController.abort();
            throw e;
        } finally {
            onFinish?.(
                {
                    object: latestObject,
                    error: finalError
                }
            )
            finalParsedResult = latestObject;
        }

        return {
            object: finalParsedResult,
        } 
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
    async genObject<T>(args: AIBrowserGenObjectArgs<T>): Promise<GenObjectResult<T>> { 
        if (!isZodLikeSchema(args.schema)) {
            throw new Error('Schema must be a Zod schema');
        }
    
        const argsConverted = recursiveZodToJsonSchema(args);
        
        // Fetch the endpoint
        const resp = await this.ctx.fetch(this.ctx.hostUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function: 'genObject',
                args: argsConverted
            })
        })

        // Parse the response
        const res = await resp.json() as GenObjectResult<T>;

        return res;
    }

    async genText<TOOLS extends Record<string, CoreTool<any, any>>>(args: AIBrowserGenTextArgs<TOOLS>): Promise<GenTextResult<TOOLS>> {
        // All the tool-calls must be converted into wire-transferable format
        const convertedTools = Object.fromEntries(Object.entries(args.tools ?? [])?.map(([name, tool]) => {
            if (!isZodLikeSchema(tool.parameters)) {
                throw new Error(`Tool '${name}' parameters must be a Zod schema`);
            }

            const convertedSchema = zodToJsonSchema(tool.parameters as any);

            return [
                name,
                {
                    description: tool.description,
                    parameters: convertedSchema
                }
            ]
        }));


        // Fetch the endpoint
        const resp = await this.ctx.fetch(this.ctx.hostUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function: 'genText',
                args: {
                    ...args,
                    tools: convertedTools
                }
            })
        })

        // Parse the response
        const res = await resp.json() as GenTextResult<TOOLS>;

        return res;
    }
}