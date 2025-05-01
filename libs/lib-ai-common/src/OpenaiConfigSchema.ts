import { z } from 'zod';

export const OpenAIConfigSchema = z.object({
  apiKey: z.string().describe("The OpenAI API key to use."),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stop: z
    .array(z.string())
    .optional()
    .describe(
      "Up to 4 sequences where the API will stop generating further tokens."
    ),
  max_tokens: z.number().min(1).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  logit_bias: z.map(z.string(), z.number().min(-100).max(100)).optional(),
});
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>;