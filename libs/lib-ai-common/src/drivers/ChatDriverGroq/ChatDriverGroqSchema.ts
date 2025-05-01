import { z } from 'zod';

import {
  RESIChatDriverBaseRequestSchema,
} from '../../ChatDriverBase/ChatDriverBase';

export const GroqChatDriverConfigSchema = z.object({
  type: z.literal("groq"),
  config: z.object({
    model: z.string(),
  })
});
export type GroqChatDriverConfig = z.infer<
    typeof GroqChatDriverConfigSchema
>;

export const ChatDriverGroqRequestSchema =
  RESIChatDriverBaseRequestSchema.extend({
    driverConfig: GroqChatDriverConfigSchema,
  });
export type ChatDriverGroqRequest = z.infer<
  typeof ChatDriverGroqRequestSchema
>;

export const ChatDriverGroqRequestNoKeySchema =
  ChatDriverGroqRequestSchema.shape.driverConfig.extend({
    config: ChatDriverGroqRequestSchema.shape.driverConfig.shape.config.extend({
      apiKey: z.string().nullable().optional(),
    }),
  });

export type ChatDriverGroqRequestNoKey = z.infer<
  typeof ChatDriverGroqRequestNoKeySchema
>;