import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////

const AnkiIngestRouteRequestSchema = z.object({
  // targets: z
  //   .array(
  //     z.union([
  //       z.object({
  //         type: z.literal("database"),
  //         ids: z.array(z.string()),
  //       }),
  //       z.object({
  //         type: z.literal("page"),
  //         ids: z.array(z.string()),
  //       }),
  //     ])
  //   )
  //   .describe("The targets to ingest."),
});
export type AnkiIngestRouteRequestIn = z.input<
  typeof AnkiIngestRouteRequestSchema
>;
export type AnkiIngestRouteRequestOut = z.infer<
  typeof AnkiIngestRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const AnkiIngestRouteResponseSchema = z.object({
  cards: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).optional(),
      front: z.string().optional(),
      back: z.string().optional(),
    })
  ),
});
export type AnkiIngestRouteResponse = z.infer<
  typeof AnkiIngestRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const AnkiIngestRoute = new ApiRoute({
  path: "/api/integrations/anki/ingest",
  method: "post",
  requestSchema: AnkiIngestRouteRequestSchema,
  responseSchema: AnkiIngestRouteResponseSchema,
});
