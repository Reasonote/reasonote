import { z } from "zod";

import {
    ActivityConfig,
    ActivityResultBase,
} from "./";

export interface ValidActivityTypeDefinition<TConfig extends ActivityConfig, TResult extends ActivityResultBase> {
    /** The typename for this activity type. */
    type: string;

    /** Human name for this activity type. */
    typeHumanName: string;

    /** The schema for the config for this activity. */
    configSchema: z.ZodSchema<TConfig, any, any>;

    /** The schema for the config for this activity. */
    resultSchema: z.ZodSchema<TResult, any, any>;

    /** Skip the result bar for this activity and go straight to the next activity. */
    skipResultBar?: boolean;

    /** Creates an empty config.
     * 
     * NOTE: this is *not* a promise, meaning it should be a simple json object output.
     */
    createEmptyConfig(): TConfig;

    /**
     * Hide Card Header.
     * 
     * This will be privileged.
     */
    hideCardHeader?: boolean;

    /** 
     * If true, the score bar on results will be hidden.
     */
    hideScoreBarOnResults?: boolean;

    /**
     * Activities can provide prompts which will be fed to the AI Generator.
     * 
     * These are not required, but are useful for activities which need to provide
     * specific instructions to the AI Generator.
     */
    aigenPrompts?: {
        /**
         * Specific instructions for the AI Generator.
         * 
         * If included, the AI will receive these instructions for generating this type of activity.
         */
        instructions?: string;

        /**
         * Final notes for the AI Generator.
         * 
         * These are included at the end of the system prompt, and can be used as reminders for critical details.
         */
        finalNotes?: string;
    };

    /**
     * If provided, this produces a string representation of the config, and the result if available.
     * @returns a string representation of the config and result.
     */
    aiStringifier?: (config: TConfig, result?: TResult) => string;
}

export function staticValidateActivityTypeDefinition<TConfig extends ActivityConfig, TResult extends ActivityResultBase>(act: ValidActivityTypeDefinition<TConfig, TResult>){}
