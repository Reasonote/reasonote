import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const InterestsGetGenericInterestListRouteRequestSchema = z.object({}).nullable().optional();
export type InterestsGetGenericInterestListRouteRequestIn = z.input<
  typeof InterestsGetGenericInterestListRouteRequestSchema
>

export type InterestsGetGenericInterestListRouteRequest = z.infer<
  typeof InterestsGetGenericInterestListRouteRequestSchema
>


export const InterestsGetGenericInterestListRouteResponseSchema = z.object({
  interests: z.array(z.object({emoji: z.string(), name: z.string()})),
});

export const InterestsGetGenericInterestListRoute = new ApiRoute({
    path: "/api/interests/get_generic_interest_list",
    method: "post",
    requestSchema: InterestsGetGenericInterestListRouteRequestSchema,
    responseSchema: InterestsGetGenericInterestListRouteResponseSchema,
});