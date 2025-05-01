import {NextResponse} from "next/server";
import {z} from "zod";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {ApiRoute} from "@reasonote/lib-api-sdk";

const VoicesRoute = new ApiRoute({
  path: "/api/speech/voices",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.array(z.object({
    id: z.string(),
    name: z.string(),
    provider: z.enum(["elevenlabs", "openai"]),
    gender: z.string().optional(),
    description: z.string().optional(),
    settings: z.object({
      stability: z.number().optional(),
      similarity_boost: z.number().optional(),
      style: z.number().optional(),
      use_speaker_boost: z.boolean().optional(),
    }).optional(),
  })),
});

export const { POST } = makeServerApiHandlerV3({
  route: VoicesRoute,
  handler: async (ctx) => {
    const { ai } = ctx;

    try {
      const voices = await ai.audio.speech.getAllVoices();
      return NextResponse.json({voices});
    } catch (error) {
      console.error('Error fetching voices:', error);
      return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
    }
  }
});

