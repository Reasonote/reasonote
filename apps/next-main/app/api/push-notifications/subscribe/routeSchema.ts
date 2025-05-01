import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Schema for the subscription object from the browser
export const PushSubscriptionSchema = z.object({
  endpoint: z.string(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// Schema for subscribing to push notifications
export const PushNotificationSubscribeRoute = new ApiRoute({
  path: "/api/push-notifications/subscribe",
  method: "post",
  requestSchema: PushSubscriptionSchema,
  responseSchema: z.object({
    success: z.boolean(),
    subscriptionId: z.string().optional(),
  }),
}); 