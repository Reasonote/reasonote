import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SuggestNewNameRouteRequestSchema = z.object({
  skill: z.object({
    name: z.string(),
  }),
  documents: z.array(z.object({
    title: z.string(),
    content: z.string(),
    fileName: z.string(),
    fileType: z.string(),
  })),
});

export type SuggestNewNameRouteRequestIn = z.input<
  typeof SuggestNewNameRouteRequestSchema
>

export type SuggestNewNameRouteRequest = z.infer<
  typeof SuggestNewNameRouteRequestSchema
>

export const SuggestNewNameRouteResponseSchema = z.object({
  suggestedName: z.string(),
});

export type SuggestNewNameRouteResponse = z.infer<
  typeof SuggestNewNameRouteResponseSchema
>

export const SuggestNewNameRoute = new ApiRoute({
  path: "/api/skills/suggest_new_name",
  method: "post",
  requestSchema: SuggestNewNameRouteRequestSchema,
  responseSchema: SuggestNewNameRouteResponseSchema,
});