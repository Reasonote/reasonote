import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createSimpleLogger } from '@lukebechtel/lab-ts-utils';
import { createGroqDriver } from '@reasonote/lib-ai';
import * as transformers from '@xenova/transformers';

import { AI } from './AI';
import { AIContext } from './AIContext/AIContext';

/**
 * THIS IS JUST FOR TESTING
 */
export function createDefaultStubAI(){
    const groq = createGroqDriver(process.env.GROQ_API_KEY!);
    return new AI(new AIContext({
        sb: {} as any,
        ac: {} as any,
        aiDriver: {} as any,
        defaultGenObjectModels: [
          openai('gpt-5-mini'),
          // groq('llama3-groq-70b-8192-tool-use-preview'),
        ],
        defaultGenTextModels: [
          openai('gpt-5-mini'),
          // groq('llama3-groq-70b-8192-tool-use-preview'),
        ],
        modelProps: {
          'openai:gpt-5-mini': {
            quality: 92,
            speed: 105,
            contextLength: 1_000_000,
            toolOptimized: true,
            altTags: ['fastest']
          },
          'anthropic:claude-sonnet-4-6': {
            quality: 100,
            speed: 85,
            contextLength: 1_000_000,
            toolOptimized: true,
            altTags: ['best']
          },
          'anthropic:claude-haiku-4-5-20251001': {
            quality: 88,
            speed: 128,
            contextLength: 200_000,
            toolOptimized: true,
            altTags: ['fastest']
          }
        },
        aiProviders: {
          openai,
          groq,
          //@ts-ignore
          anthropic
        },
        transformersPkg: transformers,
        logger: createSimpleLogger({
            prefix: '[AI]'
        }),
        getActivityTypeDefinition: {} as any,
    }));
}