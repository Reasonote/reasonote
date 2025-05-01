export interface RNCtxInjectorInvokeConfig {
    name: string;
    /**
     * Optionally, a config object can be passed in to configure the context injector.
     * 
     * This will be deep merged with the default config for the context injector.
     */
    config?: any;
}