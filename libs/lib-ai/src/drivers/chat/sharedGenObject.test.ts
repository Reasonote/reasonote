import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { openai } from '@ai-sdk/openai';
import { Laminar } from '@lmnr-ai/lmnr';

import { AI } from '../../AI';
import { AIContext } from '../../AIContext/AIContext';
import { testAiFixtures } from '../../testUtils/globalAfterAll';
import { genObject } from './genObject';
import { streamGenObject } from './streamGenObject';

describe('sharedGenObject Tests', () => {
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

  afterAll(() => {
    Laminar.shutdown();
  });

  // Helper function to create test cases for both implementations
  function createTestCases<T>({
    testName,
    schema, 
    prompt,
    thinking,
    validateResult
  }: {
    testName: string;
    schema: z.ZodType<T>;
    prompt: string;
    thinking?: { schema: z.ZodType<any> } | undefined;
    validateResult: (result: T, thinkingResult?: any) => void;
  }) {
    describe(testName, () => {
      it('genObject', async () => {
        const genObjectResult = await genObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema,
          mode: 'json',
          prompt,
          thinking,
        });

        if (thinking) {
          validateResult(genObjectResult.object, genObjectResult.thinking);
        } else {
          validateResult(genObjectResult.object);
        }
      }, 60_000);

      it('streamGenObject', async () => {
        const streamResult = await streamGenObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema,
          output: 'object' as any,
          mode: 'json',
          prompt,
          thinking,
        });

        // Mandatory consumption of stream to avoid bugs
        for await (const object of streamResult.partialObjectStream) {
          // Consuming the stream is required
        }

        const streamObjectResult = await streamResult.object;
        const streamThinkingResult = thinking ? await streamResult.thinking : undefined;
        
        validateResult(streamObjectResult, streamThinkingResult);
      }, 60_000);
    });
  }

  // Simple schema for testing
  const TestSchema = z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }).strict();

  createTestCases({
    testName: 'Simple schema test',
    schema: TestSchema,
    prompt: 'Generate a test item representing a book about JavaScript',
    validateResult: (finalObject) => {
      // Verify the result matches our schema
      expect(finalObject).toBeDefined();
      expect(finalObject.name).toBeDefined();
      expect(finalObject.description).toBeDefined();
      expect(typeof finalObject.name).toBe('string');
      expect(typeof finalObject.description).toBe('string');
      
      // Optional field may or may not be present
      if (finalObject.tags) {
        expect(Array.isArray(finalObject.tags)).toBe(true);
      }
    }
  });

  // Complex schema with constraints
  const BookSchema = z.object({
    title: z.string().min(3).max(100).describe('The title of the book'),
    author: z.string().min(2).describe('The author of the book'),
    publicationYear: z.number().min(1800).max(new Date().getFullYear()).default(2023),
    pages: z.number().min(1).default(100),
    genres: z.array(z.string().min(3)).min(1).max(5).describe('Book genres'),
    isPublished: z.boolean().default(true),
    price: z.number().min(0).optional(),
    isbn: z.string().length(13).optional(),
  }).strict().describe('A book entry');

  createTestCases({
    testName: 'Complex schema with constraints',
    schema: BookSchema,
    prompt: 'Generate information about a classic novel',
    validateResult: (finalObject) => {
      // Verify the result matches our schema
      expect(finalObject).toBeDefined();
      expect(finalObject.title).toBeDefined();
      expect(finalObject.author).toBeDefined();
      expect(finalObject.publicationYear).toBeDefined();
      expect(finalObject.pages).toBeDefined();
      expect(finalObject.genres).toBeDefined();
      expect(finalObject.isPublished).toBeDefined();
      expect(Array.isArray(finalObject.genres)).toBe(true);
      
      // Check types
      expect(typeof finalObject.title).toBe('string');
      expect(typeof finalObject.author).toBe('string');
      expect(typeof finalObject.publicationYear).toBe('number');
      expect(typeof finalObject.pages).toBe('number');
      expect(typeof finalObject.isPublished).toBe('boolean');

      // Optional fields may or may not be present
      if (finalObject.price !== undefined) {
        expect(typeof finalObject.price).toBe('number');
      }
      if (finalObject.isbn !== undefined) {
        expect(typeof finalObject.isbn).toBe('string');
      }
    }
  });

  // Nested schema with nullable fields and unions
  const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(20),
    email: z.string().email(),
    profile: z.object({
      fullName: z.string().min(2).optional(),
      age: z.number().min(13).max(120).optional(),
      bio: z.string().max(500).nullable(),
      avatar: z.string().url().optional(),
      preferences: z.object({
        theme: z.enum(['light', 'dark', 'system']).default('system'),
        notifications: z.boolean().default(true),
        language: z.string().min(2).max(5).default('en-US'),
      }).strict(),
      socialLinks: z.object({
        twitter: z.string().url().optional(),
        github: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        website: z.string().url().optional(),
      }).strict().optional(),
    }).strict().describe('User profile information'),
    roles: z.array(z.enum(['user', 'moderator', 'admin'])).min(1),
    lastLogin: z.union([z.string().datetime(), z.number(), z.null()]),
    status: z.union([
      z.literal('active'),
      z.literal('suspended'),
      z.literal('banned'),
    ]).default('active'),
    metadata: z.object({
      createdAt: z.string().datetime().optional(),
      lastUpdated: z.string().datetime().optional(),
      verificationStatus: z.string().optional(),
      accountType: z.string().optional(),
    }).strict().optional(),
  }).strict().describe('User account information');

  createTestCases({
    testName: 'Nested schema with unions and nullable fields',
    schema: UserSchema,
    prompt: 'Generate information for a user profile of a moderator on a tech forum',
    validateResult: (finalObject) => {
      // Verify the result matches our schema
      expect(finalObject).toBeDefined();
      expect(finalObject.id).toBeDefined();
      expect(finalObject.username).toBeDefined();
      expect(finalObject.email).toBeDefined();
      expect(finalObject.profile).toBeDefined();
      expect(finalObject.roles).toBeDefined();
      expect(finalObject.lastLogin).toBeDefined();
      expect(finalObject.status).toBeDefined();
      
      // Check types
      expect(typeof finalObject.id).toBe('string');
      expect(typeof finalObject.username).toBe('string');
      expect(typeof finalObject.email).toBe('string');
      expect(typeof finalObject.profile).toBe('object');
      expect(Array.isArray(finalObject.roles)).toBe(true);
      
      // Check nested objects
      expect(finalObject.profile.preferences).toBeDefined();
      expect(typeof finalObject.profile.preferences.theme).toBe('string');
      expect(typeof finalObject.profile.preferences.notifications).toBe('boolean');
      expect(typeof finalObject.profile.preferences.language).toBe('string');
      
      // Check union types
      expect(['active', 'suspended', 'banned'].includes(finalObject.status || '')).toBe(true);
      
      // Check nullable fields
      if (finalObject.profile.bio !== null && finalObject.profile.bio !== undefined) {
        expect(typeof finalObject.profile.bio).toBe('string');
      }
    }
  });

  // Schema with arrays
  const ProjectSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(50),
    description: z.string().min(10).max(500),
    owner: z.string().uuid(),
    collaborators: z.array(z.string().uuid()).optional(),
    visibility: z.enum(['public', 'private', 'team']).default('private'),
    dateRange: z.array(z.string().datetime()),  // Array instead of tuple
    tags: z.array(z.string()).min(1).max(10).optional(),
    status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
    completion: z.number().min(0).max(100).default(0),
  }).strict().describe('Project management data');

  createTestCases({
    testName: 'Schema with arrays',
    schema: ProjectSchema,
    prompt: 'Generate data for a software development project',
    validateResult: (finalObject) => {
      // Verify the result matches our schema
      expect(finalObject).toBeDefined();
      expect(finalObject.id).toBeDefined();
      expect(finalObject.name).toBeDefined();
      expect(finalObject.description).toBeDefined();
      expect(finalObject.owner).toBeDefined();
      expect(finalObject.visibility).toBeDefined();
      expect(finalObject.dateRange).toBeDefined();
      expect(finalObject.status).toBeDefined();
      expect(finalObject.completion).toBeDefined();
      
      // Check types
      expect(typeof finalObject.id).toBe('string');
      expect(typeof finalObject.name).toBe('string');
      expect(typeof finalObject.description).toBe('string');
      expect(typeof finalObject.owner).toBe('string');
      expect(['public', 'private', 'team'].includes(finalObject.visibility || '')).toBe(true);
      
      // Check array
      expect(Array.isArray(finalObject.dateRange)).toBe(true);
      expect(finalObject.dateRange.length).toBeGreaterThan(0);
      
      // Optional fields
      if (finalObject.collaborators) {
        expect(Array.isArray(finalObject.collaborators)).toBe(true);
      }
      if (finalObject.tags) {
        expect(Array.isArray(finalObject.tags)).toBe(true);
      }
    }
  });

  // Test handling of schema with thinking
  const ThinkingSchema = z.object({
    thoughts: z.array(z.string()),
  }).strict();

  createTestCases({
    testName: 'Schema with thinking',
    schema: TestSchema,
    prompt: 'Generate a test item representing a book about Python',
    thinking: {
      schema: ThinkingSchema,
    },
    validateResult: (finalObject, thinking) => {
      // Verify the result matches our schema
      expect(finalObject).toBeDefined();
      expect(finalObject.name).toBeDefined();
      expect(finalObject.description).toBeDefined();
      
      // Verify thinking is present
      expect(thinking).toBeDefined();
      expect(thinking.thoughts).toBeDefined();
      expect(Array.isArray(thinking.thoughts)).toBe(true);
    }
  });
}); 