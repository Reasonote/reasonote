import zodToJsonSchema from "zod-to-json-schema";

import { isZodLikeSchema } from "./isZodLikeSchema";

export function recursiveZodToJsonSchema(obj: any): any {
  if (isZodLikeSchema(obj)) {
    return {
      ...zodToJsonSchema(obj as any),
      isJsonSchema: true,
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => recursiveZodToJsonSchema(item));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = recursiveZodToJsonSchema(obj[key]);
      }
    }
    return result;
  }

  return obj;
}