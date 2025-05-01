import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    MultipleChoiceActivityConfig,
    MultipleChoiceActivityConfigSchema,
    MultipleChoiceActivityConfigv1_0_0,
    MultipleChoiceResult,
    MultipleChoiceResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class MultipleChoiceActivityTypeDefinition {
    static type = "multiple-choice" as const;

    static typeHumanName = "Multiple Choice";

    static resultSchema = MultipleChoiceResultSchema;

    static configSchema = MultipleChoiceActivityConfigSchema;
 
    static createEmptyConfig(): MultipleChoiceActivityConfig {
        return {
            version: "0.0.1",
            type: MultipleChoiceActivityTypeDefinition.type,
            question: "",
            answerChoices: [],
            correctAnswer: "",
            answerChoiceFollowUps: []
        }
    }

    static convertConfigToV1_0_0 = (config: MultipleChoiceActivityConfig): MultipleChoiceActivityConfigv1_0_0 => {
      if (config.version === '1.0.0') {
        return config;
      }
      else if (config.version === '0.0.1' || config.version === '0.0.0') {
          return {
              ...config,
              answerChoices: config.answerChoices.map(choice => ({
                  text: choice,
                  isCorrect: choice === config.correctAnswer,
                  followUp: config.answerChoiceFollowUps?.find(followUp => followUp.answerChoice === choice)?.followUp,
              })),
              version: '1.0.0',
          };
      }
      else {
          throw new Error(`Unsupported version.`);
      }
    }

    static aiStringifier = (_config: MultipleChoiceActivityConfig, result?: MultipleChoiceResult) => { 
      const config = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(_config);

        return trimAllLines(`
        # Multiple Choice Activity
        ## Config
        ### Question
        ${config.question}

        ### Answer Choices
        ${config.answerChoices?.map((a) => `<ANSWER_CHOICE isCorrect="${a.isCorrect}">${a.text}</ANSWER_CHOICE>`).join("\n")}

        ${result && result.resultData ? `
          ## Result
          ### User Answers
          "${result.resultData.userAnswer}"
          `
          : 
          ""
        } 
        `)
    }
}


staticValidateActivityTypeDefinition(MultipleChoiceActivityTypeDefinition);
