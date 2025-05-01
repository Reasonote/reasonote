import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const ExampleRouteRequestSchema = z.object({
  exampleObject: z.any(),
  exampleString: z.string(), 
}) 
export type ExampleRouteRequestIn = z.input<
  typeof ExampleRouteRequestSchema
>;
export type ExampleRouteRequestOut = z.output<
  typeof ExampleRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const ExampleRouteResponseSchema = z.object({
  exampleProcessedObject: z.any(),
  exampleProcessedString: z.string(),
});
export type ExampleRouteResponse = z.infer<
  typeof ExampleRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const ExampleRoute = new ApiRoute({
  path: "/api/route/to/example",
  method: "post",
  requestSchema: ExampleRouteRequestSchema,
  responseSchema: ExampleRouteResponseSchema,
});
