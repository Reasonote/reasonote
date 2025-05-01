import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RemoveShareAccessRoute = new ApiRoute({
  path: "/api/share/remove-access",
  method: "post",
  requestSchema: z.object({
    memauthId: z.string(),
  }),
  responseSchema: z.object({
    success: z.boolean(),
  }),
}); 