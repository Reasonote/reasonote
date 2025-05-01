import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk/routeHelpers";

const CheckoutSessionRouteRequestSchema = z.object({
  lookupKey: z.string(),
  couponCode: z.string().optional(),
});

const CheckoutSessionRouteResponseSchema = z.object({
  redirectUrl: z.string(),
});

export const CheckoutSessionRoute = new ApiRoute({
  path: "/api/cb/checkout_session",
  method: "post",
  requestSchema: CheckoutSessionRouteRequestSchema,
  responseSchema: CheckoutSessionRouteResponseSchema,
});
