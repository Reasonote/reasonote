import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const GetEmbeddingRouteRequestSchema = z.object({
    text: z.string(),
});
export type GetEmbeddingRouteRequestIn = z.input<
  typeof GetEmbeddingRouteRequestSchema
>

export type GetEmbeddingRouteRequest = z.infer<
  typeof GetEmbeddingRouteRequestSchema
>

export const GetEmbeddingRouteResponseSchema = z.object({
    embedding: z.array(z.number()),
});

export const GetEmbeddingRoute = new ApiRoute({
    path: "/api/internal/get_embedding",
    method: "post",
    requestSchema: GetEmbeddingRouteRequestSchema,
    responseSchema: GetEmbeddingRouteResponseSchema,
});