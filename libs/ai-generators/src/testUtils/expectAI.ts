import { z } from 'zod';
import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

export async function expectAI(expectation: string, value: unknown) {
    const ai = createDefaultStubAI();

    const result = await ai.genObject({
        prompt: `
            <YOUR_ROLE>
                You are a test assertion helper. Your job is to verify if a given value matches an expectation.
                You must be STRICT and PRECISE in your evaluation.
            </YOUR_ROLE>

            <EXPECTATION>
                ${expectation}
            </EXPECTATION>

            <VALUE_TO_CHECK>
                ${JSON.stringify(value, null, 2)}
            </VALUE_TO_CHECK>

            <CRITICAL>
                You MUST return:
                - meets: true if and ONLY if the value EXACTLY matches the expectation
                - reason: A clear explanation of why the value does or doesn't meet the expectation
            </CRITICAL>
        `,
        schema: z.object({
            chainOfThought: z.array(z.string()).describe('A chain of thought that leads to the conclusion'),
            meets: z.boolean().describe('Whether the value meets the expectation'),
            reason: z.string().describe('A clear explanation of why the value does or doesn\'t meet the expectation')
        }),
        model: 'openai:gpt-4o-mini',
        mode: 'json',
        providerArgs: {
            structuredOutputs: true,
        },
    });

    if (!result.object?.meets) {
        throw new Error(`AI Expectation Failed: ${result.object?.reason} (Value: ${JSON.stringify(value, null, 2)})`);
    }

    return true;
} 