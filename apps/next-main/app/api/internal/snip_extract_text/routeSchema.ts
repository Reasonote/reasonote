import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SnipExtractTextRouteRequestSchema = z.object({
  snipId: z.string(),
});
export type SnipExtractTextRouteRequestIn = z.input<
  typeof SnipExtractTextRouteRequestSchema
>

export type SnipExtractTextRouteRequest = z.infer<
  typeof SnipExtractTextRouteRequestSchema
>

export const SnipExtractTextRouteResponseSchema = z.object({
    markdownResult: z.string(),
});

export const SnipExtractTextRoute = new ApiRoute({
    path: "/api/internal/snip_extract_text",
    method: "post",
    requestSchema: SnipExtractTextRouteRequestSchema,
    responseSchema: SnipExtractTextRouteResponseSchema,
});