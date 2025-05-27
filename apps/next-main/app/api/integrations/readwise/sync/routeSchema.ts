import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ReadwiseSyncRoute = new ApiRoute({
  path: "/api/integrations/readwise/sync",
  method: "post",
  requestSchema: z.object({
    integrationId: z.string().min(1, "Integration ID is required"),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    error: z.string().optional(),
  }),
}); 