import _ from 'lodash';
import { z } from 'zod';

import {
  AIStreamGenObjectArgs,
  StreamGenObjectResult,
} from '@reasonote/lib-ai-common';

import { ChatInputFormatter } from './ChatInputFormatter/ChatInputFormatter';
import { ChatRunnerCompleteRequest } from './ChatRunner.interface';

interface ChatStreamOutputBase {
    type: string;
    isComplete: boolean;
}

/**
 * This is responsible for running chats and doing bookkeeping related to that.
 */
export class ChatRunner {
    // This should be an AI instance, but circular imports are being weird.
    constructor(readonly ai: any){}

    inFormatter = new ChatInputFormatter(this.ai);


    streamGenObject<T>(args: AIStreamGenObjectArgs<T>): Promise<StreamGenObjectResult<T>> {
        return this.ai.streamGenObject(args);
    }

    async upsertContext({chatId, contextType, contextId, contextData}: {chatId: string, contextType: string, contextId: string, contextData?: any}){
        // First, query the chatMessages to see if there's anything that matches everything.
        const chatMsgResp = await this.ai.sb.from('chat_message').select('*')
            .eq('chat_id', chatId)
            .eq('context_type', contextType)
            .eq('context_id', contextId)
            .eq('context_data', JSON.stringify(contextData))
        
        const chatMessages = chatMsgResp.data;

        if (chatMsgResp.error){
            console.log('Error checking for chat message.')
            throw chatMsgResp.error;
        } else if (chatMessages && chatMessages.length > 0) {
            // If there's a match, we don't need to do anything.
            return chatMessages;
        }
        else {
            // If there's no match, we need to insert a new message.
            const chatMsgResp = await this.ai.sb.from('chat_message').insert({
                _role: 'system',
                chat_id: chatId,
                context_data: contextData,
                context_id: contextId,
                context_type: contextType,
            }).select('*').single();

            if (chatMsgResp.error){
                throw chatMsgResp.error;
            }
            else {
                return [chatMsgResp.data];
            }
        }
    }

    async chooseBotId(request: ChatRunnerCompleteRequest){
        const {chatId, botId} = request;

        if (botId){
            return botId;
        }

        const memberAuthsResp = await this.ai.sb.from('member_authorization')
            .select('*')
            .eq('granted_chat_id', chatId);
        
        return memberAuthsResp.data?.filter((ma: any) => ma.bot_id)?.[0]?.bot_id ?? 'bot_01010101-0101-0101-0101-010134501073';
    }

    // async suggestUserMessages(request: ChatRunnerCompleteRequest){
    //     const {chatId} = request;

    //     const usingBotId = await this.chooseBotId(request);

    //     //////////////////////////////////////////////////////////////
    //     // FETCH CONTEXT
    //     const msgs = await this.inFormatter.format({
    //         ...request,
    //         botId: usingBotId,
    //     });       

    //     // console.log(JSON.stringify({msgs}, null, 2))

    //     //////////////////////////////////////////////////////////////
    //     // 4. GENERATE RESPONSE
    //     // Generate a response to the thread.
    //     const resp = await this.ai.tools.oneShotAI({
    //         systemMessage: 'You should suggest a next message that the user could send the following turn.',
    //         functionName: 'suggest_user_messages',
    //         functionDescription: 'Suggest a message that the user could send next.',
    //         functionParameters: z.object({
    //             suggestedUserNextMessages: z.array(z.string()).describe('Messages the user could send to help them achieve their goal.'),
    //         }),
    //         otherMessages: msgs.map(RESIChatMessageToVercelMessage)
    //     })

    //     return resp;
    // }

    async complete(request: ChatRunnerCompleteRequest) {
        const {chatId, botId} = request;

        const usingBotId = await this.chooseBotId(request);

        //////////////////////////////////////////////////////////////
        // FETCH CONTEXT
        const msgs = await this.inFormatter.format({
            ...request,
            botId: usingBotId,
        });       

        // console.log(JSON.stringify({msgs}, null, 2))

        // TODO:Chat completion should include a "available tools" matchmaking system
        // Where the placement of the chat, and the user's preferences for the chat, allow the tools that are possible.
        // There should also be a pre-scanner that only makes certain types of tools available 

        //////////////////////////////////////////////////////////////
        // 4. GENERATE RESPONSE
        // Generate a response to the thread.
        const resp = await this.ai.ctx.aiDriver.chat.complete({
            messages: msgs,
            // TODO: dirty, type issue.
            driverConfig: request.driverConfig as any,
            // TODO: place the tools here
            // functions: [{
            //     name: 'Create',
            //     description: ''
            //     parameters: {

            //     }
            // }]
        })

        const firstMessageChoice = resp.choices[0]?.message;

        if (!firstMessageChoice){
            throw new Error('No message choice found in aiDriver.chat.complete response.');
        }

        //////////////////////////////////////////////////////////////
        // 5. Store Response in DB as new chat message
        const storageResp = await this.ai.sb.from('chat_message')
            .insert({
                chat_id: chatId,
                // TODO kind of a hack tbh
                bot_id: usingBotId,
                body: firstMessageChoice?.content,
                function_call: firstMessageChoice?.functionCall,
                _role: 'assistant',
            })
            .select('*')
            .single();
        if (storageResp.error){
            throw storageResp.error;
        }
        else {
            return storageResp.data;
        }
    }

