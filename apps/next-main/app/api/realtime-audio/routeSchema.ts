import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const RealtimeAudioRoute = new ApiRoute({
    path: "/api/realtime-audio",
    method: "post",
    requestSchema: z.object({
      text: z.string(),
      style: z.string()
    }),
    responseSchema: z.object({
      audioChunks: z.array(z.string()),
    }),
  });