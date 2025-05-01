import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SharePodcastRoute = new ApiRoute({
  path: "/api/podcast/share",
  method: "post",
  requestSchema: z.object({
    podcastId: z.string(),
  }),
  responseSchema: z.object({
    newPodcastId: z.string().describe("The ID of the podcast that was shared, a clone of the original podcast."),
  }),
});