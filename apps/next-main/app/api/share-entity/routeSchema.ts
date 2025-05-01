import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ShareEntityRoute = new ApiRoute({
  path: "/api/share-entity",
  method: "post",
  requestSchema: z.object({
    entityId: z.string(),
    emails: z.array(z.string()),
    role: z.enum(['owner', 'editor', 'commenter', 'viewer']),
    redirectTo: z.string().optional().describe("The URL to redirect to after the user accepts the invite. If not provided, the user will be redirected to the app URL."),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    sharedWith: z.array(z.object({
      email: z.string(),
      userId: z.string(),
    })),
  }),
});