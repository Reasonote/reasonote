import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Schema for sending a notification to a specific user
export const PushNotificationSendToUserRoute = new ApiRoute({
  path: "/api/push-notifications/send-to-user",
  method: "post",
  requestSchema: z.object({
    userId: z.string(),
    title: z.string(),
    body: z.string(),
    icon: z.string().optional(),
    url: z.string().optional(),
    data: z.record(z.any()).optional(),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    sent: z.number(),
    failed: z.number(),
    errors: z.array(z.string()).optional(),
  }),
}); 