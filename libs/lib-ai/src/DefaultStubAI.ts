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
          'openai:gpt-4o': {
            quality: 99,
            speed: 82,
            contextLength: 128_000,
            toolOptimized: true,
            altTags: []
          },
          'openai:gpt-4o-2024-08-06': {
            quality: 100,
            speed: 82,
            contextLength: 128_000,
            toolOptimized: true,
            altTags: ['best']
          },
          'anthropic:claude-3-5-sonnet-20240620': {
            quality: 99,
            speed: 79,
            contextLength: 200_000,
            toolOptimized: true,
            altTags: ['best']
          },
          'anthropic:claude-3-haiku-20240307': {
            quality: 74,
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