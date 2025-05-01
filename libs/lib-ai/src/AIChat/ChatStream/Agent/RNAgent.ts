import { CoreMessage } from 'ai';
import _ from 'lodash';
import { z } from 'zod';

import {
  notEmpty,
  trimLines,
} from '@lukebechtel/lab-ts-utils';
import { CtxInjectorRegistryWithUnknowns } from '@reasonote/core';
import {
  AIStreamGenObjectArgs,
  CoreAssistantMessageWithId,
  CoreToolMessageWithId,
  RNAgentCMR,
  RNAgentCMRInvokeConfig,
  RNAgentExecOrderEntryOutputToolCall,
  RNAgentOutput,
  RNAgentOutputToolCall,
  RNAgentStreamArgs,
  RNAgentStreamResult,
  RNAgentSuggestedNextMessagesArgs,
  RNAgentSuggestedNextMessagesResult,
  RNCoreMessage,
  StreamGenObjectResult,
} from '@reasonote/lib-ai-common';
import {
  getChatMessageFlatQueryDoc,
  OrderByDirection,
} from '@reasonote/lib-sdk-apollo-client';

import { RNAgentTool } from './RNAgentTool';
import { RNCtxInjector } from './RNCtxInjector';

export class RNAgent {
    contextInjectors: RNCtxInjector[]
    contextMessageRenderers: RNAgentCMR[]
    tools: RNAgentTool<any, any, any>[]
    ai: any

    constructor({
        ai,
        contextInjectors,
        contextMessageRenderers,
        tools,
    }: {
        ai: any;
        contextInjectors: RNCtxInjector[];
        contextMessageRenderers: RNAgentCMR[];
        tools: RNAgentTool<any, any, any>[];
    }) {
        this.ai = ai;
        this.contextInjectors = contextInjectors;
        this.contextMessageRenderers = contextMessageRenderers;
        this.tools = tools;
    }

    streamGenObject<T>(args: AIStreamGenObjectArgs<T>): Promise<StreamGenObjectResult<T>> {
        return this.ai.streamGenObject(args);
    }

    /**
     * Get the context injector messages for a given request.
     * 
     * @param req 
     * @returns 
     */
    async getCtxInjectorStrings(req: {contextInjectors?: CtxInjectorRegistryWithUnknowns}): Promise<string[]> {
        const ctxInjArr = Object.entries(req.contextInjectors ?? {}).map(([name, opts]) => ({
            name,
            config: opts.config,
        }));

        // Get all context injectors that match the names in `req.contextInjectors`.
        const ctxInjectors = this.contextInjectors
            .filter((ctxInjector) => ctxInjArr.map((c) => c.name).includes(ctxInjector.name))
            .map((ctxInjector) => ({
                injector: ctxInjector,
                config: ctxInjArr.find((c) => c.name.toLowerCase() === ctxInjector.name.toLowerCase())?.config ?? {},
            }));

        // Replace all spaces or special characters with underscores.
        function xmlifyName(name: string) {
            return name.replace(/[^a-zA-Z0-9]/g, '_');
        }

        // Strip quote characters from the description.
        function xmlifyDescription(description?: string) {
            return description ? `description="${description.replace(/"/g, '')}"` : '';
        }

        return (await Promise.all(
            ctxInjectors.map(async (ctxInjector) => {
                try {                    
                    const { name, description, content } = await ctxInjector.injector.get(this.ai, ctxInjector.config);

                    const nameXml = xmlifyName(name);
                    const descriptionXml = xmlifyDescription(description);

                    return `<${nameXml}${descriptionXml ? ` ${descriptionXml}` : ''}>
                        ${content}
                    </${nameXml}>
                    `
                }
                catch (e) {
                    // TODO: we should collect these errors, and report them at the end of the request somehow.
                    console.error(`Error getting context injector for ${ctxInjector.injector.name}:`, e);
                    return null;
                }
            })
        )).filter(notEmpty)
    }

