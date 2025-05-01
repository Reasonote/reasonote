import { z } from 'zod';

import { RNCoreContextMessage } from './RNAgent';

/**
 * CMR stands for "Context Message Renderer".
 * 
 * This is a function that takes as input a single message, and returns a string that will be added to the chat history.
 */
export interface RNAgentCMR {
    /**
     * The name of the CMR.
     */
    name: string;

    /**
     * The valid schema of the context message.
     */
    inSchema: z.ZodType<any>;

    /**
     * The function that will be called with the message, and will return a string that will be added to the chat history.
     */
    get(message: RNCoreContextMessage): Promise<string>
}


export interface RNAgentCMRInvokeConfig {
    type: string;
    config?: any;
}