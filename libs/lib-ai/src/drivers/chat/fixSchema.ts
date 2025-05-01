import {
  JSONSchema7,
  JSONSchema7Definition,
} from '@ai-sdk/provider';

export function createStrippedJsonSchemaForStructuredOutputs(schema: JSONSchema7): JSONSchema7 {
    // Recursively strip the schema of any "default" values.
    // All keys should be required. If a key is marked as "optional", instead make it a union with null.

    // Clone the schema to avoid modifying the original
    const newSchema = { ...schema };

    // Remove default value
    if ('default' in newSchema) {
        delete newSchema.default;
    }

    // Remove minimum/maximum constraints as they're not allowed in structured outputs
    if ('minimum' in newSchema) {
        delete newSchema.minimum;
    }
    if ('maximum' in newSchema) {
        delete newSchema.maximum;
    }
    if ('minItems' in newSchema) {
        delete newSchema.minItems;
    }
    if ('maxItems' in newSchema) {
        delete newSchema.maxItems;
    }
    if ('minLength' in newSchema) {
        delete newSchema.minLength;
    }
    if ('maxLength' in newSchema) {
        delete newSchema.maxLength;
    }
    // Remove format from strings as it's not allowed in structured outputs
    if ('format' in newSchema) {
        delete newSchema.format;
    }

    // Process object properties and make all required
    if (newSchema.type === 'object' && newSchema.properties) {
        const properties = { ...newSchema.properties };
        
        // Process each property
        for (const key in properties) {
            if (typeof properties[key] === 'object' && properties[key] !== null) {
                // Recursively process nested schemas
                properties[key] = createStrippedJsonSchemaForStructuredOutputs(properties[key] as JSONSchema7);
            }
        }
        
        newSchema.properties = properties;
        
        // Make all properties required
        const required = Object.keys(properties);
        if (required.length > 0) {
            newSchema.required = required;
        }
    }
    
    // Process array items
    if (newSchema.type === 'array' && newSchema.items) {
        if (Array.isArray(newSchema.items)) {
            // Process tuple type arrays
            newSchema.items = newSchema.items.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return createStrippedJsonSchemaForStructuredOutputs(item as JSONSchema7);
                }
                return item;
            });
        } else if (typeof newSchema.items === 'object' && newSchema.items !== null) {
            // Process single item type arrays
            newSchema.items = createStrippedJsonSchemaForStructuredOutputs(newSchema.items as JSONSchema7);
        }
    }
    
    // Process allOf, oneOf, anyOf
    const schemaKeys = ['allOf', 'oneOf', 'anyOf'] as const;
    schemaKeys.forEach(key => {
        if (key in newSchema && Array.isArray(newSchema[key])) {
            // Check for and remove patterns like { "not": {} } which logically match nothing
            newSchema[key] = (newSchema[key] as JSONSchema7Definition[])
                .filter(subSchema => {
                    // Remove "not": {} patterns as they're redundant
                    if (typeof subSchema === 'object' && 
                        subSchema !== null && 
                        'not' in subSchema && 
                        typeof subSchema.not === 'object' &&
                        subSchema.not !== null &&
                        Object.keys(subSchema.not).length === 0) {
                        // Skip this subschema as it's a "not": {} pattern that matches nothing
                        return false;
                    }
                    return true;
                })
                .map(subSchema => {
                    if (typeof subSchema === 'object' && subSchema !== null) {
                        return createStrippedJsonSchemaForStructuredOutputs(subSchema as JSONSchema7);
                    }
                    return subSchema;
                });
            
            // If we've filtered out all schemas, ensure there's at least one valid option
            //@ts-ignore
            if (newSchema[key].length === 0) {
                // Add a simple type: "null" option if everything was filtered out
                newSchema[key] = [{ type: "null" }];
            }
        }
    });
    
    // Handle 'not' schema
    if (newSchema.not) {
        if (typeof newSchema.not === 'object' && 
            newSchema.not !== null && 
            Object.keys(newSchema.not).length === 0) {
            // Handle "not": {} - this matches nothing, which is problematic for most use cases
            // Remove it since it creates an impossible condition
            delete newSchema.not;
        } else if (typeof newSchema.not === 'object' && newSchema.not !== null) {
            // Process non-empty not schema normally
            newSchema.not = createStrippedJsonSchemaForStructuredOutputs(newSchema.not as JSONSchema7);
        }
    }

    return newSchema;
}