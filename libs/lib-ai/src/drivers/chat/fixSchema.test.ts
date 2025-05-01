import {
  describe,
  expect,
  it,
} from 'vitest';

import { JSONSchema7 } from '@ai-sdk/provider';

import { createStrippedJsonSchemaForStructuredOutputs } from './fixSchema';

describe('createStrippedJsonSchemaForStructuredOutputs', () => {
  it('should remove default values from schema', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'John Doe'
        },
        age: {
          type: 'number',
          default: 30
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.properties?.name).not.toHaveProperty('default');
    expect(result.properties?.age).not.toHaveProperty('default');
  });

  it('should make all properties required', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name'] // Only name is required in the input
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.required).toEqual(['name', 'age']);
  });

  it('should recursively process nested objects', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            details: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  default: 'John Doe'
                }
              }
            }
          },
          default: { details: { name: 'Default User' } }
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.properties?.user).not.toHaveProperty('default');
    expect((result.properties?.user as JSONSchema7).properties?.details).toBeDefined();
    expect(((result.properties?.user as JSONSchema7).properties?.details as JSONSchema7).properties?.name).not.toHaveProperty('default');
  });

  it('should remove min/max constraints', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        age: {
          type: 'number',
          minimum: 18,
          maximum: 65
        },
        items: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 10
        },
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 50
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.properties?.age).not.toHaveProperty('minimum');
    expect(result.properties?.age).not.toHaveProperty('maximum');
    expect(result.properties?.items).not.toHaveProperty('minItems');
    expect(result.properties?.items).not.toHaveProperty('maxItems');
    expect(result.properties?.name).not.toHaveProperty('minLength');
    expect(result.properties?.name).not.toHaveProperty('maxLength');
  });

  it('should process arrays correctly', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'User'
              }
            }
          }
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.properties?.users).toBeDefined();
    const items = (result.properties?.users as JSONSchema7).items as JSONSchema7;
    expect(items).toBeDefined();
    expect(items.type).toBe('object');
    expect(items.properties?.name).not.toHaveProperty('default');
    expect(items.required).toEqual(['name']);
  });

  it('should process allOf, oneOf, anyOf correctly', () => {
    const input: JSONSchema7 = {
      allOf: [
        {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'Default Name' }
          }
        },
        {
          type: 'object',
          properties: {
            age: { type: 'number', default: 20 }
          }
        }
      ]
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.allOf).toBeDefined();
    expect(result.allOf?.[0]).not.toHaveProperty('default');
    expect((result.allOf?.[0] as JSONSchema7).properties?.name).not.toHaveProperty('default');
    expect((result.allOf?.[1] as JSONSchema7).properties?.age).not.toHaveProperty('default');
  });

  it('should process not schema correctly', () => {
    const input: JSONSchema7 = {
      not: {
        type: 'object',
        properties: {
          name: { type: 'string', default: 'Default Name' }
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.not).toBeDefined();
    expect((result.not as JSONSchema7).properties?.name).not.toHaveProperty('default');
  });

  it('should remove "not": {} patterns from anyOf/oneOf/allOf arrays', () => {
    const input: JSONSchema7 = {
      anyOf: [
        { not: {} },
        {
          type: 'array',
          items: { type: 'string' }
        }
      ]
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.anyOf).toBeDefined();
    expect(result.anyOf?.length).toBe(1);
    expect((result.anyOf?.[0] as JSONSchema7).type).toBe('array');
  });

  it('should replace arrayOf with type null when all items are removed', () => {
    const input: JSONSchema7 = {
      oneOf: [
        { not: {} },
        { not: {} }
      ]
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.oneOf).toBeDefined();
    expect(result.oneOf?.length).toBe(1);
    expect((result.oneOf?.[0] as JSONSchema7).type).toBe('null');
  });

  it('should remove direct "not": {} from schema', () => {
    const input: JSONSchema7 = {
      not: {}
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result).not.toHaveProperty('not');
  });

  it('should handle complex schemas with nested "not": {} patterns', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        conditional: {
          anyOf: [
            { not: {} },
            { type: 'string' },
            { 
              allOf: [
                { not: {} },
                { type: 'number' }
              ]
            }
          ]
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.properties?.conditional).toBeDefined();
    expect((result.properties?.conditional as JSONSchema7).anyOf?.length).toBe(2);
    // First item should now be the string type (since not:{} was removed)
    expect(((result.properties?.conditional as JSONSchema7).anyOf?.[0] as JSONSchema7).type).toBe('string');
    // Second item should still have allOf, but with only the number type
    const allOf = ((result.properties?.conditional as JSONSchema7).anyOf?.[1] as JSONSchema7).allOf;
    expect(allOf?.length).toBe(1);
    expect((allOf?.[0] as JSONSchema7).type).toBe('number');
  });

  it('should remove format from string properties', () => {
    const input: JSONSchema7 = {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email'
        },
        date: {
          type: 'string',
          format: 'date-time'
        },
        url: {
          type: 'string',
          format: 'uri'
        }
      }
    };

    const result = createStrippedJsonSchemaForStructuredOutputs(input);

    expect(result.properties?.email).not.toHaveProperty('format');
    expect(result.properties?.date).not.toHaveProperty('format');
    expect(result.properties?.url).not.toHaveProperty('format');
  });
}); 