    async getCtxMessageRenderers(req: {messages: RNCoreMessage[], contextMessageRenderers?: RNAgentCMRInvokeConfig[]}): Promise<CoreMessage[]> {
        // Get all active context message renderers for this request
        // By comparing the types in `req.contextMessageRenderers` to the types in `this.contextMessageRenderers`.
        const activeCtxMessageRenderers = this.contextMessageRenderers.filter((ctxMessageRenderer) => req.contextMessageRenderers?.map((c) => c.type.toLowerCase()).includes(ctxMessageRenderer.name.toLowerCase()  ));

        // Find all messages in the message history that match the names in `req.contextMessageRenderers`.
        const messages =
            (await Promise.all(req.messages.map(async (message) => {
                try {
                    if (message.role !== 'context') {
                        return message;
                    }

                    // Find the context message that is the current type.
                    const ctxMessageRenderer = activeCtxMessageRenderers.find((ctxMessageRenderer) => ctxMessageRenderer.name.toLowerCase() === message.contextType.toLowerCase());

                    if (!ctxMessageRenderer) {
                        console.warn(`\n\n\nctxMessageRenderer not found for context type message`, message);
                        return null;
                    }


                    try {
                        const stResult = await ctxMessageRenderer.get(message)

                        // TODO: in the future we may want this to be encoded as 
                        return {
                            role: 'system' as const,
                            content: trimLines(`
                            <Context>
                                ${stResult}
                            </Context>
                            `),
                        }
                    }
                    catch (e) {
                        console.error(`Error getting context message renderer for ${message.contextType}:`, e);
                        return null;
                    }
                }
                catch (e) {
                    console.error(`Error in context message renderer for ${JSON.stringify(message, null, 2).slice(0, 100)}...:`, e);
                    return null;
                }
            })))
                .filter(notEmpty);

        return messages;
    }

    /////////////////////////////////////////////////////////////
    // TODO:
    // - Add citations
    /////////////////////////////////////////////////////////////

