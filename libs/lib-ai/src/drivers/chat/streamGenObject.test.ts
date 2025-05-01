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
import { streamGenObject } from './streamGenObject';

describe('streamGenObject', () => {
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

  // Simple schema for testing
  const TestSchema = z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }).strict();

  it('should generate a valid object with prompt and model', async () => {
    const result = await streamGenObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: TestSchema,
      mode: 'json',
      prompt: 'Generate a test item representing a book about JavaScript',
      output: 'object' as any,
      thinking: {
        schema: z.object({
          thoughts: z.array(z.string()),
        }).strict(),
      },
    });

    console.log('partialObjectStream', result.partialObjectStream);

    for await (const object of result.partialObjectStream) {
      console.log(object);
    }

    // TODO: Pattern for moving to thinking
    // // ✅  Translate These 
    // result.partialObjectStream
    // result.object

    // // ⚫️Do work to replace these
    result.toTextStreamResponse

    // // ⚫️Ignore and document these
    // result.textStream
    // result.fullStream
    // result.elementStream
    // result.pipeTextStreamToResponse

    const finalObject = await result.object;
    const finalThinking = await result.thinking;
    
    // Verify the result matches our schema
    expect(finalObject).toBeDefined();
    // No thinking
    // @ts-ignore
    expect(finalObject.thinking, 'Thinking should not be present in the output object.').toBeUndefined();

    expect(finalThinking, 'Thinking should be present in the output object.').toBeDefined();
    expect(finalObject.name).toBeDefined();
    expect(finalObject.description).toBeDefined();
    expect(typeof finalObject.name).toBe('string');
    expect(typeof finalObject.description).toBe('string');
    
    // Optional field may or may not be present
    if (finalObject.tags) {
      expect(Array.isArray(finalObject.tags)).toBe(true);
    }
  }, 60_000);

  // Complex schema with string length constraints, defaults, and descriptions
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

  it('should handle schemas with length constraints and defaults', async () => {
    const result = await streamGenObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: BookSchema,
      mode: 'json',
      prompt: 'Generate information about a classic novel',
      output: 'object' as any,
    });

    for await (const object of result.partialObjectStream) {
      // console.log(object);
    }

    const finalObject = await result.object;
    
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
  }, 60_000);

  // Complex nested schema with union types and nullable fields
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

  it('should handle complex nested schemas with unions and nullable fields', async () => {
    const result = await streamGenObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: UserSchema,
      mode: 'json',
      output: 'object' as any,
      prompt: 'Generate information for a user profile of a moderator on a tech forum',
    });

    for await (const object of result.partialObjectStream) {
      // console.log(object);
    }

    const finalObject = await result.object;
    
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
    expect(['active', 'suspended', 'banned'].includes(finalObject.status)).toBe(true);
    
    // Check nullable fields
    if (finalObject.profile.bio !== null && finalObject.profile.bio !== undefined) {
      expect(typeof finalObject.profile.bio).toBe('string');
    }
  }, 60_000);

  // Complex deeply nested array schema
  const CourseSchema = z.object({
    courseId: z.string().uuid(),
    title: z.string().min(5).max(100),
    description: z.string().min(10).max(1000),
    instructor: z.object({
      id: z.string().uuid(),
      name: z.string().min(2),
      credentials: z.array(z.string()).optional(),
    }).strict(),
    modules: z.array(z.object({
      id: z.string().uuid(),
      title: z.string().min(3),
      description: z.string().optional(),
      lessons: z.array(z.object({
        id: z.string().uuid(),
        title: z.string().min(3),
        content: z.string().min(10),
        duration: z.number().min(1).max(240).default(30),
        resources: z.array(z.object({
          type: z.enum(['video', 'pdf', 'link', 'quiz']),
          url: z.string().url(),
          title: z.string().min(3).optional(),
          required: z.boolean().default(false),
        }).strict()).min(0).max(10).optional(),
        quiz: z.object({
          questions: z.array(z.object({
            text: z.string().min(5),
            options: z.array(z.string().min(1)),
            correctIndex: z.number().min(0),
          }).strict()).min(1).max(20),
          passingScore: z.number().min(0).max(100).default(70),
        }).strict().optional(),
      }).strict()).min(1).max(20),
      assignment: z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        dueDate: z.string().datetime().optional(),
        points: z.number().min(0).max(100).default(10),
      }).strict().optional(),
    }).strict()).min(1).max(20),
    pricing: z.union([
      z.object({
        type: z.literal('free'),
      }).strict(),
      z.object({
        type: z.literal('paid'),
        amount: z.number().min(0.01),
        currency: z.string().length(3).default('USD'),
        subscription: z.boolean().default(false),
      }).strict(),
    ]),
    tags: z.array(z.string().min(2).max(20)).min(1).max(10).optional(),
    publishedStatus: z.enum(['draft', 'published', 'archived']).default('draft'),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).strict().describe('Online course structure');

  it('should handle deeply nested array schemas', async () => {
    const result = await streamGenObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: CourseSchema,
      mode: 'json',
      output: 'object' as any,
      prompt: 'Generate a detailed online course about web development',
    });

    for await (const object of result.partialObjectStream) {
      // console.log(object);
    }

    const finalObject = await result.object;
    
    // Verify the result matches our schema
    expect(finalObject).toBeDefined();
    expect(finalObject.courseId).toBeDefined();
    expect(finalObject.title).toBeDefined();
    expect(finalObject.description).toBeDefined();
    expect(finalObject.instructor).toBeDefined();
    expect(finalObject.modules).toBeDefined();
    expect(finalObject.pricing).toBeDefined();
    expect(finalObject.createdAt).toBeDefined();
    expect(finalObject.updatedAt).toBeDefined();
    
    // Check types
    expect(typeof finalObject.courseId).toBe('string');
    expect(typeof finalObject.title).toBe('string');
    expect(typeof finalObject.description).toBe('string');
    expect(typeof finalObject.instructor).toBe('object');
    expect(Array.isArray(finalObject.modules)).toBe(true);
    
    // Check nested arrays
    expect(finalObject.modules.length).toBeGreaterThan(0);
    const firstModule = finalObject.modules[0];
    expect(firstModule.id).toBeDefined();
    expect(firstModule.title).toBeDefined();
    expect(Array.isArray(firstModule.lessons)).toBe(true);
    expect(firstModule.lessons.length).toBeGreaterThan(0);
    
    // Check union types
    expect(['free', 'paid'].includes(finalObject.pricing.type)).toBe(true);
    if (finalObject.pricing.type === 'paid') {
      expect(finalObject.pricing.amount).toBeDefined();
      expect(typeof finalObject.pricing.amount).toBe('number');
      expect(finalObject.pricing.currency).toBeDefined();
      expect(typeof finalObject.pricing.subscription).toBe('boolean');
    }
    
    // Check enum
    expect(['draft', 'published', 'archived'].includes(finalObject.publishedStatus)).toBe(true);
  }, 60_000);

  // Merged object from two schemas (instead of intersection)
  const ProjectSchema = z.object({
    // Properties from first object
    id: z.string().uuid(),
    name: z.string().min(3).max(50),
    description: z.string().min(10).max(500),
    // Properties from second object
    owner: z.string().uuid(),
    collaborators: z.array(z.string().uuid()).optional(),
    visibility: z.enum(['public', 'private', 'team']).default('private'),
    dateRange: z.array(z.string().datetime()),
    tags: z.array(z.string()).min(1).max(10).optional(),
    status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
    completion: z.number().min(0).max(100).default(0),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    // Properties from third object
    tasks: z.array(z.object({
      id: z.string().uuid(),
      title: z.string().min(3).max(100),
      description: z.string().optional(),
      assignee: z.string().uuid().optional(),
      status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
      dueDate: z.string().datetime().optional(),
      createdAt: z.string().datetime(),
    }).strict()).min(0),
    settings: z.object({
      notifications: z.boolean().default(true),
      theme: z.string().optional(),
      autoArchive: z.boolean().default(false),
    }).strict().optional(),
    custom: z.object({
      key1: z.string().optional(),
      key2: z.string().optional(),
      key3: z.string().optional(),
    }).strict().optional(),
  }).strict().describe('Project management data');

  it('should handle schemas with merged objects (from intersections)', async () => {
    const result = await streamGenObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: ProjectSchema,
      mode: 'json',
      output: 'object' as any,
      prompt: 'Generate data for a software development project',
    });

    for await (const object of result.partialObjectStream) {
      // console.log(object);
    }

    const finalObject = await result.object;
    
    // Verify the res∂ult matches our schema
    expect(finalObject).toBeDefined();
    
    // Check basic fields from first object
    expect(finalObject.id).toBeDefined();
    expect(finalObject.name).toBeDefined();
    expect(finalObject.description).toBeDefined();
    
    // Check fields from second object
    expect(finalObject.owner).toBeDefined();
    expect(finalObject.visibility).toBeDefined();
    expect(finalObject.dateRange).toBeDefined();
    expect(finalObject.status).toBeDefined();
    expect(finalObject.completion).toBeDefined();
    expect(finalObject.priority).toBeDefined();
    
    // Check fields from third object
    expect(finalObject.tasks).toBeDefined();
    
    // Check types
    expect(typeof finalObject.id).toBe('string');
    expect(typeof finalObject.name).toBe('string');
    expect(typeof finalObject.description).toBe('string');
    expect(typeof finalObject.owner).toBe('string');
    expect(['public', 'private', 'team'].includes(finalObject.visibility)).toBe(true);
    
    // Check array
    expect(Array.isArray(finalObject.dateRange)).toBe(true);
    expect(finalObject.dateRange.length).toBeGreaterThanOrEqual(1);
    expect(finalObject.dateRange.length).toBeLessThanOrEqual(2);
    
    // Check array of tasks
    expect(Array.isArray(finalObject.tasks)).toBe(true);
    if (finalObject.tasks.length > 0) {
      const task = finalObject.tasks[0];
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.createdAt).toBeDefined();
      expect(['todo', 'in_progress', 'review', 'done'].includes(task.status)).toBe(true);
    }
    
    // Check settings object if present
    if (finalObject.settings) {
      expect(typeof finalObject.settings.notifications).toBe('boolean');
      if (finalObject.settings.theme !== undefined) {
        expect(typeof finalObject.settings.theme).toBe('string');
      }
      expect(typeof finalObject.settings.autoArchive).toBe('boolean');
    }
  }, 60_000);
});
