import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SearchRsnVecRouteRequestSchema = z.object({
    text: z.string(),
    matchThreshold: z.number().optional().nullable(),
    matchCount: z.number().optional().nullable(),
    minContentLength: z.number().optional().nullable(),
    tablename: z.string().optional().nullable(),
    columnname: z.string().optional().nullable(),
    colpath: z.array(z.string()).optional().nullable(),
    embeddingColumn: z.enum(['embedding', 'embedding_openai_text_embedding_3_small']).optional().default('embedding'),
});
export type SearchRsnVecRouteRequestIn = z.input<
  typeof SearchRsnVecRouteRequestSchema
>

export type SearchRsnVecRouteRequest = z.infer<
  typeof SearchRsnVecRouteRequestSchema
>

const MatchResultDataEntrySchema = z.object({
  id: z.string(),
  raw_content: z.string(),
  similarity: z.number(),
  _ref_id: z.string(),
  result_tablename: z.string(),
  result_colname: z.string(),
  result_colpath: z.array(z.string()).optional().nullable(),
})

export const PostgrestErrorSchema = z.object({
    message: z.string(),
    details: z.string().optional().nullable(),
    hint: z.string().optional().nullable(),
    code: z.string().optional().nullable(),
    where: z.string().optional(),
    schema: z.string().optional(),
    table: z.string().optional().nullable(),
    column: z.string().optional().nullable(),
    constraint: z.string().optional().nullable(),
    file: z.string().optional().nullable(),
    line: z.string().optional().nullable(),
    routine: z.string().optional().nullable(),
});

export const SearchRsnVecRouteResponseSchema = z.object({
  count: z.number().optional().nullable(),
  error: PostgrestErrorSchema.optional().nullable(),
  data: z.array(MatchResultDataEntrySchema).nullable().optional(),
  status: z.number().optional().nullable(),
  statusText: z.string().optional().nullable(),
});

export const SearchRsnVecRoute = new ApiRoute({
    path: "/api/internal/search_rsn_vec",
    method: "post",
    requestSchema: SearchRsnVecRouteRequestSchema,
    responseSchema: SearchRsnVecRouteResponseSchema,
});