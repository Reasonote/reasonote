import {
  Attachment,
  CoreMessage,
  CoreTool,
  DeepPartial,
  generateObject,
  GenerateObjectResult,
  generateText,
  LanguageModel,
  ProviderMetadata,
  Schema,
  streamObject,
  StreamObjectResult,
  ToolInvocation,
} from 'ai';
import z from 'zod';

import { CtxInjectorRegistryWithUnknowns } from '@reasonote/core';

import {
  IPanel,
  PanelStub,
} from '../squads/Panel';

export * from '../squads/Panel';
export * from '../driverConfig';
// export * from '../vendor/vercel/ai/types';
export * from '../vendor/vercel/ai/zod';


export type LanguageModelTypeFromFunction = Parameters<typeof generateObject<any>>[0]['model'];

export type AISchema = Parameters<typeof streamObject<any>>[0]['schema'];

type UIMessage = {
    role: 'system' | 'user' | 'assistant' | 'function' | 'data' | 'tool';
    content: string;
    toolInvocations?: ToolInvocation[];
    experimental_attachments?: Attachment[];
};

type CallSettings = {
    /**
  Maximum number of tokens to generate.
     */
    maxTokens?: number;
    /**
  Temperature setting. This is a number between 0 (almost no randomness) and
  1 (very random).
  
  It is recommended to set either `temperature` or `topP`, but not both.
  
  @default 0
     */
    temperature?: number;
    /**
  Nucleus sampling. This is a number between 0 and 1.
  
  E.g. 0.1 would mean that only tokens with the top 10% probability mass
  are considered.
  
  It is recommended to set either `temperature` or `topP`, but not both.
     */
    topP?: number;
    /**
  Only sample from the top K options for each subsequent token.
  
  Used to remove "long tail" low probability responses.
  Recommended for advanced use cases only. You usually only need to use temperature.
     */
    topK?: number;
    /**
  Presence penalty setting. It affects the likelihood of the model to
  repeat information that is already in the prompt.
  
  The presence penalty is a number between -1 (increase repetition)
  and 1 (maximum penalty, decrease repetition). 0 means no penalty.
     */
    presencePenalty?: number;
    /**
  Frequency penalty setting. It affects the likelihood of the model
  to repeatedly use the same words or phrases.
  
  The frequency penalty is a number between -1 (increase repetition)
  and 1 (maximum penalty, decrease repetition). 0 means no penalty.
     */
    frequencyPenalty?: number;
    /**
  Stop sequences.
  If set, the model will stop generating text when one of the stop sequences is generated.
  Providers may have limits on the number of stop sequences.
     */
    stopSequences?: string[];
    /**
  The seed (integer) to use for random sampling. If set and supported
  by the model, calls will generate deterministic results.
     */
    seed?: number;
    /**
  Maximum number of retries. Set to 0 to disable retries.
  
  @default 2
     */
    maxRetries?: number;
    /**
  Abort signal.
     */
    abortSignal?: AbortSignal;
    /**
  Additional HTTP headers to be sent with the request.
  Only applicable for HTTP-based providers.
     */
    headers?: Record<string, string | undefined>;
};

type Prompt = {
    /**
  System message to include in the prompt. Can be used with `prompt` or `messages`.
     */
    system?: string;
    /**
  A simple text prompt. You can either use `prompt` or `messages` but not both.
   */
    prompt?: string;
    /**
  A list of messages. You can either use `prompt` or `messages` but not both.
     */
    messages?: Array<CoreMessage> | Array<UIMessage>;
};

export type GenerateObjectSchema<OBJECT> = z.Schema<OBJECT, z.ZodTypeDef, any> | Schema<OBJECT>;

export type GenerateObjectArgs<OBJECT> = Omit<CallSettings, "stopSequences"> & Prompt & {
    output?: 'object' | undefined;
    /**
    The language model to use.
   */
    model: LanguageModel;
    /**
The schema of the object that the model should generate.
   */
    schema: z.Schema<OBJECT, z.ZodTypeDef, any> | Schema<OBJECT>;
    /**
Optional name of the output that should be generated.
Used by some providers for additional LLM guidance, e.g.
via tool or schema name.
   */
    schemaName?: string;
    /**
Optional description of the output that should be generated.
Used by some providers for additional LLM guidance, e.g.
via tool or schema description.
   */
    schemaDescription?: string;
    /**
The mode to use for object generation.

The schema is converted into a JSON schema and used in one of the following ways

- 'auto': The provider will choose the best mode for the model.
- 'tool': A tool with the JSON schema as parameters is provided and the provider is instructed to use it.
- 'json': The JSON schema and an instruction are injected into the prompt. If the provider supports JSON mode, it is enabled. If the provider supports JSON grammars, the grammar is used.

Please note that most providers do not support all modes.

Default and recommended: 'auto' (best mode for the model).
   */
    mode?: 'auto' | 'json' | 'tool';
    /**
Optional telemetry configuration (experimental).
     */
    experimental_telemetry?: any;
    /**
Additional provider-specific metadata. They are passed through
to the provider from the AI SDK and enable provider-specific
functionality that can be fully encapsulated in the provider.
*/
    experimental_providerMetadata?: ProviderMetadata;
    /**
     * Internal. For test use only. May change without notice.
     */
    _internal?: {
        generateId?: () => string;
        currentDate?: () => Date;
    };
}

