import { jsonSchema } from 'ai';
import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { openai } from '@ai-sdk/openai';
import { Laminar } from '@lmnr-ai/lmnr';

import { createDefaultStubAI } from '../../DefaultStubAI';
import { testAiFixtures } from '../../testUtils/globalAfterAll';

describe('openaiJsonSchemaLength', () => {
  
  testAiFixtures();

  const ai = createDefaultStubAI();

  afterAll(() => {
    Laminar.shutdown();
  });

  it('should handle zod object with refs', async () => {
    const bigPropObj = z.object(Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`property${i}`, z.string()])) as Record<string, z.ZodType<any>>);

    const schema = z.object(Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`object${i}`, bigPropObj])) as Record<string, z.ZodType<any>>);

    const result = await ai.genObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema,
      prompt: 'Generate an object with 10 objects, each with 40 properties',
    });

    expect(result).toBeDefined();
    expect(result.object).toBeDefined();
    expect(result.object.object1).toBeDefined();
  }, 200_000);

  it('should handle JSON schema with multiple references to shared definition', async () => {
    // Create an object definition with 100 properties
    const objectProperties: Record<string, any> = {};
    for (let i = 1; i <= 30; i++) {
      objectProperties[`property${i}`] = { type: 'string' };
    }

    // Create a schema with 12 top-level properties that reference the object definition
    const properties: Record<string, any> = {};
    for (let i = 1; i <= 12; i++) {
      properties[`object${i}`] = { $ref: '#/$defs/objectDefinition' };
    }

    // Create the complete JSON schema
    const schema = jsonSchema({
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
      $defs: {
        objectDefinition: {
          type: 'object',
          properties: objectProperties,
          required: Object.keys(objectProperties),
          additionalProperties: false,
        },
      },
    });

    const result = await ai.genObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema,
      prompt: 'Generate an object with 12 top-level objects, each with 20 properties',
    });


    // Verify the result
    expect(result).toBeDefined();

    const resultObject = result.object as Record<string, any>;
    
    // Check that all 12 objects exist
    for (let i = 1; i <= 12; i++) {
      const objectKey = `object${i}`;
      expect(resultObject[objectKey]).toBeDefined();
      
      // Check that each object has all 20 properties
      for (let j = 1; j <= 20; j++) {
        const propertyKey = `property${j}`;
        expect(resultObject[objectKey][propertyKey]).toBeDefined();
        expect(typeof resultObject[objectKey][propertyKey]).toBe('string');
      }
    }
  }, 150_000); // Allow 2 minutes for this test as it's a large object
});