    /**
     * Chat stream runs the main AI chat completion loop for a Reasonote Bot.
     * 
     * Given its input, it will generate a stream of messages (or actions)
     * 
     * The response is [message, message, message, ...]
     * 
     * There is also a "onPartialObject" callback which will be called each time the resultant object has a new partial update.
     * 
     * @param request 
     * @returns 
     */
    async chatStream(request: ChatRunnerCompleteRequest, onOutputsUpdated: (outputs: ChatStreamOutputBase[]) => void) {
        const {chatId, botId} = request;

        /**
         * This is the list of outputs that will be sent to the user.
         */
        const outputs: any[] = [];

        /**
         * These are outputs which the model has completed, and which have been handled (i.e. a tool call has been made, etc).
         */
        var contextOutputs: Record<string, {
            completedOutputIndices: Set<number>,
            numOutputs: number,
        }> = {};

        /**
         * The output ids which have been completed.
         */
        var completedOutputIds: Set<string> = new Set();

        const res = await this.streamGenObject({
            model: 'openai:gpt-4o-mini',
            schema: z.object({
                outputs: z.array(z.union([
                    z.object({
                        type: z.literal('message').describe('Do this if you want to send a message to the user. This will appear in a normal chat, and can have markdown formatting.'),
                        message: z.string().describe('The message to send to the user, markdown formatted.'),
                    }),
                    z.object({
                        type: z.literal('search').describe('Do this if you want to search for an entity in the Reasonote database. This will return results to you that will help you achieve the user\'s goal.'),
                        query: z.object({
                            entity_type: z.enum(['lesson', 'activity', 'resource', 'concept', 'topic', 'lesson_plan', 'lesson_plan_step', 'lesson_plan_step_activity', 'lesson_plan_step_resource', 'lesson_plan_step_concept', 'lesson_plan_step_topic']),
                            search_query: z.string().describe('The query to search for.'),
                        }),
                    }),
                    z.object({
                        type: z.literal('show_lesson').describe('Do this if you want to show a lesson to the user.'),
                        lesson_id: z.string().describe('The ID of the lesson to show to the user.'),
                    }),
                    z.object({
                        type: z.literal('show_activity').describe('Do this if you want to show an activity to the user.'),
                        activity_id: z.string().describe('The ID of the activity to show to the user.'),
                    }),
                ])).describe('The outputs of the tool calls.'),
            }),
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant.`,
                },
                {
                    role: 'user',
                    content: 'I want to learn about the history of the United States, using lessons',
                },
            ],
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            }
        });


        // // TODO: we probably don't want to send the user *everything* we're doing, there should be a filter or map on top of the model's outputs.
        // // The main thing we need to send are the type of things it's doing, and if it *should* be seen by the user, the actual full output.
        // function updateLastOutputAndYield(chunk: any){
        //     if (outputs.length === 0){
        //         outputs.push({
        //             message: chunk.message,
        //         });
        //     }
        //     else {
        //         outputs[outputs.length - 1] = chunk;
        //     }
        //     onPartialObject(outputs);
        // }

        // function pushNewOutputAndYield(output: any){
        //     outputs.push(output);
        //     onPartialObject(outputs);
        // }

        // /**
        //  * Get the next output id for a given context.
        //  * 
        //  * @param contextName 
        //  * @returns 
        //  */
        // function nextOutputId(contextName: string){
        //     const count = contextOutputCounts[contextName] ?? 0;
        //     contextOutputCounts[contextName] = count + 1;
        //     return `${contextName}_${count}`;
        // }

        const directOutputTypes = new Set(['message']);

        async function handlePartialOutputs(contextName: string, outputs: any[]){
            // Phase 1: Filter for Direct Output Types.
            // - Here, we should check the type of the output against a map.
            // - If it's a type we're allowed to send to the user, we should yield it.
            const filteredOutputs = outputs.filter((output) => directOutputTypes.has(output.type));


            // Get count of outputs in this context.
            const count = outputs.length;
            const previousCount = contextOutputs[contextName]?.numOutputs ?? 0;
            
            // If the diff of counts is greater than 1, we need to execute any tools we haven't already executed, if they need execution.
            if (count - previousCount > 1){
                // This can probably be more elegant, but the set check makes sure it's accurate.
                for (let i = previousCount; i < count - 1; i++){
                    const output = outputs[i];
                    if (!contextOutputs[contextName].completedOutputIndices.has(i)){
                        contextOutputs[contextName].completedOutputIndices.add(i);
                        
                        outputs.push(output);
                    }
                }
            }

            // Update count of outputs in this context.
            contextOutputs[contextName].numOutputs = count;


            // Iterate over `outputs`.
            // Is this a new output in this context?
            // - First, send the partial outputs back to the user using onPartialObject.
            // - Next, if this output is not in `handledOutputs`, we need to run its handler.
            for (const output of outputs){
                // First, update our last message and yi

            }
        }

        // Replace event emitter with async iteration
        for await (const chunk of res.partialObjectStream) {
            if (!chunk.outputs){
                continue;
            }

            await handlePartialOutputs('base', chunk.outputs);            
        }

        // TODO: handle last output -- possibly by simply inserting a {type: 'end'} output as the last output,
        // and calling handlePartialOutputs one more time.

        // If there is an output
        return outputs;
    }
}