/**
 * This is the pure genObject arguments with fully defined models.
 */
export type GenObjectArgs<T> = Omit<GenerateObjectArgs<T>, 'model'> & {
    model?: LanguageModelTypeFromFunction,

    models?: LanguageModelTypeFromFunction[],

    /**
     * The name of the function, helps the AI understand what it's outputting.
     */
    functionName?: string;

    /**
     * Thinking config.
     */
    thinking?: AIThinkingConfig,

    /**
     * The description of the function, helps the AI understand what it's outputting.
     */
    functionDescription?: string;

    /**
     * The maximum number of feedback loops that can occur before returning.
     */
    maxFeedbackLoops?: number;

    /**
     * Which LLM to use for feedback.
     */
    feedbackModel?: LanguageModelTypeFromFunction,

    /**
     * Which LLMs to use for feedback
     */
    feedbackModels?: LanguageModelTypeFromFunction[],

    /**
     * The prompt which will be given to the feedback model.
     */
    feedbackPrompt?: string,

    /**
     * The messages to inject into the context.
     */
    ctxMessages?: CoreMessage[],
}

/**
 * Args that can be passed to ai.genObject.
 * 
 * This is the same as GenObjectArgs, but with model and models possible as strings.
 */
export type AIGenObjectArgs<T> = Omit<GenObjectArgs<T>, 'model' | 'models' | 'mode' | 'feedbackModel' | 'feedbackModels'> & {
    /**
     * The model to use for the generation.
     * Either LanguageModel or a string like '[PROVIDER]:[TAG]' e.g. 'openai:fastest'.
     */
    model?: LanguageModelTypeFromFunction | string,

    /**
     * The mode to use for the generation.
     * 
     */
    mode?: GenObjectArgs<T>['mode'],

    /**
     * The models to use for the generation.
     * A list of either LanguageModels or a strings like '[PROVIDER]:[TAG]' e.g. 'openai:fastest'.
     */
    models?: LanguageModelTypeFromFunction[] | string[],

    /**
     * Which LLM to use for feedback.
     * Either LanguageModel or a string like '[PROVIDER]:[TAG]' e.g. 'openai:fastest'.
     */
    feedbackModel?: LanguageModelTypeFromFunction | string,

    /**
     * Which LLMs to use for feedback
     * A list of either LanguageModels or a strings like '[PROVIDER]:[TAG]' e.g. 'openai:fastest'.
     */
    feedbackModels?: LanguageModelTypeFromFunction[] | string[],

    /**
     * Additional provider-specific metadata. They are passed through
     * to the provider from the AI SDK and enable provider-specific
     * functionality that can be fully encapsulated in the provider.
     */
    providerArgs?: any,


    /**
     * The context injectors to use for this generation.
     * 
     * May be one of the registered injectors, or a custom injector that is not in the type registry.
     */
    ctxInjectors?: CtxInjectorRegistryWithUnknowns

    /**
     * If provided, the model will be picked prioritized on the speed / quality / balance tradeoff.
     */
    modelPicking?: 'speed' | 'quality' | 'balance';
}

export type GenObjectResult<T, THINKING = any> = GenerateObjectResult<T> & {
    thinking?: THINKING;
}

export type AIGenObject<T, THINKING = any> = (args: AIGenObjectArgs<T>) => Promise<GenObjectResult<T, THINKING>>;

export type AIThinkingConfig = {
  /**
   * The schema of the object that the model should generate during its thinking process.
   */
  schema: AISchema,
}

//////////////////////////////////////////////////////
// STREAM
//////////////////////////////////////////////////////
/**
 * This is the pure genObject arguments with fully defined models.
 */
