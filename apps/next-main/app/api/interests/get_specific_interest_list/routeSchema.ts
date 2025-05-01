import {z} from "zod";

import {ChatDriverConfigNoKeySchema} from "@reasonote/lib-ai-common";
import {ApiRoute} from "@reasonote/lib-api-sdk";

export const InterestsGetSpecificInterestListRouteRequestSchema = z.object({
  fullListOfInterests: z.array(z.object({emoji: z.string().optional(), name: z.string()})),
  userSelectedInterests: z.array(z.object({emoji: z.string().optional(), name: z.string()})),
  driverConfig: ChatDriverConfigNoKeySchema.optional(),
});
export type InterestsGetSpecificInterestListRouteRequestIn = z.input<
  typeof InterestsGetSpecificInterestListRouteRequestSchema
>

export type InterestsGetSpecificInterestListRouteRequest = z.infer<
  typeof InterestsGetSpecificInterestListRouteRequestSchema
>

export const InterestsGetSpecificInterestListRouteResponseSchema = z.object({
  interests: z.array(z.object({emoji: z.string(), name: z.string()})),
});

export const InterestsGetSpecificInterestListRoute = new ApiRoute({
    path: "/api/interests/get_specific_interest_list",
    method: "post",
    requestSchema: InterestsGetSpecificInterestListRouteRequestSchema,
    responseSchema: InterestsGetSpecificInterestListRouteResponseSchema,
});