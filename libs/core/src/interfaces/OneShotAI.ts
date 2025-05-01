import { CoreMessage } from "ai";
import {
    z,
    ZodTypeAny,
} from "zod";

import { ChatDriverConfigNoKey } from "@reasonote/lib-ai-common";

/**
 * @deprecated
 */
export interface OneShotAIArgs<T extends ZodTypeAny>{
    systemMessage: string;
    functionName: string;
    functionDescription: string;
    otherMessages?: CoreMessage[];
    functionParameters: T;
    driverConfig?: ChatDriverConfigNoKey;
}

/**
 * @deprecated
 */
export type OneShotAIResponse<T extends ZodTypeAny> =  
| { success: true; data: z.infer<T>; error?: any }
| { success: false; error: any; data?: z.infer<T> }

/**
 * @deprecated
 */
export type OneShotAIFunction<T extends ZodTypeAny> = (args: OneShotAIArgs<T>) => Promise<OneShotAIResponse<T>>;