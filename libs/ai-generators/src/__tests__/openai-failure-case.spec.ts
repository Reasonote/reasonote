import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

// Minimal schema to demonstrate the issue
const ActivitySchema = z.object({
    type: z.string(),
    content: z.string(),
});

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

describe('OpenAI Direct Integration Issue', () => {
    it('demonstrates parsing issue with complex schema', async () => {
        const openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Intentionally contradictory instructions -- schema should be followed regardless
        const INSTRUCTIONS = 'DO NOT WRITE "hello my name is carl" IN THE LOREM IPSUM deeply nested arbitrary field.';

        try {
            const directResult = await openaiClient.beta.chat.completions.parse({
                model: 'gpt-4o-mini-2024-07-18',
                messages: [{role: 'system', content: INSTRUCTIONS}],
                response_format: zodResponseFormat(complexSchema, 'activity'),
            });

            const parsed = directResult.choices[0].message.parsed;
            console.log('Full Response:', JSON.stringify(directResult, null, 2));
            console.log('Parsed Result:', JSON.stringify(parsed, null, 2));

            // // Basic type checks that are failing
            // expect(parsed).toBeDefined();
            // //@ts-ignore
            // expect(typeof parsed.type).toBe('string');
            // //@ts-ignore
            // expect(['activity', 'lesson']).toContain(parsed.type);

            // // Additional validation to help diagnose the issue
            // //@ts-ignore
            // if (parsed.type === 'activity') {
            //     //@ts-ignore
            //     expect(parsed.content).toHaveProperty('type', 'activity');
            //     //@ts-ignore
            //     expect(parsed.content).toHaveProperty('activity');
            //     //@ts-ignore
            // } else if (parsed.type === 'lesson') {
            //     //@ts-ignore
            //     expect(parsed.content).toHaveProperty('type', 'lesson');
            //     //@ts-ignore
            //     expect(parsed.content).toHaveProperty('lesson');
            // }

            // // Validate nested structure
            // expect(parsed).toHaveProperty('nested.loremIpsum.deeply.nested.arbitrary');

        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    }, { timeout: 70_000 });
}); 