import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const AddtoUserBotSetRouteRequestSchema = z.object({
    addIds: z.array(z.string()),
});
export type AddtoUserBotSetRouteRequestIn = z.input<
  typeof AddtoUserBotSetRouteRequestSchema
>

export type AddtoUserBotSetRouteRequest = z.infer<
  typeof AddtoUserBotSetRouteRequestSchema
>

export const AddtoUserBotSetRouteResponseSchema = z.object({
  botSetId: z.string(),
  botSetBotIds: z.array(z.string()),
  botIds: z.array(z.string()),
});

export const AddtoUserBotSetRoute = new ApiRoute({
    path: "/api/bot/add_to_user_bot_set",
    method: "post",
    requestSchema: AddtoUserBotSetRouteRequestSchema,
    responseSchema: AddtoUserBotSetRouteResponseSchema,
});