import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    SocraticActivityConfig,
    SocraticActivityConfigSchema,
    SocraticResult,
    SocraticResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class SocraticActivityTypeDefinition {
    static type = "socratic" as const;

    static typeHumanName = "Socratic";

    static configSchema = SocraticActivityConfigSchema;

    static resultSchema = SocraticResultSchema;

    static createEmptyConfig(): SocraticActivityConfig {
      return {
          version: '0.0.0',
          type: SocraticActivityTypeDefinition.type,
          setting: {
            emoji: '',
            name: '',
            description: ''
          },
          skillName: '',
          learningObjectives: [],
      }
    }

    static aiStringifier = (config: SocraticActivityConfig, result?: SocraticResult) => {
      if (config.version === '0.0.0'){
        return trimAllLines(`
        # Socratic Activity
        This is an UNGRADED activity where the AI is trying to teach the student some ideas.

        The user is trying to achieve a set of objectives with their character.

        ## Config
        ### Main Subject
        ${config.skillName}

        ## Config
        ### Skill
        ${config.skillName}
        ### Setting
        #### Name: "${config.setting.name}"
        #### Description
        ${config.setting.description}

        -----------------------

        ${result ? `
          ## User's Result
          ### Conversation
          The conversation which took place during the roleplay is as follows:
          \`\`\`
          ${JSON.stringify(result?.resultData, null, 2)}
          \`\`\`
          `
          :
          ``
        }
        `)
      }
      else {
        return JSON.stringify({
          config,
          result
        });
      }
  }
}

staticValidateActivityTypeDefinition(SocraticActivityTypeDefinition);
