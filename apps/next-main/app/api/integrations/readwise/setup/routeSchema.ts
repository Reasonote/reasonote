import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ReadwiseSetupRoute = new ApiRoute({
  path: "/api/integrations/readwise/setup",
  method: "post",
  requestSchema: z.object({
    token: z.string().min(1, "Token is required"),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    integrationId: z.string().optional(),
    error: z.string().optional(),
  }),
}); 