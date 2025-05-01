import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export abstract class RESITool {
  /**
   * The name for this tool.
   */
  abstract name: string;

  /**
   * The description of the tool.
   */
  abstract description: string;

  /**
   * The input schema for this tool.
   */
  abstract inputSchema: z.ZodSchema;

  /**
   * The output schema for this tool.
   */
  abstract outputSchema: z.ZodSchema;

  /**
   * Run this tool.
   * @param input
   */
  abstract _run(
    input: z.infer<this["inputSchema"]>
  ): Promise<z.infer<this["outputSchema"]>>;

  /**
   * Get the JSONSchema-compatible name, description, parameters tuple
   */
  getFunctionRepresentation() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: "jsonschema",
        jsonschema: {
          ...zodToJsonSchema(this.inputSchema as any),
        },
      },
    };
  }
}
