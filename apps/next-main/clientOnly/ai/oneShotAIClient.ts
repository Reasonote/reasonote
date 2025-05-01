import {ZodTypeAny} from "zod";

import {
  OneShotAIArgs,
  OneShotAIResponse,
} from "@reasonote/core";
import {driverConfigToRegistryString} from "@reasonote/lib-ai-common";

import {aib} from "./aib";

/**
 * @deprecated
 */
export async function oneShotAIClient<T extends ZodTypeAny>(params: OneShotAIArgs<T>): Promise<OneShotAIResponse<T>> {
  const _params = params;

  const driverConfig = _params.driverConfig;

  if (typeof window === "undefined") {
    throw new Error("oneShotAIClient is only available in the browser");
  }

  try {
    const res = await aib.genObject({
      system: _params.systemMessage,
      functionName: _params.functionName,
      functionDescription: _params.functionDescription,
      messages: _params.otherMessages,
      schema: _params.functionParameters,
      model: driverConfig ? driverConfigToRegistryString(driverConfig) : undefined,
    })

    return {
      success: true,
      data: res.object
    }
  }
  catch (e) {
    return {
      success: false,
      error: e
    }
  };
}
