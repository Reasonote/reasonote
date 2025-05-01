import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk/routeHelpers";

const CreatePaymentIntentRouteRequestSchema = z.object({
  lookupKey: z.string(),
  couponCode: z.string().optional(),
});

const CreatePaymentIntentRouteResponseSchema = z.object({
  clientSecret: z.string(),
  isSetupIntent: z.boolean(),
  priceInfo: z.object({
    priceId: z.string(),
    unitAmount: z.number(),
    currency: z.string(),
    interval: z.string(),
    originalAmount: z.number().optional(),
    discountAmount: z.number().optional(),
    discountName: z.string().optional(),
    productName: z.string().optional(),
  }),
});

export const CreatePaymentIntentRoute = new ApiRoute({
  path: "/api/cb/create_payment_intent",
  method: "post",
  requestSchema: CreatePaymentIntentRouteRequestSchema,
  responseSchema: CreatePaymentIntentRouteResponseSchema,
}); 