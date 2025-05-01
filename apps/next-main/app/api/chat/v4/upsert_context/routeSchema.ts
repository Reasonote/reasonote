import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const ChatV4UpsertContextRouteRequestSchema = z.object({
  chatId: z.string(),
  contextType: z.string(),
  contextId: z.string(),
  contextData: z.record(z.any()).optional(),
});
export type ChatV4UpsertContextRouteRequestIn = z.input<
  typeof ChatV4UpsertContextRouteRequestSchema
>;
export type ChatV4UpsertContextRouteRequestOut = z.output<
  typeof ChatV4UpsertContextRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const ChatV4UpsertContextRouteResponseSchema = z.object({
  ids: z.array(z.string()),
});
export type ChatV4UpsertContextRouteResponse = z.infer<
  typeof ChatV4UpsertContextRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const ChatV4UpsertContextRoute = new ApiRoute({
  path: "/api/chat/v4/upsert_context",
  method: "post",
  requestSchema: ChatV4UpsertContextRouteRequestSchema,
  responseSchema: ChatV4UpsertContextRouteResponseSchema,
});
