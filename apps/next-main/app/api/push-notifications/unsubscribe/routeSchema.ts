import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

// Import the subscription schema from the subscribe endpoint
import {PushSubscriptionSchema} from "../subscribe/routeSchema";

// Schema for unsubscribing from push notifications
export const PushNotificationUnsubscribeRoute = new ApiRoute({
  path: "/api/push-notifications/unsubscribe",
  method: "post",
  requestSchema: PushSubscriptionSchema,
  responseSchema: z.object({
    success: z.boolean(),
  }),
}); 