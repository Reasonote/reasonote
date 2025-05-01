import {
  CoreMessage,
  LanguageModel,
} from 'ai';
import _ from 'lodash';

import { notEmpty } from '@lukebechtel/lab-ts-utils';
import { uuidv4 } from '@reasonote/lib-utils';

export function resolveModelModels(modelName: string, modelsName: string, model?: LanguageModel, models?: LanguageModel[], ): LanguageModel[] {
    if (!model && !models) {
        throw new Error(`Must specify either "${modelName}" or "${modelsName}"`);
    }

    return [model, ...(models ?? [])].filter(notEmpty);
}

// {
//     role: 'assistant',
//     content: [
//       {
//         type: 'tool-call',
//         toolCallId,
//         toolName: params.functionName ?? 'writeOutput',
//         args: result.object
//       }
//     ]
//   },
//   {
//     role: 'tool',
//     content: [
//       {
//         type: 'tool-result',
//         toolName: params.functionName ?? 'writeOutput',
//         toolCallId,
//         result: {success: true}
//       }
//     ]
//   }

export function toolCallFakeResult(toolCall: {toolCallId?: string, args: any, toolName?: string}) {
    return {
        type: 'tool-result' as const,
        toolName: toolCall.toolName ?? 'writeOutput',
        toolCallId: toolCall.toolCallId ?? uuidv4(),
        result: { success: true }
    };
}

export function toolCallFakeMessage(toolCall: {toolCallId?: string, args: any, toolName?: string}) {
    return {
        id: uuidv4(),
        role: 'tool' as const,
        content: [toolCallFakeResult(toolCall)]
    };
}

export function manyToolCallFakeMessage(toolCalls: {toolCallId?: string, args: any, toolName?: string}[]) {
    return {
        id: uuidv4(),
        role: 'tool' as const,
        content: toolCalls.map(toolCallFakeResult)
    };
}

export function getMessagesWithToolCallFaked(messages: (CoreMessage & {id: string})[], toolCall: {toolCallId?: string, args: any, toolName?: string}): (CoreMessage & {id: string})[] {
    return rewriteMessagesWithFakeToolCalls([
        ...messages,
        ...toolCallDefaultMessages(toolCall)
    ]);
}

export function rewriteMessagesWithFakeToolCalls<T extends CoreMessage>(messages: T[]): T[] {
    const result: (T | CoreMessage)[] = [];

    const toolCallIdsSeen = new Set<string>();

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        // If this is a tool message, ensure we've seen the corresponding assistant message before.
        // If not, clean it out.
        if (msg.role === 'tool'){
            result.push({
                ...msg,
                content: msg.content
                    .filter((part) => part.type === 'tool-result')
                    .filter((part) => toolCallIdsSeen.has(part.toolCallId))
            })
            continue;
        }

        if (msg.role !== 'assistant') {
            result.push(msg);
            continue;
        }

        if (_.isString(msg.content)) {
            result.push(msg);
            continue;
        }



        if (!msg.content.some((part) => part.type === 'tool-call')) {
            result.push(msg);
            continue;
        }


        // First push this message, which we know has tool calls.
        result.push(msg);

        // Add these to tool Calls we've seen
        msg.content.filter((part) => part.type === 'tool-call').map(t => (t as any).toolCallId)
            .map(toolCallId => toolCallIdsSeen.add(toolCallId));

        // TODO: Add a message that contains all the fake tool call results, for any one that hasn't yet been seen.
        const toolCallsToFake = msg.content
            .filter((part) => part.type === 'tool-call')
            .filter((part) => 
                !messages.slice(i + 1)
                    .some((m) => 
                        m.role === 'tool' && 
                        m.content.some(oldPart => (oldPart as any).toolCallId === (part as any).toolCallId)
                    )
            );
        if (toolCallsToFake.length > 0) {
            //@ts-ignore
            result.push(manyToolCallFakeMessage(toolCallsToFake));
        }
    }

    return result as T[];
}

export function toolCallDefaultMessages(toolCall: {toolCallId?: string, args: any, toolName?: string}, defaultToolCallName = 'json')  {
    const toolCallId = toolCall.toolCallId ?? uuidv4();
    const toolName = toolCall.toolName ?? defaultToolCallName;
    return [
        {
            id: uuidv4(),
            role: 'assistant' as const,
            content: [
                {
                    type: 'tool-call' as const,
                    toolCallId,
                    toolName,
                    args: toolCall.args
                }
            ]
        },
        toolCallFakeMessage({toolCallId, toolName, args: toolCall.args})
    ];
}

export function consolidateMessages({prompt, system, messages, requiresUserMessage, systemMessageDisabled, ctxMessages}: {prompt?: string, system?:string , messages?: CoreMessage[], requiresUserMessage?: boolean, systemMessageDisabled?: boolean, ctxMessages?: CoreMessage[]}): CoreMessage[] {
    const sysMessagesFromMessages = messages?.filter(m => m.role === 'system').map(m => m.content);

    const nonSysMessages = messages?.filter(m => m.role !== 'system') ?? [];

    // System
    // --------------------------------
    // SystemFromMessages
    // --------------------------------
    // Prompt
    const sysmsgString = [
        system,
        ...(sysMessagesFromMessages ?? []),
        prompt
    ].filter(notEmpty).join('\n\n--------------------------------\n\n');


    // Some models require a user message to be present.
    // If we don't have one, add one.
    if (requiresUserMessage && nonSysMessages.filter(m => m.role === 'user').length === 0){
        const lastMessage = messages?.[messages.length - 1];
        if (lastMessage?.role !== 'user'){
            nonSysMessages.push({
                role: 'user' as const,
                content: '[START]'
            })
        }
    }

    return [
        // System messages
        ...(sysmsgString && sysmsgString.trim().length > 0 ? [{
            role: systemMessageDisabled ? 'user' as const : 'system' as const,
            content: systemMessageDisabled ? 
                `<SYSTEM_PROMPT>
                    ${sysmsgString}
                </SYSTEM_PROMPT>` 
                : 
                sysmsgString
        }] : []),
        ...(ctxMessages ?? []),
        // We already handled system messages, so we can just add the rest.
        ...(nonSysMessages ?? [])
    ];
}