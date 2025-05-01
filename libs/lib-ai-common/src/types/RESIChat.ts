import { z } from 'zod';

export const RESIChatMessageAssistantSchema = z
  .object({
    role: z.literal("assistant"),
    content: z.string().optional().nullable(),
    name: z.string().max(64).optional(),
    function_call: z
      .object({
        name: z.string(),
        arguments: z.any(),
      })
      .optional(),
  })
  .describe("This message was sent by the assistant.");
export type RESIChatMessageAssistant = z.infer<
  typeof RESIChatMessageAssistantSchema
>;

export const RESIChatMessageUserSchema = z
  .object({
    role: z.literal("user"),
    content: z.string(),
    name: z.string().max(64).optional(),
  })
  .describe("This message was sent by the user.");
export type RESIChatMessageUser = z.infer<typeof RESIChatMessageUserSchema>;

export const RESIChatMessageSystemSchema = z
  .object({
    role: z.literal("system"),
    content: z.string(),
    name: z.string().max(64).optional(),
  })
  .describe(
    "This message sets the behavior of the assistant. It usually is the first message in a chat."
  );
export type RESIChatMessageSystem = z.infer<typeof RESIChatMessageSystemSchema>;

export const RESIChatMessageFunctionSchema = z
  .object({
    role: z.literal("function"),
    content: z.string().optional(),
    name: z.string(),
  })
  .describe(
    "This message was the result of a function call that the assistant invoked."
  );
export type RESIChatMessageFunction = z.infer<
  typeof RESIChatMessageFunctionSchema
>;

export const RESIChatMessageSchema = z.union([
  RESIChatMessageAssistantSchema,
  RESIChatMessageUserSchema,
  RESIChatMessageSystemSchema,
  RESIChatMessageFunctionSchema,
]);
export type RESIChatMessage = z.infer<typeof RESIChatMessageSchema>;

/////////////////////////////////////////////////////////////////////
// REQUEST
/////////////////////////////////////////////////////////////////////
export const RESIChatBaseRequestSchema = z.object({
  messages: z
    .array(
      z.union([
        RESIChatMessageAssistantSchema,
        RESIChatMessageUserSchema,
        RESIChatMessageSystemSchema,
        RESIChatMessageFunctionSchema,
      ])
    )
    .describe("The history of messages in the chat."),
  tools: z
    .array(z.string())
    .optional()
    .describe("The tools that the assistant can use to respond to the user."),
  functionExplainer: z
    .string()
    .optional()
    .describe("Explains to the Assistant how to interact with functions."),
  numChoices: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("The number of choices to generate."),
});

