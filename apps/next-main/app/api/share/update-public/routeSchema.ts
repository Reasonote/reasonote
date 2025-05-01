import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const UpdatePublicShareRoute = new ApiRoute({
  path: "/api/share/update-public",
  method: "post",
  requestSchema: z.object({
    entityId: z.string(),
    entityType: z.string(),
    isPublic: z.boolean(),
  }),
  responseSchema: z.object({
    success: z.boolean(),
  }),
}); 