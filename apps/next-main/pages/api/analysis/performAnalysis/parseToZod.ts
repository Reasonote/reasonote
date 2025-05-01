import {z} from "zod";

import {parseSchema} from "@reasonote/lib-utils";

function evaluate(code: string, args = {}) {
    // Call is used to define where "this" within the evaluated code should reference.
    // eval does not accept the likes of eval.call(...) or eval.apply(...) and cannot
    // be an arrow function
    return function evaluateEval() {
      // Create an args definition list e.g. "arg1 = this.arg1, arg2 = this.arg2"
      const argsStr = Object.keys(args)
        .map((key) => `${key} = this.${key}`)
        .join(",");
      const argsDef = argsStr ? `let ${argsStr};` : "";
  
      return eval(`${argsDef}${code}`);
    }.call(args);
  }

export function parseToZod(jsonSchemaString: any): z.ZodSchema<any> {
    // Use library to get either a string defining a zod schema, or a zod schema.
    const schemaZodMaybeString = parseSchema(jsonSchemaString) as any;
  
    if (typeof schemaZodMaybeString === "string") {
      schemaZodMaybeString;
  
      console.log(schemaZodMaybeString, typeof schemaZodMaybeString);
  
      const schemaZodObj = evaluate(schemaZodMaybeString, { z });
  
      if (!schemaZodObj.parse) {
        throw new Error("Could not parse schema");
      }
  
      return schemaZodObj as z.ZodSchema<any>;
    } else {
      const schemaZodObj = schemaZodMaybeString as z.ZodSchema<any>;
  
      if (!schemaZodObj.parse) {
        throw new Error("Could not parse schema");
      }
  
      return schemaZodObj;
    }
  }