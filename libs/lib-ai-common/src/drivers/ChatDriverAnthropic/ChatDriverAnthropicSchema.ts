import { z } from 'zod';

import {
  RESIChatDriverBaseRequestSchema,
} from '../../ChatDriverBase/ChatDriverBase';

export const AnthropicChatDriverConfigSchema = z.object({
  type: z.literal("anthropic"),
  config: z.object({
    model: z.string(),
  })
});
export type AnthropicChatDriverConfig = z.infer<
    typeof AnthropicChatDriverConfigSchema
>;

export const ChatDriverAnthropicRequestSchema =
  RESIChatDriverBaseRequestSchema.extend({
    driverConfig: AnthropicChatDriverConfigSchema,
  });
export type ChatDriverAnthropicRequest = z.infer<
  typeof ChatDriverAnthropicRequestSchema
>;

export const ChatDriverAnthropicRequestNoKeySchema =
  ChatDriverAnthropicRequestSchema.shape.driverConfig.extend({
    config: ChatDriverAnthropicRequestSchema.shape.driverConfig.shape.config.extend({
      apiKey: z.string().nullable().optional(),
    }),
  });

export type ChatDriverAnthropicRequestNoKey = z.infer<
  typeof ChatDriverAnthropicRequestNoKeySchema
>;