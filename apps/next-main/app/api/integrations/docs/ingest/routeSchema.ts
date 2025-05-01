import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const IngestDocsLessonPlanSchema = z.object({
  lessonTitle: z.string(),
  lessonDescription: z.string(),
});

export const IntegrationsDocsIngestRouteResponseSchema = z.object({
  documents: z.array(z.object({
    title: z.string(),
    content: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    pageId: z.string(),
  })),
});
export type IntegrationsDocsIngestRouteResponse = z.infer<typeof IntegrationsDocsIngestRouteResponseSchema>;

export const IntegrationsDocsIngestRouteRequestSchema = z.object({});

export const IntegrationsDocsIngestRoute = new ApiRoute({
  path: "/api/integrations/docs/ingest",
  method: "post",
  requestSchema: IntegrationsDocsIngestRouteRequestSchema,
  responseSchema: IntegrationsDocsIngestRouteResponseSchema,
});