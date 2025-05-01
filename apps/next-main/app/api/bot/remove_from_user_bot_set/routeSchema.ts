import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RemoveFromUserBotSetRouteRequestSchema = z.object({
    removeBotIds: z.array(z.string()),
});
export type RemoveFromUserBotSetRouteRequestIn = z.input<
  typeof RemoveFromUserBotSetRouteRequestSchema
>

export type RemoveFromUserBotSetRouteRequest = z.infer<
  typeof RemoveFromUserBotSetRouteRequestSchema
>


export const RemoveFromUserBotSetRouteResponseSchema = z.object({
  botsRemoved: z.array(z.string()),
});

export const RemoveFromUserBotSetRoute = new ApiRoute({
    path: "/api/bot/remove_from_user_bot_set",
    method: "post",
    requestSchema: RemoveFromUserBotSetRouteRequestSchema,
    responseSchema: RemoveFromUserBotSetRouteResponseSchema,
});