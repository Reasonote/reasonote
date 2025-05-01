import { z } from 'zod';

import { ResiChatDriverResponseSchema } from '@reasonote/lib-ai-common';

import {
  AnthropicChatDriverConfigSchema,
  ChatDriverAnthropicRequestSchema,
} from './ChatDriverAnthropic';
import {
  ChatDriverGroqRequestSchema,
  GroqChatDriverConfigSchema,
} from './ChatDriverGroq';
import {
  ChatDriverOpenaiRequestNoKeySchema,
  ChatDriverOpenaiRequestSchema,
  OpenaiChatDriverConfigSchema,
} from './ChatDriverOpenai';

export const ChatDriverRequestSchema = z.union([
    ChatDriverOpenaiRequestSchema, 
    ChatDriverAnthropicRequestSchema,
    ChatDriverGroqRequestSchema,
]);
export type ChatDriverRequest = z.infer<typeof ChatDriverRequestSchema>;

export const ChatDriverNoKeyRequestSchema = z.union([
    ChatDriverOpenaiRequestNoKeySchema,
    ChatDriverAnthropicRequestSchema,
    ChatDriverGroqRequestSchema,
]);


export const ChatDriverResponseSchema = ResiChatDriverResponseSchema;
export type ChatDriverResponse = z.infer<typeof ChatDriverResponseSchema>;

/**
 * CONFIG SCHEMAS
 */
export const ChatDriverConfigSchema = z.union([
    OpenaiChatDriverConfigSchema,
    AnthropicChatDriverConfigSchema,
    GroqChatDriverConfigSchema,
])
export type ChatDriverConfig = z.infer<
    typeof ChatDriverConfigSchema
>;

/**
 * NO-KEY CONFIG SCHEMAS
 */
export const ChatDriverConfigNoKeySchema = z.union([
    // TODO: ugly, shouldn't be request??
    ChatDriverOpenaiRequestNoKeySchema,
    AnthropicChatDriverConfigSchema,
    GroqChatDriverConfigSchema,
])
export type ChatDriverConfigNoKey = z.infer<
    typeof ChatDriverConfigNoKeySchema
>;