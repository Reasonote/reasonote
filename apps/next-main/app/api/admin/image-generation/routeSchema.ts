import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ImageGenerationRoute = new ApiRoute({
  path: "/api/admin/image-generation",
  method: "post",
  requestSchema: z.object({
    prompt: z.string(),
    model: z.string().optional().default("fal-ai/fast-sdxl"),
  }),
  responseSchema: z.object({
    success: z.boolean(),
    data: z.object({
      imageUrl: z.string(),
    }).optional(),
    error: z.any().optional(),
  }),
});
