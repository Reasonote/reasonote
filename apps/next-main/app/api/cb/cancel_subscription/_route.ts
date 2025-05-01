import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk/routeHelpers";

const CancelSubscriptionRouteRequestSchema = z.object({
  subscriptionId: z.string(),
});

const CancelSubscriptionRouteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const CancelSubscriptionRoute = new ApiRoute({
  path: "/api/cb/cancel_subscription",
  method: "post",
  requestSchema: CancelSubscriptionRouteRequestSchema,
  responseSchema: CancelSubscriptionRouteResponseSchema,
}); 