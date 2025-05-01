/**
 * Config passed at invocation time to enable the tool.
 * 
 * Config values are optional, and will be deep-merged with the default config for the tool, overriding any values that are already set.
 */
export interface RNAgentToolInvokeConfig<TConfig> {
    /** Name of the tool to target with this config. */
    name: string;

    /** Any extra parameters to pass to the tool. */
    config?: TConfig;
}