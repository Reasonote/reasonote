import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const AIServeRouteRequestSchema = z.object({
    function: z.string().describe("The function to call."),
    args: z.any().describe("The arguments to pass to the function."),
});
export type AIServeRouteRequestIn = z.input<
  typeof AIServeRouteRequestSchema
>;
export type AIServeRouteRequestOut = z.output<
  typeof AIServeRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const AIServeRouteResponseSchema = z.any();
export type AIServeRouteResponse = z.infer<
  typeof AIServeRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const AIServeRoute = new ApiRoute({
  path: "/api/ai/serve-text-stream",
  method: "post",
  requestSchema: AIServeRouteRequestSchema,
  responseSchema: AIServeRouteResponseSchema,
});
