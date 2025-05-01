import { DeepPartial } from 'ai';
import { merge } from 'lodash';

import { AI } from '../../../';

export abstract class RNCtxInjector<TConfig = any> {
    // Static registry to store all implementation classes
    private static implementations: Map<string, new (...args: any[]) => RNCtxInjector> = new Map();

    abstract name: string;
    abstract defaultConfig?: DeepPartial<TConfig> | null;
    
    /**
     * Register a context injector implementation
     */
    static register(implementation: new (...args: any[]) => RNCtxInjector) {
        // Create temporary instance to get the name
        const temp = new implementation();
        RNCtxInjector.implementations.set(temp.name, implementation);
    }

    /**
     * Get all registered context injector implementations
     */
    static getImplementations(): Map<string, new (...args: any[]) => RNCtxInjector> {
        return RNCtxInjector.implementations;
    }

    /**
     * Get new instances of all registered context injector implementations
     */
    static getNewImplementations(): RNCtxInjector[] {
        return Array.from(RNCtxInjector.implementations.values()).map(i => new i());
    }

    /**
     * Create a new instance of a specific context injector by name
     */
    static create(name: string): RNCtxInjector | undefined {
        const Implementation = RNCtxInjector.implementations.get(name);
        return Implementation ? new Implementation() : undefined;
    }

    /**
     * Get the context injector contents.
     * 
     * This should generally not be called directly, but instead through the `get` method.
      */
    abstract _get(ai: AI, resolvedConfig?: TConfig): Promise<{name: string, description?: string, content: string}>;

    /**
     * Get the context injector contents, merging the default config with the provided config overrides.
     * 
     * @param configOverrides The overrides to apply to the default config.
     * @returns The context injector contents.
     */
    async get(ai: AI, configOverrides?: DeepPartial<TConfig>): Promise<{name: string, description?: string, content: string}> {
        // Deep merge configOverrides with the config from the class using lodash merge
        const config = merge({}, (this.defaultConfig ?? {}), configOverrides);

        // TODO actually check if it matches config schema after merging?
        return this._get(ai, config as TConfig);
    }
}