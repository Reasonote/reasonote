import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Schema for getting users with push notification subscriptions
export const PushNotificationUsersWithSubscriptionsRoute = new ApiRoute({
  path: "/api/push-notifications/users-with-subscriptions",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    users: z.array(
      z.object({
        id: z.string(),
        email: z.string().optional(),
        subscription_count: z.number(),
      })
    ),
  }),
}); 