    async mainGenObj({ request, outputsSoFar, onPartialOutputs, numIterations }: { request: RNAgentStreamArgs, outputsSoFar?: RNAgentOutput[], onPartialOutputs?: (outputs: RNAgentOutput[]) => void, numIterations: number }): Promise<void> {
        /**
         * What tools are enabled for this request?
         */
        const activeTools = this.tools.filter((tool) => request.tools?.map((t) => t.name.toLowerCase()).includes(tool.name.toLowerCase()));

        const toolMode = request.toolMode ?? 'array';

        /**
         * This defines the model's context for a request, and must be treated with great care!
         */
        const HISTORY = [
            // The primary instructions for this AI request.
            {
                role: 'system' as const,
                content: `${request.system ?? ''}`,
            },
            // This is context we're injecting agnostic of message history.
            {
                role: 'system' as const,
                content: `
                <CONTEXT description="Use this context to complete your task.">
                    ${(await this.getCtxInjectorStrings(request)).join('\n')}
                </CONTEXT>
                `
            },
            // Explain our tools to the AI.
            {
                role: 'system' as const,
                content: `
                <TOOL_EXPLANATIONS>
                    ${await Promise.all(activeTools.map(async(tool) => `
                        <TOOL name="${tool.name}" description="${tool.description}">
                            ${tool.explain ? await tool.explain() : ''}
                        </TOOL>
                    `))}
                </TOOL_EXPLANATIONS>
                `
            },
            // This will properly render all messages, including context messages that were found in the message history.
            ...await this.getCtxMessageRenderers(request),

            // The outputs we've already produced.
            ...(outputsSoFar?.map((output) => {
                if (output.type === 'message') {
                    return {
                        role: 'assistant' as const,
                        content: output.message,
                    };
                }
                else if (output.type === 'tool_call') {
                    return {
                        role: 'assistant' as const,
                        content: [{
                            type: 'tool-call' as const,
                            toolCallId: output.id,
                            toolName: output.toolName,
                            args: output.args,
                        }]
                    };
                }
                else if (output.type === 'tool_result') {
                    return {
                        role: 'tool' as const,
                        content: [{
                            type: 'tool-result' as const,
                            toolCallId: output.id,
                            toolName: output.type,
                            result: output.result,
                        }]
                    };
                }
                else {
                    return null;
                }
            }).filter(notEmpty) ?? [])
        ];

        console.log('HISTORY', JSON.stringify(HISTORY, null, 2));

        const getOutputsSchema = () => {
            const defaultMessageSchema = z.object({
                type: z.literal('message').describe('Do this if you want to send a message to the user. This will appear in a normal chat, and can have markdown formatting.'),
                message: z.string().describe('The message to send to the user, markdown formatted.'),
            });

            const getToolSchema = (toolEntry: RNAgentExecOrderEntryOutputToolCall) => {
                var retSchema: z.ZodType<any> = z.object({
                    type: z.literal(toolEntry.toolName).describe(`Do this if you want to call the ${toolEntry.toolName} tool.`),
                    args: this.tools.find((tool) => tool.name.toLowerCase() === toolEntry.toolName.toLowerCase())?.args,
                })

                if (toolEntry.optional) {
                    retSchema = z.union([
                        retSchema,
                        z.null(),
                    ])
                }

                if (toolEntry.description) {
                    retSchema.describe(toolEntry.description);
                }

                return retSchema;
            }

            // If there is an order specified, we create an object with numeric keys instead of a tuple
            if (request.execOrder) {
                const order = request.execOrder;

                if (order.length === 0) {
                    throw new Error('If specified, execOrder must have at least one entry.');
                }

                // Get the outputs for this iteration.
                const outputsExpected = order[numIterations]?.outputs;

                if (!outputsExpected) {
                    throw new Error(`No outputs expected for iteration ${numIterations}.`);
                }

                // Create an object schema with numeric keys
                const schemaShape = {} as Record<string, any>;
                outputsExpected.forEach((entry, index) => {
                    if (entry.type === 'message') {
                        schemaShape[index] = defaultMessageSchema;
                    }
                    else if (entry.type === 'tool_call') {
                        if (!activeTools.some((tool) => tool.name.toLowerCase() === entry.toolName.toLowerCase())) {
                            throw new Error(`Tool ${entry.toolName} is not active for this request. Either remove it from the execOrder, add it to the tools array, or configure it in the RNAgent instance.`);
                        }

                        schemaShape[index] = getToolSchema(entry);
                    }
                });

                return z.object(schemaShape);
            }

            if (toolMode === 'array') {
                return z.array(z.union(([
                    defaultMessageSchema,
                    ...activeTools.map((tool) => z.object({
                        type: z.literal(tool.name).describe(`Do this if you want to call the ${tool.name} tool.`),
                        args: tool.args,
                    })),
                ]) as [any, any, ...any[]])).describe('The outputs of the tool calls.')
            }
            else if (toolMode === 'object') {
                const objectEntries = Object.fromEntries([
                    ['message', z.string().describe('The message to send to the user, markdown formatted.')],
                    ...activeTools.map((tool) => [tool.name, tool.args.nullable()]),
                ]);

                // Create an object schema with keys being the tool names, and values being the tool args.
                return z.object(objectEntries).describe('The outputs of the tool calls.');
            }
            else {
                throw new Error(`Invalid tool mode: ${toolMode}`);
            }
        }

        // Actually call AI.
        const res = await this.streamGenObject({
            ...(request.genArgs as any),
            schema: z.object({
                outputs: getOutputsSchema(),
            }),
            messages: HISTORY,
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
        });

        for await (const chunk of res.partialObjectStream) {
            let outputs: any[];
            
            // Convert from object format to array if using execOrder
            if (request.execOrder) {
                const outputsObj = (chunk as any).outputs;
                if (!outputsObj) continue;
                
                // Convert numeric-keyed object to array
                outputs = Object.keys(outputsObj)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(key => outputsObj[key]);
            } else if (toolMode === 'object') {
                const outputsObj = (chunk as any).outputs;
                if (!outputsObj) continue;

                // If using toolMode === 'object', we expect the outputs to be an object, and we need to map them to an array.
                // So an object like:
                // outputs: {toolName1: {toolArgs: 'foo'}}
                // Would be converted to:
                // outputs: [{type: 'tool_call', toolName: 'toolName1', args: {toolArgs: 'foo'}}]
                outputs = Object.entries(outputsObj).map(([key, value]) => ({
                    type: key,
                    args: key === 'message' ? undefined : value,
                    message: key === 'message' ? value : undefined,
                }));
            } else {
                outputs = (chunk as any).outputs;
                if (!outputs) continue;
            }

            // Convert to RNAgentOutput[]
            // Outputs from mainGenObj look like either:
            // - {type: 'message', message: 'Hello, world!'}
            // - {type: NAME_OF_TOOL, args: {}}
            // Need to convert to:
            // - {type: 'message', message: 'Hello, world!', id: '0_0_message'}
            // - {type: 'tool_call', toolName: NAME_OF_TOOL, args: {}, id: '0_0_NAME_OF_TOOL'}
            const converted: RNAgentOutput[] = outputs.map((output, idxThisIteration) => {
                // Don't report partials until we have at least two fields, and one of them is the type.
                if (_.isPlainObject(output)) {
                    const keys = Object.keys(output);
                    if (keys.length < 2 || !keys.includes('type')) {
                        return null;
                    }
                }

                // TODO: HACKY
                const getId = (output: RNAgentOutput) => {
                    if (output.type === 'message') {
                        return `${idxThisIteration + request.messages.length + (outputsSoFar?.length ?? 0)}_message`;
                    }
                    else {
                        return `${idxThisIteration + request.messages.length + (outputsSoFar?.length ?? 0)}_${output.type}`;
                    }
                }

                if (output.type === 'message') {
                    return {
                        ...output,
                        id: getId(output),
                    }
                }
                else {
                    if (output.args === null){
                        return null
                    }
                    else {
                        return {
                            type: 'tool_call' as const,
                            toolName: output.type,
                            args: output.args,
                            id: getId(output),
                        }
                    }
                }
            }).filter(notEmpty);

            onPartialOutputs?.(converted);
        }
    }



