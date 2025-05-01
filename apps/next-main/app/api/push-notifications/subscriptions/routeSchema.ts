import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Schema for getting user's push notification subscriptions
export const PushNotificationGetSubscriptionsRoute = new ApiRoute({
  path: "/api/push-notifications/subscriptions",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    subscriptions: z.array(
      z.object({
        id: z.string(),
        endpoint: z.string(),
        createdDate: z.string(),
        userAgent: z.string().nullable(),
        lastUsedDate: z.string().nullable(),
      })
    ),
  }),
}); 