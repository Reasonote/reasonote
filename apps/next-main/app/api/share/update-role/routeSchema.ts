import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const UpdateShareRoleRoute = new ApiRoute({
  path: "/api/share/update-role",
  method: "post",
  requestSchema: z.object({
    memauthId: z.string(),
    role: z.enum(['editor', 'commenter', 'viewer']),
  }),
  responseSchema: z.object({
    success: z.boolean(),
  }),
}); 