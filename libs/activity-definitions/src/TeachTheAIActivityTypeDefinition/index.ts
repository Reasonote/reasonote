import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    TeachTheAIActivityConfig,
    TeachTheAIActivityConfigSchema,
    TeachTheAIResult,
    TeachTheAIResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class TeachTheAIActivityTypeDefinition {
    static type = "teach-the-ai" as const;

    static typeHumanName = "Teach the AI";

    static configSchema = TeachTheAIActivityConfigSchema;

    static resultSchema = TeachTheAIResultSchema;

    static createEmptyConfig(): TeachTheAIActivityConfig {
      return {
          version: '0.1.0',
          type: TeachTheAIActivityTypeDefinition.type,
          characterInstructions: '',
          characterEmoji: '',
          characterName: '',
          narratorIntro: '',
          setting: {
            emoji: '',
            name: '',
            description: ''
          },
          skillName: '',
          teachingObjectives: [],
      }
    }

    static aiStringifier = (config: TeachTheAIActivityConfig, result?: TeachTheAIResult) => {
      if (config.version === '0.0.0'){
        return trimAllLines(`
        # Roleplay Activity
        This is an activity where the user roleplays a conversation with a set of characters in a setting.

        The user is trying to achieve a set of objectives with their character.

        ## Config
        ### Skill
        ${config.skillName}
        
        ### Character Roleplay Instructions
        \`\`\`
        ${config.aiInstructions}
        \`\`\`

        ${result ? `
          ## User's Result
          ### Conversation
          The conversation which took place during the roleplay is as follows:
          \`\`\`
          ${JSON.stringify(result?.resultData, null, 2)}
          \`\`\`

          ## Grade
          ${result?.grade0to100}

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
      else if (config.version === '0.1.0'){
        return trimAllLines(`
        # Teach the AI Activity
        This is an activity where the user tries to teach a virtual character a skill.

        ## Config
        ### Skill
        ${config.skillName}
        ### Setting
        #### Name: "${config.setting.name}"
        #### Intro
        ${config.narratorIntro}

        #### Description
        \`\`\`
        ${config.setting.description}
        \`\`\`
        
        ### Characters
        ${config.characterName} (${config.characterEmoji})

        ### User Teaching Objectives
        ${config.teachingObjectives.map((o, idx) => `- ${o.objectiveName}: ${o.objectiveDescription}`).join("\n")}

        ${result ? `
          ## User's Result
          ### Conversation
          The conversation which took place during the roleplay is as follows:
          \`\`\`
          ${JSON.stringify(result?.resultData, null, 2)}
          \`\`\`

          ## Grade
          ${result?.grade0to100}

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
        });
      }
  }
}

staticValidateActivityTypeDefinition(TeachTheAIActivityTypeDefinition);
