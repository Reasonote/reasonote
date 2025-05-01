import { isJsonSchemaLike } from "./isJsonSchemaLike";
import { isZodLikeSchema } from "./isZodLikeSchema";
import { unsafeJsonSchemaToZod } from "./unsafeJsonSchemaToZod";

export function unsafeRecursiveJsonSchemaToZod(obj: any): any {
    if (isZodLikeSchema(obj)) {
      return obj; // Already a Zod schema, no need to convert
    }
  
    if (isJsonSchemaLike(obj)) {
      const converted = unsafeJsonSchemaToZod(obj);
      return converted;
    }
  
    if (Array.isArray(obj)) {
      return obj.map(item => unsafeRecursiveJsonSchemaToZod(item));
    }
  
    if (typeof obj === 'object' && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = unsafeRecursiveJsonSchemaToZod(obj[key]);
        }
      }
      return result;
    }
  
    return obj;
}