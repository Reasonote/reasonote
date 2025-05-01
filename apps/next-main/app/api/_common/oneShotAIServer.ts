"use server"
import {CoreMessage} from "ai";
import {
  z,
  ZodTypeAny,
} from "zod";

import {anthropic} from "@ai-sdk/anthropic";
import {openai} from "@ai-sdk/openai";
import {genText} from "@reasonote/lib-ai";
import {ChatDriverConfigNoKey} from "@reasonote/lib-ai-common";

import {groq} from "./ai_models/groq";

export async function oneShotAIServer<T extends ZodTypeAny>(params: {
    systemMessage: string;
    functionName: string;
    functionDescription: string;
    otherMessages?: CoreMessage[];
    functionParameters: T;
    driverConfig?: ChatDriverConfigNoKey;
  }): Promise<
    | { success: true; data: z.infer<T>; error?: any }
    | { success: false; error: any; data?: z.infer<T> }
  > {
    const _params = params;
  
    const driverConfig = _params.driverConfig ?? {
      type: "openai",
      config: {
        model: "gpt-4o-mini",
      },
    };

    console.log(`Making request with params: ${JSON.stringify(params, null, 2)}, Using driver config: ${JSON.stringify(driverConfig)}`);

    /**
     * Get an AI model based on the given config
     */
    const getModel = (config) => {
        switch (config.type) {
            case 'anthropic': return anthropic(config.config.model);
            case 'openai': return openai(config.config.model);
            case 'groq': return groq(config.config.model);
            default: throw new Error(`Unsupported model type: ${config.type}`);
        }
    };

    /**
     * Perform the AI request, with retries using fallback models if the primary model fails.
     */
    const models = [
        getModel(driverConfig),
        getModel({ type: "openai", config: { model: "gpt-4o-mini" } }),
        // Add more fallback models here as needed
    ];

    const res = await genText({
      models,
      tools: {
          [params.functionName]: {
              description: params.functionDescription,
              parameters: params.functionParameters
          }
      },
      prompt: params.otherMessages ? undefined : params.systemMessage,
      messages: params.otherMessages ? 
          [
              {
                  role: "system",
                  content: params.systemMessage,
              },
              ...params.otherMessages
          ]
          :
          undefined,
      toolChoice: 'required'
  });

  const firstChoice = res?.toolCalls?.[0]?.args;

  if (!firstChoice) {
      return {
          success: false,
          error: new Error("No response from AI"),
      };
  }

  const parsed = _params.functionParameters.safeParse(firstChoice);

  if (!parsed.success) {
      return {
          success: false,
          error: parsed.error,
      };
  }

  return {
      success: true,
      data: parsed.data,
  };
}
  