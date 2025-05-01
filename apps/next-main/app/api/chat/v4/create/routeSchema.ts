import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const ChatV4CreateRouteRequestSchema = z.object({
  botIds: z.array(z.string()),
  contextItems: z.array(z.object({
    contextType: z.string(),
    contextId: z.string(),
    contextData: z.record(z.any()).optional(),
  })).optional(),
});
export type ChatV4CreateRouteRequestIn = z.input<
  typeof ChatV4CreateRouteRequestSchema
>;
export type ChatV4CreateRouteRequestOut = z.output<
  typeof ChatV4CreateRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const ChatV4CreateRouteResponseSchema = z.object({
  chatId: z.string(),
});
export type ChatV4CreateRouteResponse = z.infer<
  typeof ChatV4CreateRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const ChatV4CreateRoute = new ApiRoute({
  path: "/api/chat/v4/create",
  method: "post",
  requestSchema: ChatV4CreateRouteRequestSchema,
  responseSchema: ChatV4CreateRouteResponseSchema,
});
