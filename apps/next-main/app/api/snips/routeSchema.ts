import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SnipsPOSTRouteRequestSchema = z.object({
    type: z.string(),
    textContent: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
});
export type SnipsPOSTRequestIn = z.input<
  typeof SnipsPOSTRouteRequestSchema
>

export type SnipsPOSTRequest = z.infer<
  typeof SnipsPOSTRouteRequestSchema
>

export const SnipsPOSTRouteResponseSchema = z.object({
    id: z.string(),
    type: z.string(),
    textContent: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
});

export const SnipsPOSTRoute = new ApiRoute({
    path: "/api/snips",
    method: "post",
    requestSchema: SnipsPOSTRouteRequestSchema,
    responseSchema: SnipsPOSTRouteResponseSchema,
});