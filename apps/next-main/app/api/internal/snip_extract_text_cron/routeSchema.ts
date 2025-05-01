import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SnipExtractTextCronRouteRequestSchema = z.object({
}).nullable().optional();
export type SnipExtractTextCronRouteRequestIn = z.input<
  typeof SnipExtractTextCronRouteRequestSchema
>

export type SnipExtractTextCronRouteRequest = z.infer<
  typeof SnipExtractTextCronRouteRequestSchema
>

export const SnipExtractTextCronRouteResponseSchema = z.object({
    result: z.array(z.object({
      id: z.string(),
      error: z.string().nullable().optional(),
      success: z.boolean(),
    }))
});

export const SnipExtractTextCronRoute = new ApiRoute({
    path: "/api/internal/snip_extract_text_cron",
    method: "post",
    requestSchema: SnipExtractTextCronRouteRequestSchema,
    responseSchema: SnipExtractTextCronRouteResponseSchema,
});