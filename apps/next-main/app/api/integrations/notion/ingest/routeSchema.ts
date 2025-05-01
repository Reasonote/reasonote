import { z } from "zod";

import { ApiRoute } from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////

const NotionIngestRouteRequestSchema = z.object({
  targets: z
    .array(
      z.union([
        z.object({
          type: z.literal("database"),
          ids: z.array(z.string()),
        }),
        z.object({
          type: z.literal("page"),
          ids: z.array(z.string()),
        }),
      ])
    )
    .describe("The targets to ingest."),
});
export type NotionIngestRouteRequestIn = z.input<
  typeof NotionIngestRouteRequestSchema
>;
export type NotionIngestRouteRequestOut = z.infer<
  typeof NotionIngestRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const NotionIngestRouteResponseSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
    })
  ),
});
export type NotionIngestRouteResponse = z.infer<
  typeof NotionIngestRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const NotionIngestRoute = new ApiRoute({
  path: "/api/integrations/notion/ingest",
  method: "post",
  requestSchema: NotionIngestRouteRequestSchema,
  responseSchema: NotionIngestRouteResponseSchema,
});
