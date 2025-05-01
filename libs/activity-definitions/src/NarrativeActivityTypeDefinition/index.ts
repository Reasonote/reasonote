import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    NarrativeActivityConfig,
    NarrativeActivityConfigSchema,
    NarrativeActivityResult,
    NarrativeActivityResultSchema,
} from "./schema";

export * from './schema';

export class NarrativeActivityTypeDefinition {
    static type = "narrative" as const;

    static typeHumanName = "Narrative";

    static resultSchema = NarrativeActivityResultSchema;

    static configSchema = NarrativeActivityConfigSchema;

    static createEmptyConfig(): NarrativeActivityConfig {
        // Provides a base configuration for new narratives, ensuring all required fields are initialized
        return {
            version: '0.0.0',
            type: NarrativeActivityTypeDefinition.type,
            narrativeText: "",
            metadata: {
                genRequest: {},
            },
            // Initialize other fields as necessary
        };
    }

    static aiStringifier = (config: NarrativeActivityConfig, result?: NarrativeActivityResult) => {
      
      if (config.version === '0.0.0'){
        return trimAllLines(`
        # Narrative Activity
        ## Config
        ${JSON.stringify(config, null, 2)}

        ## Result
        ${JSON.stringify(result, null, 2)}
        `)
      }
      else {
        return JSON.stringify({
          config,
          result
        })
      }
    }
}

// Ensure the activity class is validated
staticValidateActivityTypeDefinition(NarrativeActivityTypeDefinition);