import _ from 'lodash';
import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import {
  createReasonoteApolloClient,
  ReasonoteApolloClient,
} from '@reasonote/lib-sdk-apollo-client';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

import { AI } from '../../../AI';
import { AIContext } from '../../../AIContext/AIContext';
import { ViewingActivityCMR } from './CMRs/ViewingActivityCMR';
import { ViewingLessonCMR } from './CMRs/ViewingLessonCMR';
import { CourseCtxInjector } from './CtxInjectors/CourseCtxInjector';
import { RootSkillCtxInjector } from './CtxInjectors/RootSkillCtxInjector';
import { RNAgent } from './RNAgent';

describe('RNAgent', () => {
    let ai: AI;

    beforeAll(async () => {
        ////////////////////////////////////////////////////////////////////////
        // Create supabase with this client's token, if provided.
        let supabase: SupabaseClient | undefined;
        try {
            supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.REASONOTE_SUPABASE_ANON_KEY!,
                // {
                //     global: {
                //     headers: {
                //         Authorization: jwtBearerify(),
                //     },
                //     },
                // }
            );
        } catch (err: any) {
           throw new Error(`Failed to initialize SupabaseClient.`, {
            cause: err,
           });
        }

        const supabaseUserRet = await supabase.auth.getUser();
        const supabaseUser = supabaseUserRet.data.user;
        const rsnUserId = supabaseUser ? `rsnusr_${supabaseUser.id}` : undefined;

        let ac: ReasonoteApolloClient | undefined;
        try {
            ac = createReasonoteApolloClient({
                uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
                async getApiKey() {
                    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                },
                async getToken() {
                    // TODO: This should be the user's token, if they are logged in.
                    // return jwtBearerify(tokenNoBearer);
                    // return jwtBearerify();
                    return 'FIXME';
                },
            });

        } catch (err: any) {
            throw new Error(`Failed to initialize ReasonoteApolloClient.`, {
                cause: err,
            });
        }

        // Initialize AI with minimal required configuration
        ai = new AI(new AIContext({
            sb: supabase,
            ac,
            elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            aiDriver: null as any,
            defaultGenObjectModels: [
              openai('gpt-4o-mini'),
              // groq('llama3-groq-70b-8192-tool-use-preview'),
            ],
            defaultGenTextModels: [
              openai('gpt-4o-mini'),
              // groq('llama3-groq-70b-8192-tool-use-preview'),
            ],
            modelProps: {
                'openai:gpt-4o-mini': {
                    quality: 88,
                    speed: 103,
                    contextLength: 128_000,
                    toolOptimized: true,
                    altTags: ['fastest']
                },
                'anthropic:claude-3-5-sonnet-20240620': {
                    quality: 88,
                    speed: 103,
                    contextLength: 128_000,
                    toolOptimized: true,
                    altTags: ['fastest']
                }
            },
            logger: console,
            aiProviders: {
                openai,
                anthropic
            },
            transformersPkg: null,
            getActivityTypeDefinition: () => Promise.resolve(undefined), 
        }));
    });

    it('should stream a simple message response', async () => {
        const agent = new RNAgent({
            ai,
            contextInjectors: [],
            contextMessageRenderers: [],
            tools: []
        });

        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            messages: [{
                role: 'user',
                content: 'Hello!'
            }],
            tools: [],
            chatId: 'test-chat-id',
            onPartialOutputs: (partialOutputs) => {
                // console.log('partialOutputs', partialOutputs);
            },
            system: 'You are a helpful assistant.'
        });

        // Verify we got some kind of response
        expect(outputs).toBeDefined();
        expect(outputs.length).toBeGreaterThan(0);
        
        // Verify first output is a message
        expect(outputs[0]).toMatchObject({
            role: 'assistant',
            content: expect.any(String),
        });
    });

    it('should handle a simple tool call', async () => {
        const mockTool = {
            name: 'calculator',
            description: 'A simple calculator tool',
            args: z.object({
                operation: z.enum(['add', 'subtract']),
                a: z.number(),
                b: z.number()
            }),
            invoke: async (args: { operation: 'add' | 'subtract', a: number, b: number }) => {
                if (args.operation === 'add') return args.a + args.b;
                return args.a - args.b;
            },
            requiresIteration: true
        };

        const agent = new RNAgent({
            ai,
            contextInjectors: [],
            contextMessageRenderers: [],
            tools: [mockTool]
        });

        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            messages: [{
                role: 'user',
                content: 'What is 300 + 90? Please only calculate this using addition. Please send a message before calling the tool.'
            }],
            tools: [{ name: 'calculator' }],
            chatId: 'test-chat-id',
            system: 'You are a math assistant. Use the calculator tool to help solve math problems.',
            // onPartialOutputs: (partialOutputs) => {
            //     console.log('partialOutputs', partialOutputs);
            // }
        });

        // Verify we got some outputs
        expect(outputs).toBeDefined();
        expect(outputs.length).toBeGreaterThan(0);

        // Look for calculator tool usage in outputs
        const toolCall = outputs.find(o => o.role === 'assistant' && _.isArray(o.content) && o.content.find(c => c.type === 'tool-call'));

        expect(toolCall).toMatchObject({
            role: 'assistant',
            content: [{
                type: 'tool-call',
                toolName: 'calculator',
                args: {
                    operation: 'add',
                    a: 300,
                    b: 90
                }
            }]
        });
        
        
        const toolResult = outputs.find(o => o.role === 'tool');
        expect(toolResult).toBeDefined();

        if (toolResult) {
            expect(toolResult).toMatchObject({
                role: 'tool',
                content: 390
            });
        }
    }, 20_000); 

    it('should use injected user context in responses', async () => {
        // Create and configure the RootSkillCtxInjector
        const rootSkillCtxInjector = new RootSkillCtxInjector(ai);
        
        // Mock the get method
        rootSkillCtxInjector.get = async () => ({
            name: 'RootSkill',
            content: `
                <UserSkillData description="The user's interests and preferences">
                    The user really likes lemons and has extensive experience growing citrus fruits.
                </UserSkillData>
                <RelevantResources description="Related learning resources">
                    No specific resources available yet.
                </RelevantResources>
            `
        });

        const agent = new RNAgent({
            ai,
            contextInjectors: [rootSkillCtxInjector],
            contextMessageRenderers: [],
            tools: []
        });

        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            chatId: 'test-chat-id',
            messages: [{
                role: 'user',
                content: 'Can you explain photosynthesis in a way that relates to my interests? Please respond in less than 100 words.'
            }],
            tools: [],
            contextInjectors: [{
                name: 'RootSkill',
                config: {}
            }],
            system: 'You are a helpful tutor. Use the context about the user\'s interests to personalize your explanations. You always respond in less than 100 words.',
            onPartialOutputs: (partialOutputs) => {
                // console.log('partialOutputs', partialOutputs);
            }
        });

        // Verify we got some kind of response
        expect(outputs).toBeDefined();
        expect(outputs.length).toBeGreaterThan(0);
        
        // Verify first output is a message and contains reference to lemons
        const messageOutput = outputs.find(o => o.role === 'assistant');
        expect(messageOutput).toBeDefined();
        expect(_.isString(messageOutput?.content) && messageOutput?.content.toLowerCase().includes('lemon')).toBe(true);
    }, 30_000);


    it('should ignore context injectors which are not configured for an invocation', async () => {
        // Create and configure the RootSkillCtxInjector
        const rootSkillCtxInjector = new RootSkillCtxInjector(ai);
        
        // Mock the get method
        rootSkillCtxInjector.get = async () => ({
            name: 'RootSkill',
            content: `
                <UserSkillData description="The user's interests and preferences">
                    The user really likes lemons and has extensive experience growing citrus fruits.
                </UserSkillData>
                <RelevantResources description="Related learning resources">
                    No specific resources available yet.
                </RelevantResources>
            `
        });

        const agent = new RNAgent({
            ai,
            contextInjectors: [rootSkillCtxInjector],
            contextMessageRenderers: [],
            tools: []
        });

        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            chatId: 'test-chat-id',
            messages: [{
                role: 'user',
                content: 'Can you explain photosynthesis in a way that relates to my interests? Please respond in less than 100 words.'
            }],
            tools: [],
            // No context injectors configured for invocation, will be ignored.
            contextInjectors: [],
            system: 'You are a helpful tutor. Use the context about the user\'s interests to personalize your explanations. You always respond in less than 100 words.',
            onPartialOutputs: (partialOutputs) => {
                // console.log('partialOutputs', partialOutputs);
            }
        });

        // Verify we got some kind of response
        expect(outputs).toBeDefined();
        expect(outputs.length).toBeGreaterThan(0);
        
        // Verify first output is a message and contains reference to lemons
        const messageOutput = outputs.find(o => o.role === 'assistant');
        expect(messageOutput).toBeDefined();
        expect(_.isString(messageOutput?.content) && messageOutput?.content.toLowerCase().includes('lemon')).toBe(false);
    }, 20_000);

    it('should use context message renderers in responses', async () => {
        // Create and configure the ViewingActivityCMR
        const viewingActivityCMR = new ViewingActivityCMR(ai);
        viewingActivityCMR.get = async () => `
            <Activity id="act_123">
                <Title>Growing Mushrooms at Home</Title>
                <Description>A beginner-friendly guide to cultivating oyster mushrooms.</Description>
                <Steps>
                    1. Prepare the substrate
                    2. Sterilize equipment
                    3. Inoculate with spores
                </Steps>
            </Activity>
        `;

        // Create and configure the ViewingLessonCMR
        const viewingLessonCMR = new ViewingLessonCMR(ai);
        viewingLessonCMR.get = async () => `
            <Lesson id="les_456">
                <Title>Introduction to Mycology</Title>
                <MainConcepts>
                    - Fungal life cycles
                    - Mycelium networks
                    - Substrate requirements
                </MainConcepts>
                <KeyTerms>
                    - Hyphae: Thread-like fungal structures
                    - Substrate: Growing medium for mushrooms
                </KeyTerms>
            </Lesson>
        `;

        const agent = new RNAgent({
            ai,
            contextInjectors: [],
            contextMessageRenderers: [viewingActivityCMR, viewingLessonCMR],
            tools: []
        });

        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            messages: [
                {
                    role: 'context',
                    contextId: 'act_123',
                    contextType: 'ViewingActivity',
                    contextData: { activityId: 'act_123' }
                },
                {
                    role: 'context',
                    contextId: 'les_456',
                    contextType: 'ViewingLesson',
                    contextData: { lessonId: 'les_456' }
                },
                {
                    role: 'user',
                    content: 'What am I currently learning about? Please mention specific details from both the lesson and activity.'
                }
            ],
            tools: [],
            chatId: 'test-chat-id',
            contextMessageRenderers: [
                { type: 'ViewingActivity', config: { activityId: 'act_123' } },
                { type: 'ViewingLesson', config: { lessonId: 'les_456' } }
            ],
            system: 'You are a helpful tutor. Reference specific details from the current lesson and activity context when responding.',
            onPartialOutputs: (partialOutputs) => {
                // console.log('partialOutputs', partialOutputs);
            }
        });

        // Verify we got some kind of response
        expect(outputs).toBeDefined();
        expect(outputs.length).toBeGreaterThan(0);
        
        // Verify the response contains specific details from both contexts
        const messageOutput = outputs.find(o => o.role === 'assistant');
        expect(messageOutput).toBeDefined();
        if (messageOutput) {
            const response = _.isString(messageOutput.content) ? messageOutput.content.toLowerCase() : '';
            // Check for activity-specific content
            expect(response).toContain('mushroom');
            expect(response).toContain('substrate');
            
            // Check for lesson-specific content
            expect(response).toContain('mycology');
            expect(response).toContain('mycelium');
        }
    }, 30_000);

    it('should use course context injector in responses', async () => {
        // Create and configure the CourseCtxInjector
        const courseCtxInjector = new CourseCtxInjector(ai);
        
        // Mock the get method
        courseCtxInjector.get = async () => ({
            name: 'Course',
            content: `
                <Course>
                    <Lessons>
                        <Lesson id="les_789">
                            <Title>Introduction to Classical Music</Title>
                            <MainConcepts>
                                - Basic music theory
                                - Classical period composers
                                - Symphony orchestra sections
                            </MainConcepts>
                            <LearningObjectives>
                                - Understand musical notation
                                - Recognize major composers
                                - Identify orchestral instruments
                            </LearningObjectives>
                        </Lesson>
                        <Lesson id="les_790">
                            <Title>Mozart and His Era</Title>
                            <MainConcepts>
                                - Mozart's early life
                                - Classical sonata form
                                - Vienna's musical culture
                            </MainConcepts>
                        </Lesson>
                    </Lessons>
                    <Resources>
                        <Resource id="res_001">
                            <Title>Understanding Musical Notation</Title>
                            <Type>PDF Guide</Type>
                            <Description>Comprehensive guide to reading sheet music</Description>
                        </Resource>
                        <Resource id="res_002">
                            <Title>Classical Music Timeline</Title>
                            <Type>Interactive Timeline</Type>
                            <Description>Visual history of classical music development</Description>
                        </Resource>
                    </Resources>
                </Course>
            `
        });

        const agent = new RNAgent({
            ai,
            contextInjectors: [courseCtxInjector],
            contextMessageRenderers: [],
            tools: []
        });

        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            messages: [{
                role: 'user',
                content: 'What course am I taking? Please mention specific lessons and resources available to me.'
            }],
            tools: [],
            chatId: 'test-chat-id',
            contextInjectors: [{
                name: 'Course',
                config: {
                    courseId: 'crs_123',
                    rsnUserId: 'usr_123'
                }
            }],
            system: 'You are a helpful course assistant. Reference specific details from the course context, including available lessons and resources.',
            onPartialOutputs: (partialOutputs) => {
                // console.log('partialOutputs', partialOutputs);
            }
        });

        // Verify we got some kind of response
        expect(outputs).toBeDefined();
        expect(outputs.length).toBeGreaterThan(0);
        
        // Verify the response contains specific details from the course context
        const messageOutput = outputs.find(o => o.role === 'assistant');
        expect(messageOutput).toBeDefined();
        if (messageOutput) {
            const response = _.isString(messageOutput.content) ? messageOutput.content.toLowerCase() : '';
            
            // Check for lesson-specific content
            expect(response).toContain('classical music');
            expect(response).toContain('mozart');
            
            // Check for resource-specific content
            expect(response).toContain('musical notation');
            expect(response).toContain('timeline');
        }
    }, 30_000); 

    it('should follow execOrder when specified', async () => {
        // Create a mock tool that simulates a calculator
        const calculatorTool = {
            name: 'calculator',
            description: 'A simple calculator tool',
            args: z.object({
                operation: z.enum(['add', 'subtract']),
                a: z.number(),
                b: z.number()
            }),
            invoke: async (args: { operation: 'add' | 'subtract', a: number, b: number }) => {
                if (args.operation === 'add') return args.a + args.b;
                return args.a - args.b;
            },
            requiresIteration: true
        };

        const agent = new RNAgent({
            ai,
            contextInjectors: [],
            contextMessageRenderers: [],
            tools: [calculatorTool]
        });

        
        const { outputs } = await agent.stream({
            genArgs: {
                model: openai('gpt-4o-mini'),
            },
            messages: [{
                role: 'user',
                content: 'First say hello, then calculate 5 + 3, and finally tell me the result.'
            }],
            tools: [{ name: 'calculator' }],
            chatId: 'test-chat-id',
            system: 'You are a math assistant. Follow the exact order of operations specified.',
            execOrder: [
                { outputs: [{ type: 'message' }, { type: 'tool_call', toolName: 'calculator' }] },
                { outputs: [{ type: 'message' }] }
            ],
            onPartialOutputs: (partialOutputs) => {
                // partialOutputs.forEach(output => {
                //     if ('content' in output) {
                //         if (typeof output.content === 'string') {
                //             outputOrder.push('message');
                //         } else if (Array.isArray(output.content)) {
                //             const toolCall = output.content.find(c => c.type === 'tool-call');
                //             if (toolCall) {
                //                 outputOrder.push('tool_call');
                //             }
                //         }
                //     }
                // });
            }
        });


        console.log('outputs', JSON.stringify(outputs, null, 2));

        // Verify we got outputs
        expect(outputs).toBeDefined();
        expect(outputs.length).toBe(4); // Initial message, tool call, tool result, final message

        // Check that outputs follow the specified order
        const firstOutput = outputs[0];
        expect(firstOutput.role).toBe('assistant');
        expect(typeof firstOutput.content).toBe('string');

        const toolCallOutput = outputs[1];
        expect(toolCallOutput.role).toBe('assistant');
        expect(Array.isArray(toolCallOutput.content)).toBe(true);
        expect(toolCallOutput.content[0]).toMatchObject({
            type: 'tool-call',
            toolName: 'calculator',
            args: {
                operation: 'add',
                a: 5,
                b: 3
            }
        });

        const toolResultOutput = outputs[2];
        expect(toolResultOutput.role).toBe('tool');
        expect(toolResultOutput.content).toBe(8);

        const finalOutput = outputs[3];
        expect(finalOutput.role).toBe('assistant');
        expect(typeof finalOutput.content).toBe('string');
        expect(finalOutput.content).toMatch(/8/); // Should mention the result

        // Verify the order of outputs matches execOrder
        expect(outputs.map(o => o.role)).toEqual(['assistant', 'assistant', 'tool', 'assistant']);
    }, 30_000);
}); 
