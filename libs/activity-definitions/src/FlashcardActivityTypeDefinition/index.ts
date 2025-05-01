import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    FlashcardActivityConfig,
    FlashcardActivityConfigSchema,
    FlashcardResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class FlashcardActivityTypeDefinition {
    static type = "flashcard" as const;

    static typeHumanName = "Flashcard";

    static resultSchema = FlashcardResultSchema;

    static configSchema = FlashcardActivityConfigSchema;

    static hideScoreBarOnResults = true;
    
    static createEmptyConfig(): FlashcardActivityConfig {
        return {
            version: '0.0.0',
            type: 'flashcard',
            flashcardFront: "",
            flashcardBack: ""
        }
    }
    
    static aiStringifier = (config: FlashcardActivityConfig) => {
        return `
        # Flashcard Activity
        This is an activity where the user is shown a flashcard, and then asked to remember the answer.
        
        ## Config
        ### Front
        ${config.flashcardFront}
        
        ### Back
        ${config.flashcardBack}
        `
    }
}


staticValidateActivityTypeDefinition(FlashcardActivityTypeDefinition);
