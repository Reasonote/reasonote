import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

// Test Extending Zod Schema that already has the same fields

const baseSchema = z.object({
    name: z.string(),
});

describe("Zod Schema Extension", () => {
  it("should handle extending schema with the same fields correctly", () => {
    // Arrange
    const extendedSchema = baseSchema.extend({
      name: z.string(),
    });

    // Act
    const validData = { name: "test" };
    const result = extendedSchema.safeParse(validData);
    
    // Assert
    expect(result.success).toBe(true);
    
    // Check that validation still works correctly
    const invalidResult = extendedSchema.safeParse({ name: 123 });
    expect(invalidResult.success).toBe(false);
  });

  // Test extending zod schema to add a new field and see that the resulting object has all the same fields as an object created as a single z.object call
  it("should include all fields when extending schema with new fields", () => {
    // Arrange
    const extendedSchema = baseSchema.extend({
      age: z.number(),
    });
    
    const combinedSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    // Act
    const validData = { name: "test", age: 30 };
    const extendedResult = extendedSchema.safeParse(validData);
    const combinedResult = combinedSchema.safeParse(validData);
    
    // Assert
    expect(extendedResult.success).toBe(true);
    expect(combinedResult.success).toBe(true);
    
    if (extendedResult.success && combinedResult.success) {
      expect(extendedResult.data).toEqual(combinedResult.data);
    }
    
    // Ensure both schemas fail on missing fields
    const missingField = { name: "test" };
    expect(extendedSchema.safeParse(missingField).success).toBe(false);
    expect(combinedSchema.safeParse(missingField).success).toBe(false);
  });
  
  it("should allow overriding field types when extending", () => {
    // Arrange
    const stringSchema = z.object({
      value: z.string(),
    });
    
    const extendedSchema = stringSchema.extend({
      value: z.number(), // Override string with number
    });
    
    // Act & Assert
    expect(extendedSchema.safeParse({ value: "text" }).success).toBe(false);
    expect(extendedSchema.safeParse({ value: 123 }).success).toBe(true);
  });
  
  it("should support nested extension of complex schemas", () => {
    // Arrange
    const userSchema = z.object({
      name: z.string(),
      profile: z.object({
        bio: z.string(),
      }),
    });
    
    const extendedUserSchema = userSchema.extend({
      profile: z.object({
        bio: z.string(),
        avatar: z.string().url(),
      }),
    });
    
    // Act & Assert
    const validUser = {
      name: "John",
      profile: {
        bio: "Developer",
        avatar: "https://example.com/avatar.jpg",
      },
    };
    
    const invalidUser = {
      name: "John",
      profile: {
        bio: "Developer",
        avatar: "not-a-url",
      },
    };
    
    expect(extendedUserSchema.safeParse(validUser).success).toBe(true);
    expect(extendedUserSchema.safeParse(invalidUser).success).toBe(false);
  });
});