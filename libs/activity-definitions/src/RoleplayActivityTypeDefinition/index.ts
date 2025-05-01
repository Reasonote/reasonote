import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    RoleplayActivityConfig,
    RoleplayActivityConfigSchema,
    RoleplayResult,
    RoleplayResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class RoleplayActivityTypeDefinition {
    static type = "roleplay" as const;

    static typeHumanName = "Roleplay";

    static configSchema = RoleplayActivityConfigSchema;

    static resultSchema = RoleplayResultSchema;

    static createEmptyConfig(): RoleplayActivityConfig {
        return {
            version: '0.0.0',
            type: RoleplayActivityTypeDefinition.type,
            setting: {
                name: "",
                description: ""
            },
            userCharacter: {
                objectives: []
            },
            characters: []
        }
    }

    static aiStringifier = (config: RoleplayActivityConfig, result?: RoleplayResult) => {
        if (config.version === '0.0.0'){
          return trimAllLines(`
          # Roleplay Activity
          This is an activity where the user roleplays a conversation with a set of characters in a setting.

          The user is trying to achieve a set of objectives with their character.

          ## Config
          ### Setting: "${config.setting.name}"
          \`\`\`
          ${config.setting.description}
          \`\`\`
          
          ### Characters
          ${config.characters.map((c, idx) => `- ${c.public.name} (${c.public.emoji}): ${c.public.description}`).join("\n")}

          ### User Character Objectives
          ${config.userCharacter.objectives.map((o, idx) => `- ${o.objectiveName}: ${o.objectiveDescription}`).join("\n")}
  
          ${result ? `
            ## User's Result
            ### Conversation
            The conversation which took place during the roleplay is as follows:
            \`\`\`
            ${JSON.stringify(result?.resultData, null, 2)}
            \`\`\`

            ## Grade
            ${result?.grade0to100}%

            ${result?.feedback ? `
            ### Feedback
                ${result.feedback.markdownFeedback}
                `
                :
                ``
            }
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
          })
        }
    }
}

staticValidateActivityTypeDefinition(RoleplayActivityTypeDefinition);
