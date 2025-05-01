import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
export const StudyNowRouteRequestSchema = z.object({
  // Common fields for all content types
  url: z.string().url(),
  title: z.string(),
  contentType: z.enum(["youtube", "webpage"]),
  
  // YouTube specific fields
  videoId: z.string().optional(),
  channelName: z.string().optional(),
  channelUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  
  // Regular webpage specific fields
  pageContent: z.string().optional(),
});

export type StudyNowRouteRequestIn = z.input<
  typeof StudyNowRouteRequestSchema
>;

export type StudyNowRouteRequestOut = z.output<
  typeof StudyNowRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const StudyNowRouteResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  contentType: z.enum(["youtube", "webpage"]),
  snipId: z.string(),
  hasTranscript: z.boolean().optional(),
});

export type StudyNowRouteResponse = z.infer<
  typeof StudyNowRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const StudyNowRoute = new ApiRoute({
  path: "/api/extension/actions/study_now",
  method: "post",
  requestSchema: StudyNowRouteRequestSchema,
  responseSchema: StudyNowRouteResponseSchema,
}); 