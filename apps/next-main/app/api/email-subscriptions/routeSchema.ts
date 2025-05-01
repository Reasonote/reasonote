import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const EmailSubscriptionsRoute = new ApiRoute({
  path: "/api/email-subscriptions",
  method: "post",
  requestSchema: z.object({
    product_updates: z.boolean().optional(),
    edtech_updates: z.boolean().optional(),
    newsletter: z.boolean().optional(),
    email: z.string().email().optional(),
  }),
  responseSchema: z.union([
    z.object({
      id: z.string(),
      rsn_user_id: z.string(),
      product_updates: z.boolean(),
      edtech_updates: z.boolean(),
      newsletter: z.boolean(),
      account_updates: z.boolean(),
    }),
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  ]),
});