import {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
} from 'ai';

import { CtxInjectorRegistryWithUnknowns } from '@reasonote/core';
import {
  LanguageModelTypeFromFunction,
  StreamGenObjectArgs,
} from '@reasonote/lib-ai-common';

import { RNAgentCMRInvokeConfig } from './RNAgentCMR';
import { RNAgentToolInvokeConfig } from './RNAgentTool';

export type RNCoreContextMessage = {
  role: 'context';
  contextId: string;
  contextType: string;
  contextData?: any;
}

export type CoreMessageWithId = CoreMessage & {id: string, complete?: boolean};
export type CoreToolMessageWithId = CoreToolMessage & {id: string, complete?: boolean};
export type CoreAssistantMessageWithId = CoreAssistantMessage & {id: string, complete?: boolean};

export type RNCoreMessage = CoreMessage | RNCoreContextMessage;

export type RNAgentGenArgs = Partial<StreamGenObjectArgs<{[key: string]: any}>> & {
    model: LanguageModelTypeFromFunction
    /**
     * Additional provider-specific metadata. They are passed through
     * to the provider from the AI SDK and enable provider-specific
     * functionality that can be fully encapsulated in the provider.
     */
    providerArgs?: any
}


export type RNAgentExecOrderEntry = {
    outputs: RNAgentExecOrderEntryOutput[]
}

export type RNAgentExecOrderEntryOutputMessage = {
    type: 'message'
    optional?: boolean
    description?: string
}

export type RNAgentExecOrderEntryOutputToolCall = {
    type: 'tool_call'
    toolName: string,
    optional?: boolean
    description?: string
}

export type RNAgentExecOrderEntryOutput = RNAgentExecOrderEntryOutputMessage | RNAgentExecOrderEntryOutputToolCall;

export interface RNAgentInvokeBaseArgs {
    /**
     * Settings to override on streamGenObject.
     */
    genArgs: RNAgentGenArgs

    /**
     * The order in which the agent should execute each subsection of its configured capabilities.
     * 
     * This allows you to do things like:
     * - Force a tool call before any response
     * - Force a message before any other response type
     * - Force X tool calls before first message output
     * - Force "message", "tool-1", "message" as output
     */
    execOrder?: RNAgentExecOrderEntry[]

    /**
     * In 'array' mode, tool calls will be shown to the ai as an array of tool calls.
     * 
     * In 'object' mode, tool calls will be shown to the ai as an object, with keys being the tool name and values being the tool args.
     */
    toolMode?: 'array' | 'object'

    /**
     * What chat id this is for.
     */
    chatId: string;

    /**
     * The messages in the chat.
     */
    messages: RNCoreMessage[];
    
    /**
     * System prompt
     */
    system?: string;

    /**
     * Tools that the agent can use.
     * 
     * NOTE: these may not be tools in the traditional "agent tools" sense.
     * These are essentially capabilities that can be composed together.
     * 
     * Some capabilities may not be able to be used together, and some may be able to be used together.
     */
    tools?: RNAgentToolInvokeConfig<any>[];

    /**
     * Context injectors that will be used to inject context into the AI.
     */
    contextInjectors?: CtxInjectorRegistryWithUnknowns; 

    /**
     * These will render context messages of different types for the AI.
     * 
     * They can be used to inject temporally-relevant context into the AI.
     * 
     * For instance, if the user is viewing a lesson, we can inject a `user_viewing_lesson` message, then we could inject a `user_completed_lesson` message if they complete the lesson.
     * 
     * This helps the AI keep track of the user's progress over time.
     */
    contextMessageRenderers?: RNAgentCMRInvokeConfig[];
}

export type RNAgentOutputMessage = {id: string, type: 'message', message: string};

export type RNAgentOutputToolCall = {id: string, type: 'tool_call', toolName: string, args: any};

export type RNAgentOutputToolResult = {id: string, type: 'tool_result', toolId: string, toolName: string, result: any};

export type RNAgentOutput = RNAgentOutputMessage | RNAgentOutputToolCall | RNAgentOutputToolResult;

export type RNAgentStreamResult<T extends CoreMessage[] = CoreMessage[]> = {
    outputs: T,
    error?: Error
}

export interface RNAgentStreamArgs extends RNAgentInvokeBaseArgs {  
    /**
     * This is called whenever the agent has new outputs to send to the user.
     * 
     * @param outputs The outputs to send to the user.
     */
    onPartialOutputs?: (partialOutputs: (CoreAssistantMessageWithId | CoreToolMessageWithId)[]) => void;
}

///////////////////////////////////////////////////////////////
// AI Impl

// Allow model to be a string or a LanguageModelTypeFromFunction
export type AIStreamRNAgentArgs = Omit<RNAgentStreamArgs, 'genArgs'> & {
    genArgs: Omit<RNAgentGenArgs, 'model'> & {model: string | LanguageModelTypeFromFunction}
}

export type AIStreamRNAgentResult<T extends any[] = any[]> = RNAgentStreamResult<T> & {
    // TODO: Add any other metadata we want to return.
}

export type RNAgentSuggestedNextMessagesResult = {
    suggestedUserMessages: {content: string}[],
    error?: Error
}

export interface RNAgentSuggestedNextMessagesArgs extends RNAgentInvokeBaseArgs {  
    /**
     * This is called whenever the agent has new suggested messages to send to the user.
     * 
     * @param suggestedMessages The suggested messages to show to the user.
     */
    onPartialSuggestions?: (partialSuggestions: {content: string}[]) => void;
}

///////////////////////////////////////////////////////////////
// AI Impl

export type AIStreamSuggestedNextMessagesArgs = Omit<RNAgentSuggestedNextMessagesArgs, 'genArgs'> & {
    genArgs: Omit<RNAgentGenArgs, 'model'> & {model: string | LanguageModelTypeFromFunction}
}

export type AIStreamSuggestedNextMessagesResult = RNAgentSuggestedNextMessagesResult & {
    // TODO: Add any other metadata we want to return.
}
