import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { openai } from '@ai-sdk/openai';

import { AI } from '../../AI';
import { AIContext } from '../../AIContext/AIContext';
import { testAiFixtures } from '../../testUtils/globalAfterAll';
import { genObject } from './genObject';

describe('genObject basics', () => {
  let testAI: AI;

  testAiFixtures();
  
  beforeAll(() => {
    // Initialize AI with OpenAI provider
    testAI = new AI(new AIContext({
      sb: {} as any,
      ac: {} as any,
      aiDriver: {} as any,
      defaultGenObjectModels: [
        openai('gpt-4o-mini'),
      ],
      defaultGenTextModels: [
        openai('gpt-4o-mini'),
      ],
      modelProps: { 
        'openai:gpt-4o-mini': {
          quality: 88,
          speed: 103,
          contextLength: 128_000,
          toolOptimized: true,
          altTags: ['fastest']
        }
      },
      aiProviders: {
        openai
      },
      logger: console,
    }));
  });

  // Simple schema for testing
  const TestSchema = z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  });

  it('should generate a valid object with prompt and model', async () => {
    const result = await genObject({
      model: openai('gpt-4o-mini'),
      schema: TestSchema,
      prompt: 'Generate a test item representing a book about JavaScript',
      thinking: {
        schema: z.object({
          thoughts: z.array(z.string()),
        }),
      },
    });

    // Verify the result matches our schema
    expect(result.object).toBeDefined();
    expect(result.thinking).toBeDefined();
    expect(result.object.name).toBeDefined();
    expect(result.object.description).toBeDefined();
    expect(typeof result.object.name).toBe('string');
    expect(typeof result.object.description).toBe('string');
    
    // Check thinking data structure
    expect(Array.isArray(result.thinking.thoughts)).toBe(true);
    
    // Optional field may or may not be present
    if (result.object.tags) {
      expect(Array.isArray(result.object.tags)).toBe(true);
    }
  }, 30_000);
}); 