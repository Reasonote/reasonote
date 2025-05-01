import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const YoutubeTranscriptRouteRequestSchema = z.object({
  youtubeUrl: z.string().url(),
  skipAiProcessing: z.boolean().optional().default(false),
}) 

export type YoutubeTranscriptRouteRequestIn = z.input<
  typeof YoutubeTranscriptRouteRequestSchema
>;

export type YoutubeTranscriptRouteRequestOut = z.output<
  typeof YoutubeTranscriptRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const YoutubeTranscriptRouteResponseSchema = z.object({
  transcript: z.string(),
  aiTranscript: z.string(),
});

export type YoutubeTranscriptRouteResponse = z.infer<
  typeof YoutubeTranscriptRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const YoutubeTranscriptRoute = new ApiRoute({
  path: "/api/integrations/youtube/getTranscript",
  method: "post",
  requestSchema: YoutubeTranscriptRouteRequestSchema,
  responseSchema: YoutubeTranscriptRouteResponseSchema,
});