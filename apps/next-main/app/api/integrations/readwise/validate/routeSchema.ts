import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ReadwiseValidateRoute = new ApiRoute({
  path: "/api/integrations/readwise/validate",
  method: "post",
  requestSchema: z.object({
    token: z.string().min(1, "Token is required"),
  }),
  responseSchema: z.object({
    valid: z.boolean(),
    error: z.string().optional(),
  }),
}); 