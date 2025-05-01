import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Schema for sending daily streak notifications
export const PushNotificationSendDailyStreakRoute = new ApiRoute({
  path: "/api/push-notifications/send-daily-streak",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    success: z.boolean(),
    sent: z.number(),
    failed: z.number(),
  }),
}); 