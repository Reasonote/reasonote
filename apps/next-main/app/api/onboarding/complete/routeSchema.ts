import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const OnboardingCompleteRouteRequestSchema = z.object({});
export type OnboardingCompleteRouteRequestIn = z.input<
  typeof OnboardingCompleteRouteRequestSchema
>

export type OnboardingCompleteRouteRequest = z.infer<
  typeof OnboardingCompleteRouteRequestSchema
>

export const OnboardingCompleteRouteResponseSchema = z.object({
  success: z.boolean(),
});

export const OnboardingCompleteRoute = new ApiRoute({
    path: "/api/onboarding/complete",
    method: "post",
    requestSchema: OnboardingCompleteRouteRequestSchema,
    responseSchema: OnboardingCompleteRouteResponseSchema,
});