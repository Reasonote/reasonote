import { z } from 'zod';

/**
 * Creates a stripped version of a Zod schema for structured outputs to AI models.
 * This function:
 * 1. Removes default values
 * 2. Removes min/max constraints (min, max, minLength, maxLength, etc.)
 * 3. Makes all object properties required instead of optional
 * 4. Preserves descriptions from the original schema
 * 5. Sets all objects to strict mode (additionalProperties: false in JSON Schema)
 * 6. Throws an error when encountering z.any() or z.record() since they are not supported in structured outputs
 * 7. Converts tuples to regular arrays with consistent types
 * 
 * @param schema The Zod schema to strip
 * @returns A new Zod schema with the constraints removed
 */
export function fixZodSchema<T extends z.ZodTypeAny>(schema: T): T {
    // Throw an error if z.any() is encountered
    if (schema instanceof z.ZodAny) {
        throw new Error('z.any() is not supported in structured outputs as it does not provide a clear schema definition. Please use a more specific type.');
    }
    
    // Throw an error if z.record() is encountered
    if (schema instanceof z.ZodRecord) {
        throw new Error('z.record() is not supported in structured outputs as it allows arbitrary keys. Please use a z.object() with explicit keys instead.');
    }

    // Helper to preserve description if it exists in the original schema
    const preserveDescription = <S extends z.ZodTypeAny>(originalSchema: T, newSchema: S): S => {
        if (originalSchema._def.description !== undefined) {
            return newSchema.describe(originalSchema._def.description) as S;
        }
        return newSchema;
    };

    if (schema instanceof z.ZodDefault) {
        // Remove default values
        return fixZodSchema(schema.removeDefault()) as T;
    }
    
    if (schema instanceof z.ZodString) {
        // Remove min/max length constraints from strings
        return preserveDescription(schema, z.string()) as unknown as T;
    }
    
    if (schema instanceof z.ZodNumber) {
        // Remove min/max constraints from numbers
        return preserveDescription(schema, z.number()) as unknown as T;
    }
    
    if (schema instanceof z.ZodArray) {
        // Process array items
        const itemSchema = fixZodSchema(schema.element);
        return preserveDescription(schema, z.array(itemSchema)) as unknown as T;
    }
    
    if (schema instanceof z.ZodObject) {
        // Process object properties and make all required
        const shape = schema.shape;
        const newShape: Record<string, z.ZodTypeAny> = {};
        
        for (const key in shape) {
            const field = shape[key];
            
            // If field is optional, make it required
            if (field instanceof z.ZodOptional) {
                newShape[key] = fixZodSchema(field.unwrap());
            } else {
                newShape[key] = fixZodSchema(field);
            }
        }
        
        // Create a new object schema and set it to strict mode (additionalProperties: false)
        return preserveDescription(schema, z.object(newShape).strict()) as unknown as T;
    }
    
    if (schema instanceof z.ZodUnion) {
        // Process union options
        const options = schema._def.options.map(fixZodSchema);
        return preserveDescription(schema, z.union(options)) as unknown as T;
    }
    
    if (schema instanceof z.ZodIntersection) {
        // For intersection types, merge the objects to create a single object
        // This ensures we get a valid "type": "object" in the JSON Schema
        const left = fixZodSchema(schema._def.left);
        const right = fixZodSchema(schema._def.right);
        
        // Special handling when both sides are objects
        if (left instanceof z.ZodObject && right instanceof z.ZodObject) {
            // Merge the shapes
            const mergedShape: Record<string, z.ZodTypeAny> = { ...left.shape };
            
            // Add all properties from right side
            for (const key in right.shape) {
                mergedShape[key] = right.shape[key];
            }
            
            // Create merged object with strict mode
            return preserveDescription(schema, z.object(mergedShape).strict()) as unknown as T;
        }
        
        // If they're not both objects, fall back to regular intersection
        return preserveDescription(schema, z.intersection(left, right)) as unknown as T;
    }
    
    if (schema instanceof z.ZodTuple) {
        // Process tuple items
        const items = schema._def.items.map(fixZodSchema);
        
        // If the tuple is empty, just return an array of any compatible type
        if (items.length === 0) {
            return preserveDescription(schema, z.array(z.string())) as unknown as T;
        }
        
        // For structured outputs, tuples need to be converted to arrays with a single type
        // We'll check if all items in the tuple are of the same type (constructor)
        const firstItemType = items[0].constructor;
        const allSameType = items.every((item: z.ZodTypeAny) => item.constructor === firstItemType);
        
        if (!allSameType) {
            throw new Error('Tuples with mixed types are not supported in structured outputs. Please use arrays with consistent item types.');
        }
        
        // Use the first item's type for the whole array
        return preserveDescription(schema, z.array(items[0])) as unknown as T;
    }
    
    if (schema instanceof z.ZodNullable) {
        // Process nullable schema
        const innerSchema = fixZodSchema(schema.unwrap());
        return preserveDescription(schema, z.nullable(innerSchema)) as unknown as T;
    }
    
    if (schema instanceof z.ZodOptional) {
        // For top-level optional fields, we keep them required
        return fixZodSchema(schema.unwrap()) as T;
    }
    
    if (schema instanceof z.ZodEnum) {
        return schema; // Keep enum as is
    }
    
    if (schema instanceof z.ZodLiteral) {
        return schema; // Keep literal as is
    }
    
    if (schema instanceof z.ZodEffects) {
        // For ZodEffects (like `.refine()` or `.transform()`), process the inner schema
        return fixZodSchema(schema.innerType()) as T;
    }
    
    if (schema instanceof z.ZodBoolean || 
        schema instanceof z.ZodNull ||
        schema instanceof z.ZodVoid ||
        schema instanceof z.ZodUnknown) {
        // These types don't have constraints to strip
        return schema;
    }
    
    // For any other types we don't specifically handle, we throw an error
    // since structured outputs requires well-defined schemas
    throw new Error(`Unsupported schema type: ${schema.constructor.name}. Please use a more specific schema type that can be properly validated in structured outputs.`);
} 