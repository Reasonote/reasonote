import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const SpeechRoute = new ApiRoute({
    path: "/api/speech",
    method: "post",
    requestSchema: z.object({
      text: z.string(),
      voiceId: z.string(),
      provider: z.enum(["openai", "elevenlabs"]),
    }),
    responseSchema: z.object({
      audioUrl: z.string(),
    }),
  });