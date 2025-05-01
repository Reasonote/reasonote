import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const VoicesRoute = new ApiRoute({
  path: "/api/speech/voices",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    voices: z.array(z.object({
      id: z.string(),
      name: z.string(),
      provider: z.enum(["elevenlabs", "openai"]),
      gender: z.string().nullish(),
      description: z.string().nullish(),
      settings: z.object({
        stability: z.number().nullish(),
        similarity_boost: z.number().nullish(),
        style: z.number().nullish(),
        use_speaker_boost: z.boolean().nullish(),
      }).nullish(),
      tags: z.union([z.array(z.string()), z.null(), z.string()]).nullish(),
    })),
  }),
});
