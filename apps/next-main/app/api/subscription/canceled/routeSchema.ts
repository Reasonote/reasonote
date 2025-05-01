import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const CanceledSubscriptionsRoute = new ApiRoute({
  path: "/api/subscription/canceled",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.array(z.object({
    stripe_subscription_id: z.string(),
    stripe_product_id: z.string(),
    stripe_product_name: z.string(),
    canceled_at: z.string().nullable(),
    cancellation_reason: z.string().nullable()
  })),
}); 