import { z } from 'zod';

import {
  RESIChatDriverBaseRequestSchema,
} from '../../ChatDriverBase/ChatDriverBase';
import { OpenAIConfigSchema } from '../../OpenaiConfigSchema';

export const OpenaiChatDriverConfigSchema = z.object({
    type: z.literal("openai"),
    config: OpenAIConfigSchema,
});
export type OpenaiChatDriverConfig = z.infer<
    typeof OpenaiChatDriverConfigSchema
>;

export const ChatDriverOpenaiRequestSchema =
  RESIChatDriverBaseRequestSchema.extend({
    driverConfig: OpenaiChatDriverConfigSchema,
  });
export type ChatDriverOpenaiRequest = z.infer<
  typeof ChatDriverOpenaiRequestSchema
>;

export const ChatDriverOpenaiRequestNoKeySchema =
  ChatDriverOpenaiRequestSchema.shape.driverConfig.extend({
    config: ChatDriverOpenaiRequestSchema.shape.driverConfig.shape.config.extend({
      apiKey: z.string().nullable().optional(),
    }),
  });

export type ChatDriverOpenaiRequestNoKey = z.infer<
  typeof ChatDriverOpenaiRequestNoKeySchema
>;