    /////////////////////////////////////////////////////////////
    // FUTURE TODO:
    // - We should probably handle streaming, stream transforms, and pipes natively, rather than doing onPartialOutputs and weird JSON-based streaming.
    // - "outputs" should probably just be a chat 
    outputToCoreMessage(output: RNAgentOutput): CoreAssistantMessageWithId | CoreToolMessageWithId {
        if (output.type === 'message') {
            return {
                id: output.id,
                role: 'assistant' as const,
                content: output.message,
            }
        }
        else if (output.type === 'tool_call') {
            return {
                id: output.id,
                role: 'assistant' as const,
                content: [{
                    type: 'tool-call' as const,
                    toolCallId: output.id,
                    toolName: output.toolName,
                    args: output.args,
                }],
            }
        }
        else {
            return {
                id: output.id,
                role: 'tool' as const,
                content: output.result,
            }
        }
    }

    async streamSuggestedNextMessages(req: RNAgentSuggestedNextMessagesArgs): Promise<RNAgentSuggestedNextMessagesResult> {
        const {
            messages,
            chatId,
            onPartialSuggestions,
        } = req;

        const chatMessagesQuery = {
            query: getChatMessageFlatQueryDoc,
            variables: {
              filter: {
                chatId: {
                  eq: chatId,
                },
              },
              orderBy: {
                createdDate: OrderByDirection.AscNullsFirst,
              },
              first: 100,
            },
        };
    
        const chatMessageResult = await this.ai.ac.query({
            ...chatMessagesQuery,
            fetchPolicy: "network-only",
        });

        const fullChatHistory: RNCoreMessage[] = [
            ...(chatMessageResult.data?.chatMessageCollection?.edges.map((e: any) => ({
                id: e.node.id,
                content: e.node.body ?? "" as any,
                role: (e.node.botId ?
                    ("assistant" as const)
                    : e.node.role === "system" ?
                    (
                        !!e.node.contextType ?
                        ("context" as const)
                        : ("system" as const)
                    )
                    :
                    (
                        e.node.role === 'tool' ?
                        ("tool" as const)
                        : ("user" as const)
                    )) as any,
                contextData: e.node.contextData,
                contextId: e.node.contextId,
                contextType: e.node.contextType,
                })) ?? []),
            ];

        console.debug('streamSuggestedNextMessages - req:', req);

        // Get context message renderers
        const cmrs = await this.getCtxMessageRenderers({
            messages: fullChatHistory,
            contextMessageRenderers: req.contextMessageRenderers,
        });

        // Get context injectors
        const ctxInjectors = await this.getCtxInjectorStrings({
            contextInjectors: req.contextInjectors,
        });

        const allMessageHistory: CoreMessage[] = [
            {
                role: 'system' as const,
                content: `
                <CONTEXT description="Use this context to complete your task.">
                    ${ctxInjectors.join('\n')}
                </CONTEXT>
                `
            },
            ...(cmrs as any[]),
            ...fullChatHistory.filter((m) => m.role !== 'context'),
        ];

        console.debug('streamSuggestedNextMessages - allMessageHistory:', JSON.stringify(allMessageHistory, null, 2));

        // Create input for streamGenObject, based on current context.
        const result = await this.streamGenObject<{suggestedUserMessages: {content: string}[]}>({
            schema: z.object({
                suggestedUserMessages: z.array(z.object({
                    content: z.string().describe("The text of the message that the USER could send next to help themselves out."),
                })).describe("A list of messages that the USER could send next to help themselves out.")
            }),
            messages: [
                {
                    role: 'system' as const,
                    content: `
                    <YOUR_ROLE>
                    You are responsible for suggesting the next message that the USER could send to help themselves out.
                    Based on the conversation history, suggest 4 helpful messages the user could send.
                    Make suggestions specific, actionable, and relevant to the current conversation.
                    Ensure suggestions are diverse and cover different aspects of the topic.


                    <SITUATIONS>
                        <USER_IS_VIEWING_ACTIVITY_AND_HAS_NOT_COMPLETED_IT>
                            If the user is viewing an activity and has not completed it yet, you should suggest questions they could ask the bot to help them get started.
                            - Ask for clarification on objectives or expectations
                            - Request background information or context
                            - Ask for examples or demonstrations
                            - Seek guidance on approach or methodology
                            - Ask about common pitfalls or challenges

                            <EXAMPLES>
                                <EXAMPLE_1>
                                    [USER is viewing a lesson on "The Constitution"]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "What are the key sections of the Constitution I should focus on for this lesson?"
                                        - "Can you give me a brief overview of the historical context when the Constitution was written?"
                                        - "What's the most effective way to approach studying this document?"
                                        - "Are there any common misconceptions about the Constitution I should be aware of?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_1>
                                
                                <EXAMPLE_2>
                                    [USER is viewing a coding exercise about algorithms]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "What prerequisite knowledge should I have before attempting this exercise?"
                                        - "Can you show me a simple example of how this algorithm works?"
                                        - "What are the performance considerations I should keep in mind?"
                                        - "Are there any edge cases I should be particularly careful about?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_2>
                                
                                <EXAMPLE_3>
                                    [USER is viewing a math problem set on calculus]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "Which formulas or theorems will be most relevant for these problems?"
                                        - "Can you walk me through a similar but simpler problem first?"
                                        - "What's the best way to check if my answers are correct?"
                                        - "Are there any visualization techniques that could help me understand these concepts better?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_3>
                                
                                <EXAMPLE_4>
                                    [USER is viewing a writing assignment]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "What are the key elements that should be included in this type of writing?"
                                        - "Can you provide an example of a well-structured piece similar to what I'm expected to write?"
                                        - "What common mistakes should I avoid in this type of assignment?"
                                        - "How should I approach the research phase for this writing task?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_4>
                            </EXAMPLES>
                        </USER_IS_VIEWING_ACTIVITY_AND_HAS_NOT_COMPLETED_IT>

                        <USER_HAS_COMPLETED_ACTIVITY_SUCCESSFULLY>
                            If the user has just completed an activity and they did WELL:
                            - You should ask questions that push their understanding deeper
                            - Suggest exploring related concepts or advanced applications
                            - Encourage reflection on what they learned
                            
                            <EXAMPLES>
                                <EXAMPLE_1>
                                    [USER has just successfully completed a coding exercise on React hooks]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "How would useEffect behave differently if I removed the dependency array?"
                                        - "Can you explain a real-world scenario where useCallback would be crucial for performance?"
                                        - "What are some common mistakes developers make when using useState with objects?"
                                        - "How do custom hooks compare to higher-order components for code reuse?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_1>
                                
                                <EXAMPLE_2>
                                    [USER has just successfully analyzed a literary passage]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "How does this passage connect to the author's broader themes in their other works?"
                                        - "What historical context might have influenced the author's perspective here?"
                                        - "How would this passage be interpreted differently through a feminist lens?"
                                        - "Can you suggest similar passages from other authors I should explore?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_2>
                            </EXAMPLES>
                        </USER_HAS_COMPLETED_ACTIVITY_SUCCESSFULLY>

                        <USER_HAS_COMPLETED_ACTIVITY_WITH_ERRORS>
                            If the user has just completed an activity and they did NOT do well, you should ask them questions to help them understand their mistakes.
                            - Focus on clarifying misconceptions
                            - Break down complex concepts into simpler components
                            - Suggest reviewing foundational knowledge
                            - Offer to approach the problem from a different angle

                            <EXAMPLES>
                                <EXAMPLE_1>
                                    [USER has just failed a quiz on "The Constitution", where they were asked to identify the preamble -- but they mixed it up with the Bill of Rights]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "What's the difference between the preamble and the Bill of Rights?"
                                        - "What's the preamble, and why is it important?"
                                        - "Can you show me the text of both documents side by side?"
                                        - "What are the key historical contexts for each document?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_1>
                                
                                <EXAMPLE_2>
                                    [USER has made errors in a Python coding exercise about list comprehensions]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "Can you explain the syntax of list comprehensions step by step?"
                                        - "What's the difference between a list comprehension and a for loop?"
                                        - "Can you show me a simple example of a list comprehension and break down how it works?"
                                        - "What are common mistakes people make with list comprehensions?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_2>
                            </EXAMPLES>
                        </USER_HAS_COMPLETED_ACTIVITY_WITH_ERRORS>
                        
                        <USER_IS_STUCK>
                            If the user appears stuck or confused about how to proceed:
                            - Offer clarifying questions about the specific obstacle
                            - Suggest breaking down the problem into smaller steps
                            - Propose alternative approaches or perspectives
                            - Ask if they need more background information
                            
                            <EXAMPLES>
                                <EXAMPLE_1>
                                    [USER is stuck debugging a JavaScript error]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "Can you help me understand what this specific error message means?"
                                        - "What debugging strategies would you recommend for this type of problem?"
                                        - "Can you walk me through how to use console.log effectively in this situation?"
                                        - "What are common causes of this type of error?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_1>
                                
                                <EXAMPLE_2>
                                    [USER is stuck on a math problem]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "Can we break this problem down into smaller steps?"
                                        - "What formula or concept should I be applying here?"
                                        - "Can you show me a similar but simpler example first?"
                                        - "What prerequisite knowledge might I be missing to solve this?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_2>
                            </EXAMPLES>
                        </USER_IS_STUCK>
                        
                        <USER_NEEDS_PRACTICAL_APPLICATION>
                            If the user has learned a concept but needs to understand its practical application:
                            - Ask for real-world examples
                            - Request case studies or scenarios
                            - Seek connections to familiar contexts
                            - Ask about implementation details
                            
                            <EXAMPLES>
                                <EXAMPLE_1>
                                    [USER has learned about machine learning algorithms but doesn't see practical use]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "What are some everyday applications of this algorithm that I might encounter?"
                                        - "Can you walk through a specific industry case study using this technique?"
                                        - "How would I implement this in a small project to see it in action?"
                                        - "What ethical considerations should I be aware of when applying this in the real world?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_1>
                                
                                <EXAMPLE_2>
                                    [USER has learned about literary devices but doesn't see their relevance]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "How do these literary devices appear in modern media like movies or TV shows?"
                                        - "Can you show me how this technique is used in advertising or political speeches?"
                                        - "How could I use this device in my own writing to make it more effective?"
                                        - "Why do authors choose this particular technique over others?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_2>
                            </EXAMPLES>
                        </USER_NEEDS_PRACTICAL_APPLICATION>
                        
                        <USER_SEEKING_FEEDBACK>
                            If the user has submitted work and is seeking feedback:
                            - Ask specific questions about their thought process
                            - Request self-assessment of strengths and weaknesses
                            - Suggest areas for improvement or expansion
                            - Ask about their goals for the work
                            
                            <EXAMPLES>
                                <EXAMPLE_1>
                                    [USER has shared a draft of an essay]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "What part of my essay do you think needs the most improvement?"
                                        - "How effective is my thesis statement in guiding the overall argument?"
                                        - "Are there places where my evidence doesn't fully support my claims?"
                                        - "How could I make my conclusion more impactful?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_1>
                                
                                <EXAMPLE_2>
                                    [USER has shared code they wrote]
                                    <SUGGESTED_USER_MESSAGES>
                                        - "How could I refactor this code to make it more maintainable?"
                                        - "Are there any edge cases I'm not handling properly?"
                                        - "How would you improve the performance of this function?"
                                        - "What design patterns might be applicable to this problem?"
                                    </SUGGESTED_USER_MESSAGES>
                                </EXAMPLE_2>
                            </EXAMPLES>
                        </USER_SEEKING_FEEDBACK>
                    </SITUATIONS>

                    <GUIDELINES>
                        - Always tailor suggestions to the specific context of the conversation
                        - Phrase suggestions as questions the user would naturally ask
                        - Include a mix of specific and open-ended questions
                        - Avoid suggesting messages that are too generic or could apply to any conversation
                        - Ensure suggestions follow a logical progression of thought
                        - If the conversation history is minimal, suggest exploratory questions to establish context
                        - For technical topics, include both conceptual and practical application questions
                    </GUIDELINES>
                    </YOUR_ROLE>
                    `
                },
                ...allMessageHistory,
            ]
        });

        // Process the partial object stream
        if (onPartialSuggestions) {
            for await (const chunk of result.partialObjectStream) {
                if (chunk.suggestedUserMessages) {
                    onPartialSuggestions(chunk.suggestedUserMessages as {content: string}[]);
                }
            }
        }

        // Extract the final result
        const finalSuggestions = (await result.object).suggestedUserMessages;

        return {
            suggestedUserMessages: finalSuggestions,
        };
    }

