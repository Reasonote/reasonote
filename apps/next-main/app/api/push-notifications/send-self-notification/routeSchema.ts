import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Import the subscription schema from the subscribe endpoint
import {PushSubscriptionSchema} from "../subscribe/routeSchema";

// Schema for sending a test notification
export const PushNotificationSendSelfNotificationRoute = new ApiRoute({
  path: "/api/push-notifications/send-self-notification",
  method: "post",
  requestSchema: z.object({
    subscription: PushSubscriptionSchema,
    message: z.union([z.string(), z.record(z.any())]),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    code: z.string().optional(),
  }),
}); 