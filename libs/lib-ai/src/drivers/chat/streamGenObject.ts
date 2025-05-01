import {
  CoreMessage,
  jsonSchema,
  streamObject,
} from 'ai';

import { observe } from '@lmnr-ai/lmnr';
import {
  StreamGenObjectArgs,
  StreamGenObjectResult,
} from '@reasonote/lib-ai-common';

import {
  consolidateMessages,
  rewriteMessagesWithFakeToolCalls,
} from './genHelpers';
import { convertToFinalSchema } from './thinkingSchema';

async function* processStream<T, U>(
    stream: AsyncIterable<T>,
    processor: (chunk: T) => Promise<U> | U
): AsyncIterable<U> {
    for await (const chunk of stream) {
      yield await processor(chunk);
    }
}

/**
 * 
 * 
 * All calls use the tool name "json" for writing output.
 * @param params 
 * @returns 
 */
export async function streamGenObject<T>(params: StreamGenObjectArgs<T>): Promise<StreamGenObjectResult<T>> {
    const consolidatedMessages = consolidateMessages({
        prompt: params.prompt,
        system: params.system,
        // TODO: UIMessage
        //@ts-ignore
        messages: params.messages,
        requiresUserMessage: params.model?.provider.startsWith('anthropic') ?? false,
        ctxMessages: params.ctxMessages,
        // TODO: hacky
        systemMessageDisabled: params.model?.modelId.startsWith('o1') && JSON.stringify(params.model).toLowerCase().includes('openai'),
    });

    var messages: CoreMessage[] = consolidatedMessages;

    var messages = rewriteMessagesWithFakeToolCalls(consolidatedMessages);

    // console.log('MESSAGES AFTER REWRITE', JSON.stringify({messages}, null, 2));

    const isThinking = params.thinking !== undefined;
    const thinkingSchema = isThinking ? params.thinking?.schema : undefined;

    const finalSchema = jsonSchema(convertToFinalSchema(params.schema, thinkingSchema));

    const originalRet = await observe({
        name: 'streamGenObject.streamObject',   
    }, async ({params}) => {
        //@ts-ignore
        return streamObject({
            ...params,
            output: 'object',
            //@ts-ignore
            // thinking: undefined,
            //@ts-ignore
            schema: finalSchema,
            // We consolidate prompt and system into messages,
            // So we remove them from the params.
            prompt: undefined,
            system: undefined,
            messages,
            //@ts-ignore
            experimental_telemetry: {
                isEnabled: true
            },
            onError: (error) => {
                console.error('streamGenObject error', error);
            }
        });
    }, {
        params,
    })
    

    async function processPartialObjectStream<T>(chunk: any): Promise<T> {
        // If we're thinking, we must skip the thinking parameter and only return the result.
        return isThinking ? chunk.result : chunk;
    }


    const newPartialObjectStream = processStream(await originalRet.partialObjectStream, processPartialObjectStream);
    
    const newObjectPromise = (async () => {
        const object = await originalRet.object;
 
        if (!object) return null;

        return isThinking ? 
            //@ts-ignore
            {...object.result}
            : 
            object;
    })()

    const newThinkingPromise = (async () => {
        const thinking = ((await originalRet.object) as any).thinking;
        return isThinking ? {...thinking} : undefined;
    })()

    // DEBUGGIN
    // const finalObject = await originalRet.object;
    // console.log('FINAL OBJECT', JSON.stringify({finalObject}, null, 2));

    // Create a new object with all the original properties
    const result: StreamGenObjectResult<T> = {
        ...originalRet,
        
        // Transform the object method
        object: newObjectPromise,

        thinking: newThinkingPromise,

        // Create a clean implementation of partialObjectStream
        //@ts-ignore
        partialObjectStream: newPartialObjectStream,
    };
    
    return result;

    // WE map all properties through, except:
    // - partialObjectStream
    // - object
}