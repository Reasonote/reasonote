import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const AnalyzerBaseSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
  })
  .passthrough();

export const AnalyzerSimplePromptSchema = AnalyzerBaseSchema.extend({
  type: z.literal("simple-prompt"),
  prompt: z.string(),
});
export type AnalyzerSimplePrompt = z.infer<typeof AnalyzerSimplePromptSchema>;

export const AnalyzerSimplePromptResultSchema = z.object({
  type: z.literal("simple-prompt"),
  result: z.string(),
});
export type AnalyzerSimplePromptResult = z.infer<
  typeof AnalyzerSimplePromptResultSchema
>;

export const JsonSchemaOutputAnalyzerSchema = AnalyzerBaseSchema.extend({
  type: z.literal("schema-output"),
  jsonSchema: z.any(),
  prompt: z.string().optional().nullable(),
});
export type AnalyzerJSONSchemaOutput = z.infer<
  typeof JsonSchemaOutputAnalyzerSchema
>;

export const JsonSchemaAnalyzerResultSchema = z.object({
  type: z.literal("schema-output"),
  resultObject: z.object({
    parsedResult: z.any(),
    rawTextResult: z.string().nullable().optional(),
  }),
});
export type JsonSchemaAnalyzerResult = z.infer<
  typeof JsonSchemaAnalyzerResultSchema
>;

export const AnalyzerSchema = z.union([
  AnalyzerSimplePromptSchema,
  JsonSchemaOutputAnalyzerSchema,
]);

export const AnalyzerResultAnalysisSchema = z.union([
  JsonSchemaAnalyzerResultSchema,
  AnalyzerSimplePromptResultSchema,
]);
export type AnalyzerResultAnalysis = z.infer<
  typeof AnalyzerResultAnalysisSchema
>;

export type Analyzer = z.infer<typeof AnalyzerSchema>;

export const AnalysisResultSchema = z.object({
  analyzer: AnalyzerSchema,
  analysis: AnalyzerResultAnalysisSchema,
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalysisDocumentSchema = z.object({
  id: z.string(),
  metadata: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  content: z.string(),
});
export type AnalysisDocument = z.infer<typeof AnalysisDocumentSchema>;

const AnalysisRouteRequestSchema = z.object({
  documents: AnalysisDocumentSchema.array(),
  analyzers: AnalyzerSchema.array(),
});

const AnalysisRouteResponseSchema = z.object({
  analyses: AnalysisResultSchema.array(),
});

export const AnalysisRoute = new ApiRoute({
  path: "/api/analysis",
  method: "post",
  requestSchema: AnalysisRouteRequestSchema,
  responseSchema: AnalysisRouteResponseSchema,
});
