import { z } from 'zod';

import { AI } from '../../../';

type ZodObjectAny = z.ZodObject<any, any, any, any>;


export interface RNAgentTool<TIn extends ZodObjectAny, TOut extends ZodObjectAny, TConfig> {
    /**
     * The name of the tool.
     */
    name: string;

    /**
     * The config for the tool.
     */
    config?: TConfig;

    /**
     * The description of the tool.
     */
    description?: string;

    /**
     * The arguments for the tool.
     */
    args: TIn;

    /**
     * Whether or not this tool will call the AI again after it has completed.
     */
    requiresIteration?: boolean;

    /**
     * The result of the tool.
     */
    result?: TOut;

    /**
     * Tool "loading" name.
     */
    loadingName?: string;

    /**
     * Clone the tool with a new config.
     * 
     * @param config - The new config to use.
     * @returns A new instance of the tool with the new config.
     */
    clone?(config?: TConfig): this;
    /**
     * Invoke the tool.
     * 
     * @param args - The arguments to pass to the tool.
     * @returns The result of the tool.
     */
    invoke?(args: z.infer<TIn>, provider: AI): Promise<z.infer<TOut>>;

    /**
     * Explain the tool to the AI
     * 
     * @returns A string explaining the tool to the AI.
     */
    explain?(): Promise<string>;
}