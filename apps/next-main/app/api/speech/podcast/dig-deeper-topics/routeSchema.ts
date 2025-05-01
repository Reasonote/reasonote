import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const DigDeeperTopicsRoute = new ApiRoute({
  path: "/api/speech/podcast/dig-deeper-topics",
  method: "post",
  requestSchema: z.object({
    podcastLineId: z.string(),
  }),
  responseSchema: z.object({
    digDeeperTopics: z.array(z.string()),
  }),
});