export type StreamGenObjectArgs<T> = Omit<Parameters<typeof streamObject<T>>[0], 'model'> & {
    model: LanguageModelTypeFromFunction,

    /**
     * The maximum number of feedback loops that can occur before returning.
     */
    maxFeedbackLoops?: number;

    /**
     * If true, the model will think about the problem before generating the object.
     */
    thinking?: AIThinkingConfig,

    /**
     * Which LLM to use for feedback.
     */
    feedbackModel?: LanguageModelTypeFromFunction,

    /**
     * Which LLMs to use for feedback
     */
    feedbackModels?: LanguageModelTypeFromFunction[],

    /**
     * The messages to inject into the context.
     */
    ctxMessages?: CoreMessage[],

    /**
     * The prompt which will be given to the feedback model.
     */
    feedbackPrompt?: string,

    /**
     * Before the model is called, the panel will be called to get suggested actions.
     */
    suggestionPanel?: IPanel<any>
}

export type StreamGenObject = (args: StreamGenObjectArgs<any>) => Promise<StreamGenObjectResult<any>>;

/**
 * Args that can be passed to ai.genObject.
 * 
 * This is the same as GenObjectArgs, but with model and models possible as strings.
 */
export type AIStreamGenObjectArgs<T> = Omit<StreamGenObjectArgs<T>, 'model' | 'models' | 'suggestionPanel' | 'output'> & {
    /**
     * For now, only 'object' is supported.
     */
    output?: 'object',

    /**
     * The model to use for the generation.
     * Either LanguageModel or a string like '[PROVIDER]:[TAG]' e.g. 'openai:fastest'.
     */
    model?: LanguageModelTypeFromFunction | string,

    /**
     * The context injectors to use for this generation.
     * 
     * May be one of the registered injectors, or a custom injector.
     */
    ctxInjectors?: CtxInjectorRegistryWithUnknowns

    /**
     * Additional provider-specific metadata. They are passed through
     * to the provider from the AI SDK and enable provider-specific
     * functionality that can be fully encapsulated in the provider.
     */
    providerArgs?: any,

    /**
     * The suggestion panel to use for the generation.
     */
    suggestionPanel?: PanelStub
}

/**
 * The result of ai.streamGenObject.
 */
export type StreamGenObjectResult<OBJECT, THINKING = any> = StreamObjectResult<DeepPartial<OBJECT>, OBJECT, never> & {
  /**
   * The thinking the model went through.
   */
  thinking?: THINKING;
}

export type AIStreamGenObjectResult<T, THINKING = any> = StreamGenObjectResult<T, THINKING>

export type AIStreamGenObject = (args: AIStreamGenObjectArgs<any>) => Promise<AIStreamGenObjectResult<any>>;

export type GenTextArgs<TOOLS extends Record<string, CoreTool<any, any>>> = Omit<Parameters<typeof generateText<TOOLS>>[0], 'model'> & {
    model?: LanguageModel,
    models?: LanguageModel[],
}

/**
 * Args that can be passed to ai.genText.
 * 
 * This is the same as GenTextArgs, but with model and models possible as strings.
 */
export type AIGenTextArgs<TOOLS extends Record<string, CoreTool<any, any>>> = Omit<GenTextArgs<TOOLS>, 'model' | 'models'> & {
    model?: LanguageModel | string,
    models?: LanguageModel[] | string[],
    /**
     * If provided, the model will be picked prioritized on the speed / quality / balanced tradeoff.
     */
    modelPicking?: 'speed' | 'quality' | 'balance';
}

export type GenTextResult<TOOLS extends Record<string, CoreTool<any, any>>> = Awaited<ReturnType<typeof generateText<TOOLS>>>;


/**
 * This was taken from Laminar library.
 */
type TraceType = 'DEFAULT' | 'EVENT' | 'EVALUATION';

/**
 * This was taken from Laminar library.
 */
export interface ObserveOptions {
  name?: string;
  sessionId?: string;
  userId?: string;
  traceType?: TraceType;
  spanType?: 'DEFAULT' | 'LLM';
  traceId?: string;
}

export interface AIGenerator {
    genObject: <T>(args: AIGenObjectArgs<T>) => Promise<GenObjectResult<T>>;
    streamGenObject: <T, THINKING = any>(args: AIStreamGenObjectArgs<T>) => Promise<AIStreamGenObjectResult<T, THINKING>>;
    
    /**
     * This signature was taken from Laminar library, and is used for tracing.
     */
    observe: <A extends unknown[], F extends (...args: A) => ReturnType<F>>({ name, sessionId, userId, traceType, spanType, traceId, }: ObserveOptions, fn: F, ...args: A) => Promise<ReturnType<F>>;
}