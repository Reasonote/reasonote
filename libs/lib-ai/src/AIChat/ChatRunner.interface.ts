import { z } from 'zod';

import { ChatDriverConfigNoKeySchema } from '@reasonote/lib-ai-common';

//////////////////////////////////////////////////////////////////////////
// REQUEST
export const ChatRunnerCompleteRequestSchema = z.object({
    chatId: z.string().describe("The chat id."),
    botId: z.string().optional().nullable().describe("The bot id. If none, a generic bot is used."),
    driverConfig: ChatDriverConfigNoKeySchema.describe("The driver config."),
})
export type ChatRunnerCompleteRequest = z.infer<typeof ChatRunnerCompleteRequestSchema>;