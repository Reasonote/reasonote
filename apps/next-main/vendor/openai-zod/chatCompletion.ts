import { z } from "zod";

export const ChatCompletionRequestMessageRoleEnum = z.enum([
  "system",
  "user",
  "assistant",
  "function",
]);
export const ChatCompletionResponseMessageRoleEnum = z.enum([
  "system",
  "user",
  "assistant",
  "function",
]);

export const ChatCompletionFunctions = z.object({
  name: z.string().max(64),
  description: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

export const ChatCompletionRequestMessageFunctionCall = z.object({
  name: z.string().optional(),
  arguments: z.string().optional(),
});

export const ChatCompletionRequestMessage = z.object({
  role: ChatCompletionRequestMessageRoleEnum,
  content: z.string().optional(),
  name: z.string().max(64).optional(),
  function_call: ChatCompletionRequestMessageFunctionCall.optional(),
});

export const ChatCompletionResponseMessage = z.object({
  role: ChatCompletionResponseMessageRoleEnum,
  content: z.string().optional(),
  function_call: ChatCompletionRequestMessageFunctionCall.optional(),
});