    /**
     * Streams outputs to the user, and handles tool calls.
     * 
     * @param req 
     * @returns 
     */
    async stream(req: RNAgentStreamArgs): Promise<RNAgentStreamResult> {
        const {
            messages,
            tools,
            chatId,
            onPartialOutputs,
        } = req;

        /**
         * This is the list of outputs that will be sent to the user.
         */
        var outputs: RNAgentOutput[] = [];

        const directOutputTypes = new Set(['message']);

        // TODO: FUTURE: Based on the tool configurations, we determine which tools should be output directly to the user.
        // const directOutputToolNames = new Set([
        //     ...this.tools.filter((tool) => tool.requiresIteration).map((tool) => tool.name),
        // ])

        const handlePartialOutputs = async (partialOutputs: RNAgentOutput[]) => {
            outputs = [
                ...outputs.filter(output => !partialOutputs.some(partial => partial.id === output.id)),
                ...partialOutputs,
            ]

            // - Here, we should check the type of the output against a map.
            // - If it's a type we're allowed to send to the user, we should yield it.
            // - If not, we just send a "thinking" indicator.
            const outputsToSendToUser = outputs.map((output) => {
                if (directOutputTypes.has(output.type)) {
                    return output;
                }
                else {
                    // TODO: actually filter the output out...
                    return output;
                }
            });

            onPartialOutputs?.(outputsToSendToUser.map(this.outputToCoreMessage));

            // TODO: in future, we could handle tool-type outputs immediately, 
            // rather than waiting for all outputs to be produced.
            // This would add some complexity, but would allow for a much snappier experience.
        }

        var isComplete = false;
        var numIterations = 0;
        const MAX_ITERATIONS = 10;

        const completedToolCalls = new Set<string>();
        /**
         * Which tool calls requiring iteration have we allowed the ai to iterate on?
         */
        const iterativeToolCallsHandled = new Set<string>();

        while (!isComplete && numIterations < MAX_ITERATIONS) {
            // Create input for mainGenObj, based on current context.
            await this.mainGenObj({
                request: req,
                outputsSoFar: outputs,
                onPartialOutputs: handlePartialOutputs,
                numIterations
            });

            const toolCallsToInvoke: RNAgentOutputToolCall[] = outputs.filter((output) => {
                return output.type === 'tool_call';
            }) as RNAgentOutputToolCall[];

            // Invoke the functions
            const toolResults = await Promise.all(toolCallsToInvoke.map(async (output) => {
                try {
                    if (completedToolCalls.has(output.id)) {
                        return null;
                    }

                    const tool = this.tools.find((tool) => tool.name === output.toolName);

                    if (!tool) {
                        throw new Error(`Tool ${output.toolName} not found.`);
                    }

                    if (!tool.invoke) {
                        // This tool is not invokable, so we skip it.
                        return null;
                    }

                    const toolResult = await tool?.invoke?.(output.args, this.ai);
                    completedToolCalls.add(output.id);

                    return {
                        id: `${output.id}__result`,
                        type: 'tool_result' as const,
                        toolName: output.toolName,
                        toolId: output.id,
                        result: toolResult,
                    };
                }
                catch (e) {
                    // TODO: If we are configured to do so, we should report the error to the AI,
                    // and allow it to try to fix its issue.
                    console.error(`Error invoking tool ${output.toolName}:`, e);
                    return null;
                }
            }));

            // Now, we need to add the results of the tool calls to the outputs.
            outputs = [
                ...outputs,
                ...toolResults.filter(notEmpty)
            ];

            // Now, we determine if our outputs require us to loop with the model, or not.
            const nonMessageOutputsRequiringFurtherIteration: RNAgentOutputToolCall[] = outputs
                .filter((output) => {
                    if (output.type === 'message' || output.type === 'tool_result') {
                        return false;
                    }
                    else {
                        // Now see if this output needs iteration, based on its type.
                        const tool = this.tools.find((tool) => tool.name === output.toolName);

                        if (tool && tool.requiresIteration && !iterativeToolCallsHandled.has(output.id)) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                }) as RNAgentOutputToolCall[];

            const expectedNumIters = req.execOrder ? req.execOrder.length : undefined;
            const shouldStop = expectedNumIters ? 
                numIterations + 1 >= expectedNumIters
                :
                nonMessageOutputsRequiringFurtherIteration.length === 0;

            if (shouldStop) {
                isComplete = true;
            }   
            
            if (nonMessageOutputsRequiringFurtherIteration.length > 0) {
                // If we have any tool calls that require further iteration, we need to add them to the set of iterative tool calls that have been handled.
                // This is so that we can avoid duplicating work.
                nonMessageOutputsRequiringFurtherIteration.forEach((output) => {
                    iterativeToolCallsHandled.add(output.id);
                });
            }

            numIterations++;
        }

        if (numIterations >= MAX_ITERATIONS) {
            console.warn(`[RNAgent] Reached maximum iterations (${MAX_ITERATIONS}), forcing exit`);
        }

        // TODO: handle last output -- possibly by simply inserting a {type: 'end'} output as the last output,
        // and calling handlePartialOutputs one more time.


        console.log('final outputs', JSON.stringify(outputs, null, 2));

        // If there is an output
        return {
            outputs: outputs.map(this.outputToCoreMessage),
        };
    }
}
