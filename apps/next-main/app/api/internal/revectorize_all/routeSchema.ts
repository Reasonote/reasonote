import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RevectorizeAllRouteRequestSchema = z.object({
  magicWord: z.string(),
});
export type RevectorizeAllRouteRequestIn = z.input<
  typeof RevectorizeAllRouteRequestSchema
>

export type RevectorizeAllRouteRequest = z.infer<
  typeof RevectorizeAllRouteRequestSchema
>

export const RevectorizeAllRouteResponseSchema = z.object({
    results: z.array(z.object({
      tablename: z.string(),
      colname: z.string().nullable().optional(),
      colpath: z.array(z.string()).nullable().optional(),
      numQueuedVecs: z.number(),
      numVecsFailedToQueue: z.number(),
    })),
});

export const RevectorizeAllRoute = new ApiRoute({
    path: "/api/internal/revectorize_all",
    method: "post",
    requestSchema: RevectorizeAllRouteRequestSchema,
    responseSchema: RevectorizeAllRouteResponseSchema,
});