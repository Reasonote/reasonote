import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Schema for notification subscription preferences
export const NotificationSubscriptionSchema = z.object({
  daily_streak: z.boolean().optional(),
});

// Schema for getting and updating notification subscriptions
export const NotificationSubscriptionsRoute = new ApiRoute({
  path: "/api/notification-subscriptions",
  method: "post",
  requestSchema: NotificationSubscriptionSchema,
  responseSchema: z.object({
    id: z.string(),
    rsn_user_id: z.string(),
    daily_streak: z.boolean(),
    created_date: z.string(),
    updated_date: z.string(),
  }),
});

// Schema for getting notification subscription preferences
export const GetNotificationSubscriptionsRoute = new ApiRoute({
  path: "/api/notification-subscriptions/get",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    id: z.string(),
    rsn_user_id: z.string(),
    daily_streak: z.boolean(),
    created_date: z.string(),
    updated_date: z.string(),
  }),
}); 