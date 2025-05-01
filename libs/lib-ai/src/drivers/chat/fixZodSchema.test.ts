import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { fixZodSchema } from './fixZodSchema';

describe('fixZodSchema', () => {
    it('should remove default values', () => {
        const schema = z.string().default('test');
        const result = fixZodSchema(schema);
        
        // A string with default should be converted to a string without default
        expect(result).toBeInstanceOf(z.ZodString);
        expect(result._def.defaultValue).toBeUndefined();
    });
    
    it('should throw an error for z.any()', () => {
        const schema = z.any();
        expect(() => fixZodSchema(schema)).toThrow('z.any() is not supported');
    });
    
    it('should remove min/max constraints from strings', () => {
        const schema = z.string().min(5).max(10);
        const result = fixZodSchema(schema);
        
        // Should be a plain string without constraints
        expect(result).toBeInstanceOf(z.ZodString);
        expect(result._def.checks).toHaveLength(0);
    });
    
    it('should remove min/max constraints from numbers', () => {
        const schema = z.number().min(5).max(10);
        const result = fixZodSchema(schema);
        
        // Should be a plain number without constraints
        expect(result).toBeInstanceOf(z.ZodNumber);
        expect(result._def.checks).toHaveLength(0);
    });
    
    it('should process array items', () => {
        const schema = z.array(z.string().min(5));
        const result = fixZodSchema(schema);
        
        // Should be an array of strings without constraints
        expect(result instanceof z.ZodArray).toBe(true);
        
        if (result instanceof z.ZodArray) {
            expect(result.element instanceof z.ZodString).toBe(true);
            // Check that constraints are removed
            expect((result.element as z.ZodString)._def.checks).toHaveLength(0);
        }
    });
    
    it('should make all object properties required', () => {
        const schema = z.object({
            required: z.string(),
            optional: z.string().optional(),
        });
        const result = fixZodSchema(schema);
        
        // Both properties should be required in the result
        expect(result).toBeInstanceOf(z.ZodObject);
        expect(result.shape.required).toBeInstanceOf(z.ZodString);
        expect(result.shape.optional).toBeInstanceOf(z.ZodString);
        expect(result.shape.optional).not.toBeInstanceOf(z.ZodOptional);
        
        // Object should be in strict mode
        expect(result._def.unknownKeys).toBe('strict');
        
        // Verify with parsing
        const validData = { required: 'value', optional: 'value' };
        const missingOptional = { required: 'value' };
        const extraProperty = { required: 'value', optional: 'value', extra: 'not allowed' };
        
        // Both should parse successfully with original schema
        expect(schema.safeParse(validData).success).toBe(true);
        expect(schema.safeParse(missingOptional).success).toBe(true);
        expect(schema.safeParse(extraProperty).success).toBe(true); // Original allows extra properties
        
        // With fixed schema, missing optional and extra properties should fail
        expect(result.safeParse(validData).success).toBe(true);
        expect(result.safeParse(missingOptional).success).toBe(false);
        expect(result.safeParse(extraProperty).success).toBe(false); // Now fails with strict
    });
    
    it('should process nested objects', () => {
        const schema = z.object({
            nested: z.object({
                field: z.string().min(5),
                optionalField: z.number().min(10).optional(),
            }),
        });
        const result = fixZodSchema(schema);
        
        // Verify with parsing - original schema requires constraints and allows missing optional
        const validForOriginal = { nested: { field: 'abcde', optionalField: 20 } };
        const missingOptional = { nested: { field: 'abcde' } };
        const tooShortField = { nested: { field: 'abc', optionalField: 20 } };
        const extraField = { nested: { field: 'abcde', optionalField: 20, extra: 'not allowed' } };
        
        // Original schema validation
        expect(schema.safeParse(validForOriginal).success).toBe(true);
        expect(schema.safeParse(missingOptional).success).toBe(true);
        expect(schema.safeParse(tooShortField).success).toBe(false);
        expect(schema.safeParse(extraField).success).toBe(true); // Original allows extra
        
        // Fixed schema validation - short field ok, missing optional not ok, extra field not ok
        expect(result.safeParse(validForOriginal).success).toBe(true);
        expect(result.safeParse(missingOptional).success).toBe(false);
        expect(result.safeParse(tooShortField).success).toBe(true);
        expect(result.safeParse(extraField).success).toBe(false);
        
        // Both root and nested objects should be strict
        expect(result._def.unknownKeys).toBe('strict');
        expect((result.shape.nested as z.ZodObject<any>)._def.unknownKeys).toBe('strict');
    });
    
    it('should process union types', () => {
        const schema = z.union([
            z.string().min(5),
            z.number().max(10),
        ]);
        const result = fixZodSchema(schema);
        
        // Verify with parsing
        const validString = 'abcde';
        const shortString = 'abc';
        const validNumber = 5;
        const largeNumber = 20;
        
        // Original schema validation
        expect(schema.safeParse(validString).success).toBe(true);
        expect(schema.safeParse(shortString).success).toBe(false);
        expect(schema.safeParse(validNumber).success).toBe(true);
        expect(schema.safeParse(largeNumber).success).toBe(false);
        
        // Fixed schema validation - all should be valid
        expect(result.safeParse(validString).success).toBe(true);
        expect(result.safeParse(shortString).success).toBe(true);
        expect(result.safeParse(validNumber).success).toBe(true);
        expect(result.safeParse(largeNumber).success).toBe(true);
    });
    
    it('should process intersection types', () => {
        const schema = z.intersection(
            z.object({ name: z.string().min(5) }),
            z.object({ age: z.number().min(18) }),
        );
        const result = fixZodSchema(schema);
        
        // Verify with parsing
        const valid = { name: 'abcde', age: 20 };
        const shortName = { name: 'abc', age: 20 };
        const youngAge = { name: 'abcde', age: 16 };
        const extraProperty = { name: 'abcde', age: 20, extra: 'not allowed' };
        
        // Original schema validation
        expect(schema.safeParse(valid).success).toBe(true);
        expect(schema.safeParse(shortName).success).toBe(false);
        expect(schema.safeParse(youngAge).success).toBe(false);
        expect(schema.safeParse(extraProperty).success).toBe(true); // Original allows extra
        
        // Fixed schema validation - all should be valid except extra properties
        expect(result.safeParse(valid).success).toBe(true);
        expect(result.safeParse(shortName).success).toBe(true);
        expect(result.safeParse(youngAge).success).toBe(true);
        expect(result.safeParse(extraProperty).success).toBe(false); // Now fails with strict
        
        // Test that result behaves like a merged, strict object
        expect(result.safeParse({ name: 'abc' }).success).toBe(false); // Missing age property
        expect(result.safeParse({ age: 16 }).success).toBe(false); // Missing name property
        expect(result.safeParse({ name: 'abc', age: 16, other: 'value' }).success).toBe(false); // Extra property
    });
    
    it('should process tuple types', () => {
        // Use a tuple with all string items (same type) instead of mixed type
        const schema = z.tuple([
            z.string().min(5),
            z.string().min(10),
        ]);
        const result = fixZodSchema(schema);
        
        // Verify result is now an array, not a tuple
        expect(result instanceof z.ZodArray).toBe(true);
        
        if (result instanceof z.ZodArray) {
            expect(result.element instanceof z.ZodString).toBe(true);
        }
        
        // Verify with parsing
        const valid = ['abcde', 'abcdefghij'];
        const shortString = ['abc', 'abcdefghij']; // First string too short for original 
        
        // Original schema validation
        expect(schema.safeParse(valid).success).toBe(true);
        expect(schema.safeParse(shortString).success).toBe(false);
        
        // Fixed schema validation - all should be valid
        expect(result.safeParse(valid).success).toBe(true);
        expect(result.safeParse(shortString).success).toBe(true);
    });
    
    it('should process record types', () => {
        const schema = z.record(z.string().min(5));
        expect(() => fixZodSchema(schema)).toThrow('z.record() is not supported');
    });
    
    it('should process nullable fields', () => {
        const schema = z.string().min(5).nullable();
        const result = fixZodSchema(schema);
        
        // Verify with parsing
        const validString = 'abcde';
        const shortString = 'abc';
        const nullValue = null;
        
        // Original schema validation
        expect(schema.safeParse(validString).success).toBe(true);
        expect(schema.safeParse(shortString).success).toBe(false);
        expect(schema.safeParse(nullValue).success).toBe(true);
        
        // Fixed schema validation - short string should now be valid
        expect(result.safeParse(validString).success).toBe(true);
        expect(result.safeParse(shortString).success).toBe(true);
        expect(result.safeParse(nullValue).success).toBe(true);
    });
    
    it('should leave primitive types without constraints unchanged', () => {
        const boolSchema = z.boolean();
        const enumSchema = z.enum(['a', 'b', 'c']);
        const literalSchema = z.literal('test');
        
        expect(fixZodSchema(boolSchema)).toBe(boolSchema);
        expect(fixZodSchema(enumSchema)).toBe(enumSchema);
        expect(fixZodSchema(literalSchema)).toBe(literalSchema);
    });
    
    it('should preserve descriptions from the original schema', () => {
        const schema = z.string().min(5).describe('A string with a description');
        const result = fixZodSchema(schema);
        
        // Should keep the description while removing constraints
        expect(result).toBeInstanceOf(z.ZodString);
        expect(result._def.checks).toHaveLength(0);
        expect(result._def.description).toBe('A string with a description');
        
        // Test with nested objects
        const objectSchema = z.object({
            name: z.string().describe('User name'),
            age: z.number().min(18).describe('User age')
        }).describe('User data');
        
        const objectResult = fixZodSchema(objectSchema);
        expect(objectResult._def.description).toBe('User data');
        expect(objectResult.shape.name._def.description).toBe('User name');
        expect(objectResult.shape.age._def.description).toBe('User age');
        
        // Object should be strict
        expect(objectResult._def.unknownKeys).toBe('strict');
    });
    
    it('should handle complex nested schemas', () => {
        // Create a complex schema with multiple nestings and constraints
        const complexSchema = z.object({
            id: z.string().uuid(),
            name: z.string().min(2).max(100),
            age: z.number().min(18).optional(),
            tags: z.array(z.string().min(3).max(20)),
            metadata: z.object({
                createdBy: z.string().optional(),
                createdAt: z.string().datetime().optional(),
                updatedAt: z.string().datetime().optional()
            }).strict(),
            config: z.object({
                isActive: z.boolean().default(true),
                limit: z.number().min(1).max(1000).default(50),
                flags: z.array(z.enum(['draft', 'published', 'archived'])),
            }).optional(),
            status: z.union([
                z.literal('pending'),
                z.literal('active'),
                z.literal('suspended'),
            ]),
            profile: z.nullable(z.object({
                bio: z.string().min(10).max(500).optional(),
                avatar: z.string().url().optional(),
            })),
        }).strict().describe('A book entry');
        
        const result = fixZodSchema(complexSchema);
        
        // Verify the schema structure is correct by parsing a valid object
        const testObj = {
            id: 'any-string-is-fine-now',
            name: 'short',
            age: 10, // Below original min
            tags: ['a', 'b'], // Shorter than original min
            metadata: { 
                createdBy: 'user123',
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-02T14:30:00Z'
            },
            config: {
                isActive: false,
                limit: 0, // Below original min
                flags: ['draft'],
            },
            status: 'active',
            profile: {
                bio: 'short', // Shorter than original min
                avatar: 'not-a-url', // Not a valid URL
            },
        };
        
        // Extra properties should fail
        const extraProps = {
            ...testObj,
            extra: 'not allowed' // This should cause failure
        };
        
        // This should parse successfully with our stripped schema
        const parseResult = result.safeParse(testObj);
        expect(parseResult.success).toBe(true);
        
        // Extra properties should fail
        const extraPropsResult = result.safeParse(extraProps);
        expect(extraPropsResult.success).toBe(false);
        
        // The original schema would have validation errors
        const originalParseResult = complexSchema.safeParse(testObj);
        expect(originalParseResult.success).toBe(false);
        
        // Root and all nested objects should be strict
        expect(result._def.unknownKeys).toBe('strict');
        
        // Check config object is in strict mode
        // First verify it exists and is an object
        expect(result.shape.config).toBeDefined();
        const configSchema = result.shape.config;
        
        // Test config with valid data should work
        const validConfigTest = { 
            isActive: true, 
            limit: 100, 
            flags: ['draft'] 
        };
        
        // Test config with extra field should fail
        const invalidConfigTest = { 
            isActive: true, 
            limit: 100, 
            flags: ['draft'],
            extra: 'not allowed'
        };
        
        expect(configSchema.safeParse(validConfigTest).success).toBe(true);
        expect(configSchema.safeParse(invalidConfigTest).success).toBe(false);
        
        // Check profile inner object with valid data
        const validProfileTest = {
            bio: 'this is a short bio',
            avatar: 'https://example.com/avatar.jpg'
        };
        
        // Test profile with extra field should fail
        const invalidProfileTest = {
            bio: 'this is a short bio',
            avatar: 'https://example.com/avatar.jpg',
            extra: 'not allowed'
        };
        
        const profileSchema = result.shape.profile;
        expect(profileSchema.safeParse(validProfileTest).success).toBe(true);
        expect(profileSchema.safeParse(invalidProfileTest).success).toBe(false);
    });
    
    it('should handle deeply nested arrays within objects', () => {
        // Define a deeply nested schema: object > array > object > array > object
        const deeplyNestedSchema = z.object({
            level1: z.array(z.object({
                name: z.string().min(5),
                level2: z.array(z.object({
                    id: z.number().min(1),
                    active: z.boolean().default(false),
                    level3: z.object({
                        data: z.string().url().optional(),
                    }).optional(),
                })).min(1).max(10).optional(),
            })).min(1),
        }).describe('Deeply nested structure');
        
        const result = fixZodSchema(deeplyNestedSchema);
        
        // Verify description is preserved
        expect(result._def.description).toBe('Deeply nested structure');
        
        // Test with a value that would fail original validation but passes with fixed schema
        const testObj = {
            level1: [
                {
                    name: 'ab', // Too short for original schema
                    level2: [
                        {
                            id: 0, // Below min for original schema
                            active: true,
                            level3: {
                                data: 'not-a-url', // Not a valid URL
                            },
                        },
                    ],
                },
            ],
        };
        
        // Extra properties at various levels should fail
        const extraAtRoot = {
            ...testObj,
            extra: 'not allowed'
        };
        
        const extraAtLevel1 = {
            level1: [
                {
                    name: 'ab',
                    level2: [
                        {
                            id: 0,
                            active: true,
                            level3: {
                                data: 'not-a-url',
                            },
                        },
                    ],
                    extra: 'not allowed'
                },
            ],
        };
        
        // This should parse successfully with our stripped schema
        const parseResult = result.safeParse(testObj);
        expect(parseResult.success).toBe(true);
        
        // Extra properties should fail at all levels
        expect(result.safeParse(extraAtRoot).success).toBe(false);
        expect(result.safeParse(extraAtLevel1).success).toBe(false);
        
        // The original schema would have validation errors
        const originalParseResult = deeplyNestedSchema.safeParse(testObj);
        expect(originalParseResult.success).toBe(false);
        
        // Check that optional fields are now required
        const missingLevel2 = {
            level1: [
                {
                    name: 'abcdef',
                    // missing level2
                },
            ],
        };
        
        const missingLevel3 = {
            level1: [
                {
                    name: 'abcdef',
                    level2: [
                        {
                            id: 123,
                            active: true,
                            // missing level3
                        },
                    ],
                },
            ],
        };
        
        // Both would be valid with original schema but invalid with fixed schema
        expect(deeplyNestedSchema.safeParse(missingLevel2).success).toBe(true);
        expect(deeplyNestedSchema.safeParse(missingLevel3).success).toBe(true);
        expect(result.safeParse(missingLevel2).success).toBe(false);
        expect(result.safeParse(missingLevel3).success).toBe(false);
    });
    
    it('should handle deeply nested objects with unions and nullable fields', () => {
        // Define a complex schema with union types and nullables at various nesting levels
        const schema = z.object({
            data: z.object({
                primary: z.union([
                    z.string().min(10),
                    z.number().min(100),
                    z.null(),
                ]),
                secondary: z.array(
                    z.object({
                        id: z.string().uuid(),
                        value: z.nullable(
                            z.union([
                                z.object({ 
                                    type: z.literal('text'),
                                    content: z.string().min(5).max(100).optional()
                                }).strict(),
                                z.object({
                                    type: z.literal('number'),
                                    content: z.number().min(0).max(1000).optional()
                                }).strict()
                            ])
                        ).optional(),
                    }).strict()
                ).min(1).max(5),
            }).strict(),
        }).strict();
        
        const result = fixZodSchema(schema);
        
        // Test with a value that would fail original validation but passes with fixed schema
        const testObj = {
            data: {
                primary: "short", // Too short for string union option
                secondary: [
                    {
                        id: "not-a-uuid",
                        value: {
                            type: "text",
                            content: "abc" // Too short
                        }
                    }
                ]
            }
        };
        
        // Extra properties should fail
        const extraProps = {
            data: {
                primary: "short",
                secondary: [
                    {
                        id: "not-a-uuid",
                        value: {
                            type: "text",
                            content: "abc",
                            extra: "not allowed" // This should cause failure
                        }
                    }
                ]
            }
        };
        
        // This should parse successfully with our stripped schema
        const parseResult = result.safeParse(testObj);
        expect(parseResult.success).toBe(true);
        
        // Extra properties should fail
        expect(result.safeParse(extraProps).success).toBe(false);
        
        // The original schema would have validation errors
        const originalParseResult = schema.safeParse(testObj);
        expect(originalParseResult.success).toBe(false);
        
        // Test optional fields became required
        const missingValue = {
            data: {
                primary: null,
                secondary: [
                    {
                        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
                        // missing value field
                    }
                ]
            }
        };
        
        const missingContent = {
            data: {
                primary: null,
                secondary: [
                    {
                        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                        value: {
                            type: "text"
                            // missing content field
                        }
                    }
                ]
            }
        };
        
        // Original schema allows missing optionals, fixed schema requires them
        expect(schema.safeParse(missingValue).success).toBe(true);
        expect(schema.safeParse(missingContent).success).toBe(true);
        expect(result.safeParse(missingValue).success).toBe(false);
        expect(result.safeParse(missingContent).success).toBe(false);
    });
    
    it('should throw an error for record types', () => {
        const schema = z.record(z.string());
        expect(() => fixZodSchema(schema)).toThrow('z.record() is not supported');
        
        const stringValueSchema = z.record(z.string(), z.string());
        expect(() => fixZodSchema(stringValueSchema)).toThrow('z.record() is not supported');
        
        const objectValueSchema = z.record(z.string(), z.object({ id: z.number() }));
        expect(() => fixZodSchema(objectValueSchema)).toThrow('z.record() is not supported');
    });
    
    it('should convert tuples with same type items to arrays', () => {
        // Tuple of strings
        const stringTupleSchema = z.tuple([
            z.string().min(5),
            z.string().max(10),
            z.string().email(),
        ]);
        
        // Convert the tuple to an array
        const result = fixZodSchema(stringTupleSchema);
        
        // Result should be an array of strings
        expect(result instanceof z.ZodArray).toBe(true);
        
        if (result instanceof z.ZodArray) {
            expect(result.element instanceof z.ZodString).toBe(true);
        }
        
        // Test with valid data
        const validData = ['abcdef', 'abc', 'test@example.com'];
        expect(result.safeParse(validData).success).toBe(true);
        
        // Test with invalid data type
        const invalidData = ['abcdef', 123, 'test@example.com'];
        expect(result.safeParse(invalidData).success).toBe(false);
    });
    
    it('should throw error for tuples with mixed types', () => {
        // Tuple with mixed types
        const mixedTupleSchema = z.tuple([
            z.string(),
            z.number(),
            z.boolean(),
        ]);
        
        // Should throw an error when processing
        expect(() => fixZodSchema(mixedTupleSchema)).toThrow('Tuples with mixed types are not supported');
    });
}); 