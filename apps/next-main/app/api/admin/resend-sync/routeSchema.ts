import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ResendSyncRoute = new ApiRoute({
  path: "/api/admin/resend-sync",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    message: z.string(),
    results: z.array(z.object({
      user: z.string(),
      results: z.array(z.string()),
    })),
  }),
});