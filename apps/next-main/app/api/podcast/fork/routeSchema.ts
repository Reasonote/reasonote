import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ForkPodcastRoute = new ApiRoute({
  path: "/api/podcast/fork",
  method: "post",
  requestSchema: z.object({
    podcastId: z.string(),
  }),
  responseSchema: z.object({
    id: z.string(),
  }),
});