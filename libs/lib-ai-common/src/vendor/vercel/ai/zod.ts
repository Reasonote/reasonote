import { z } from 'zod';

// Define schemas for the component types
const CoreSystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
});

const CoreUserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.union([
    z.string(),
    z.array(
      z.union([
        z.object({
          type: z.literal('text'),
          text: z.string(),
        }),
        z.object({
          type: z.literal('image'),
          image: z.union([z.instanceof(URL), z.string(), z.instanceof(Uint8Array)]),
          mimeType: z.string().optional(),
        }),
      ])
    ),
  ]),
});

const ToolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.object({}) // Changed from z.unknown().optional() to z.unknown()
});

const CoreAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.union([
    z.string(),
    z.array(
      z.union([
        z.object({
          type: z.literal('text'),
          text: z.string(),
        }),
        ToolCallPartSchema,
      ])
    ),
  ]),
});

const ToolResultPartSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.object({}),
  isError: z.boolean().optional(),
});

const CoreToolMessageSchema = z.object({
  role: z.literal('tool'),
  content: z.array(ToolResultPartSchema),
});

// Combine the schemas to create the CoreMessageSchema
export const CoreMessageSchema = z.discriminatedUnion('role', [
  CoreSystemMessageSchema,
  CoreUserMessageSchema,
  CoreAssistantMessageSchema,
  CoreToolMessageSchema,
]);

// Type assertion to ensure the schema matches the CoreMessage type
type CoreMessage = z.infer<typeof CoreMessageSchema>;

// const _typeCheck: CoreMessage = {} as CoreMessageType;