import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SlowEmbeddingGroupRouteRequestSchema = z.object({
    query: z.string(),
    groups: z.array(
      z.object({
        groupId: z.string(),
        texts: z.array(z.string()), 
      })
    ),
});
export type SlowEmbeddingGroupRouteRequestIn = z.input<
  typeof SlowEmbeddingGroupRouteRequestSchema
>

export type SlowEmbeddingGroupRouteRequest = z.infer<
  typeof SlowEmbeddingGroupRouteRequestSchema
>

export const SlowEmbeddingGroupRouteResponseSchema = z.object({
    groupSimilarities: z.array(
      z.object({
        groupId: z.string(),
        similarityScore: z.number(),
      })
    ),
});

export const SlowEmbeddingGroupRoute = new ApiRoute({
    path: "/api/internal/slow_embedding_group",
    method: "post",
    requestSchema: SlowEmbeddingGroupRouteRequestSchema,
    responseSchema: SlowEmbeddingGroupRouteResponseSchema,
});