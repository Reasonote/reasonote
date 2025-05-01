import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SpeechPodcastVoiceRoute = new ApiRoute({
    path: "/api/speech/podcast/voice",
    method: "post",
    requestSchema: z.object({
      podcast_line_id: z.string(),
    }),
    responseSchema: z.object({
      audioFile: z.string(),
      podcast_line_id: z.string(),
      character: z.string(),
      dialogue: z.string(),
      speed: z.number(),
    }),
})