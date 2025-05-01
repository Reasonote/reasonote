import { ZodTypeDef } from 'zod';

/**
* Checks if an object is likely to be a Zod-like schema.
* This is a best-effort check based on common properties and methods of Zod schemas.
* 
* @param obj The object to check
* @returns True if the object appears to be a Zod-like schema, false otherwise
*/
export function isZodLikeSchema(obj: unknown): obj is Zod.ZodType<any, ZodTypeDef, any> {
   if (typeof obj !== 'object' || obj === null) {
     return false;
   }
 
   const schema = obj as Record<string, unknown>;
 
   // Check for common Zod schema properties and methods
   const hasShape = 'shape' in schema && typeof schema.shape === 'object';
   const hasParse = 'parse' in schema && typeof schema.parse === 'function';
   const hasSafeparse = 'safeParse' in schema && typeof schema.safeParse === 'function';
   const hasOptional = 'optional' in schema && typeof schema.optional === 'function';
   const hasNullable = 'nullable' in schema && typeof schema.nullable === 'function';
 
   // Check for common Zod type-specific properties
   const hasStringSpecificProps = 'min' in schema && 'max' in schema && typeof schema.min === 'function' && typeof schema.max === 'function';
   const hasNumberSpecificProps = 'gt' in schema && 'lt' in schema && typeof schema.gt === 'function' && typeof schema.lt === 'function';
   const hasArraySpecificProps = 'element' in schema && typeof schema.element === 'object';
   const hasObjectSpecificProps = 'extend' in schema && typeof schema.extend === 'function';
 
   // If it has most of these properties and methods, it's likely a Zod-like schema
   const likelinessScore = [
     hasShape, hasParse, hasSafeparse, hasOptional, hasNullable,
     hasStringSpecificProps, hasNumberSpecificProps, hasArraySpecificProps, hasObjectSpecificProps
   ].filter(Boolean).length;
 
   // We consider it Zod-like if it has at least 5 of these characteristics
   return likelinessScore >= 5;
}