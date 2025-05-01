import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk/routeHelpers";

const CreateSubscriptionRouteRequestSchema = z.object({
  priceId: z.string(),
  paymentMethodId: z.string(),
});

const CreateSubscriptionRouteResponseSchema = z.object({
  subscriptionId: z.string(),
  status: z.string(),
});

export const CreateSubscriptionRoute = new ApiRoute({
  path: "/api/cb/create_subscription",
  method: "post",
  requestSchema: CreateSubscriptionRouteRequestSchema,
  responseSchema: CreateSubscriptionRouteResponseSchema,
}); 