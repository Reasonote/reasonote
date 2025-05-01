import { generateObject } from 'ai';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { openai } from '@ai-sdk/openai';
import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

// Mock the ActivitySchema
const ActivitySchema = z.object({
    type: z.string(),
    content: z.string(),
});

// Common test schema
const complexSchema = z.object({
    type: z.enum(['activity', 'lesson']),
    content: z.union([
        z.object({
            type: z.literal('activity'),
            activity: ActivitySchema,
        }),
        z.object({
            type: z.literal('lesson'),
            lesson: z.string(),
        }),
    ]),
    nested: z.object({
        loremIpsum: z.object({
            deeply: z.object({
                nested: z.object({
                    arbitrary: z.literal('hello my name is carl'),
                })
            })
        })
    }),
});

const INSTRUCTIONS = 'DO NOT WRITE "hello my name is carl" IN THE LOREM IPSUM deeply nested arbitrary field.';

describe('genObject complex schema tests', () => {
    describe('direct OpenAI integration', () => {
        it('should generate object using OpenAI client directly', async () => {
            const openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const directResult = await openaiClient.beta.chat.completions.parse({
                model: 'gpt-4o-mini-2024-07-18',
                messages: [{role: 'system', content: INSTRUCTIONS}],
                response_format: zodResponseFormat(complexSchema, 'activity'),
            });

            const parsed = directResult.choices[0].message.parsed;

            console.log('parsed', parsed);
            expect(parsed).toBeDefined();
            //@ts-ignore
            expect(parsed.type).toBeTypeOf('string');
            //@ts-ignore
            expect(['activity', 'lesson']).toContain(parsed.type);
        }, { timeout: 70_000 });
    });

    describe('generateObject function', () => {
        it('should generate object using generateObject function', async () => {
            const otherResult = await generateObject({
                //@ts-ignore
                model: openai('gpt-4o-mini-2024-07-18', {
                    structuredOutputs: true,
                }),
                prompt: INSTRUCTIONS,
                schema: complexSchema,
            });

            expect(otherResult.object).toBeDefined();
            expect(otherResult.object?.type).toBeTypeOf('string');
            expect(['activity', 'lesson']).toContain(otherResult.object?.type);
        }, { timeout: 70_000 });
    });

    describe('AI genObject method', () => {
        it('should generate object using AI instance', async () => {
            const ai = createDefaultStubAI();

            const result = await ai.genObject({
                mode: 'json',
                providerArgs: {
                    structuredOutputs: true,
                },
                model: 'openai:gpt-4o-mini-2024-07-18',
                system: INSTRUCTIONS,
                schema: complexSchema,
            });

            expect(result.object).toBeDefined();
            expect(result.object?.type).toBeTypeOf('string');
            expect(['activity', 'lesson']).toContain(result.object?.type);

            if (result.object?.type === 'activity') {
                expect(result.object.content.type).toBe('activity');
                //@ts-ignore
                expect(result.object.content.activity).toBeDefined();
            } else if (result.object?.type === 'lesson') {
                expect(result.object.content.type).toBe('lesson');
                //@ts-ignore
                expect(result.object.content.lesson).toBeTypeOf('string');
            }
        }, { timeout: 70_000 });
    });
});
