import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const IntegrationsDocsProcessStorageRouteResponseSchema = z.object({
  documents: z.array(z.object({
    title: z.string(),
    content: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    pageId: z.string(),
    storagePath: z.string(),
  })),
});
export type IntegrationsDocsProcessStorageRouteResponse = z.infer<typeof IntegrationsDocsProcessStorageRouteResponseSchema>;

export const IntegrationsDocsProcessStorageRouteRequestSchema = z.object({
  storagePath: z.string().describe("The path to the file in the storage bucket"),
  fileName: z.string().describe("The original filename"),
  fileType: z.string().describe("The content type of the file"),
});
export type IntegrationsDocsProcessStorageRouteRequest = z.infer<typeof IntegrationsDocsProcessStorageRouteRequestSchema>;

export const IntegrationsDocsProcessStorageRoute = new ApiRoute({
  path: "/api/integrations/docs/process_storage",
  method: "post",
  requestSchema: IntegrationsDocsProcessStorageRouteRequestSchema,
  responseSchema: IntegrationsDocsProcessStorageRouteResponseSchema,
}); 