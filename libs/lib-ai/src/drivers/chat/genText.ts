import {
  CoreMessage,
  CoreTool,
  generateText,
} from 'ai';

import {
  GenTextArgs,
  GenTextResult,
} from '@reasonote/lib-ai-common';

import { consolidateMessages } from './genHelpers';

/**
 * Similar to Vercel AI SDK, but with some custom logic for the following:
 * (1) Has `fallbacks` which can be specified in the `rsn` object to try multiple models in order.
 */
export async function genText<TOOLS extends Record<string, CoreTool<any, any>>>(params: GenTextArgs<TOOLS>): Promise<GenTextResult<TOOLS>> {

    
    if (!params.model && !params.models) {
        throw new Error("Must specify either 'model' or 'models'");
    }

    if (params.model && params.models) {
        throw new Error("Cannot specify both 'model' and 'models'");
    }
    
    const allModels = params.models ? params.models : [params.model!];

    const messages = consolidateMessages({
        prompt: params.prompt,
        system: params.system,
        messages: params.messages as CoreMessage[],
        requiresUserMessage: params.model?.provider.startsWith('anthropic') ?? false,
    });
    
    const errors: any[] = [];
    
    for (let i = 0; i < allModels.length; i++) {
        const model = allModels[i];
        try {
            console.log(`(Try ${i+1}/${allModels.length}) Trying model ${model.modelId}`);
            
            console.log(`model.provider: ${model.provider}`);
            const requiresStubMessage = model.provider.startsWith('anthropic');

            // The first message after the system message is a user message.
            const usingMessages = requiresStubMessage ? [messages[0], {role: "user" as const, content: "[CHAT_START]"}, ...messages.slice(1)] : messages;

            const res = await generateText({
                ...params,
                system: undefined,
                prompt: undefined,
                messages: usingMessages as CoreMessage[],
                // Have to set the model we determined.
                model,
            }); 

            return res;
        } catch (error: any) {
            errors.push(error);
            console.error(`(Try ${i+1}/${allModels.length}) Model ${model} failed:`, error);
            
            if (i === allModels.length - 1) {
                console.error("All attempts failed");
                throw new Error("All genText attempts failed (failures: " + errors.map(e => `'${e.message}'`).join(", ") + ")");
            }
            else {
                console.error("Trying next model");
                continue;
            }
        }
    }

    throw new Error("Unreachable code -- all genText attempts failed");
}