import {z} from "zod";

export const OpenAIChatModelsEnumSchema = z.union([
  // GPT-3.5-Turbo
  z.literal("gpt-3.5-turbo"),
  z.literal("gpt-3.5-turbo-0613"),
  // GPT-3.5-Turbo-16k
  z.literal("gpt-3.5-turbo-16k"),
  z.literal("gpt-3.5-turbo-16k-0613"),
  // GPT-4 models
  z.literal("gpt-4"),
  z.literal("gpt-4-0613"),
  // GPT-4 32k models
  z.literal("gpt-4-32k"),
  z.literal("gpt-4-32k-0613"),
  // GPT-4-Turbo
  z.literal("gpt-4-1106-preview"),
  z.literal("gpt-4-vision-preview"),
  // GPT-4-Turbo-0125-preview
  z.literal("gpt-4-0125-preview"),
  z.literal("gpt-4-turbo-2024-04-09"),
  z.literal("gpt-4-turbo"),
  z.literal('gpt-4o')
]);
export type OpenAIChatModelsEnum = z.infer<typeof OpenAIChatModelsEnumSchema>;
