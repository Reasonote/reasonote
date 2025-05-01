import _ from "lodash";

import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    ChooseTheBlankActivityConfig,
    ChooseTheBlankActivityConfigSchema,
    ChooseTheBlankActivityResultSchema,
    ChooseTheBlankResult,
} from "./schema";

export * from './schema';

export class ChooseTheBlankActivityTypeDefinition {
    static type = "choose-the-blank" as const;

    static typeHumanName = "Choose the Blank";

    static configSchema = ChooseTheBlankActivityConfigSchema;

    static resultSchema = ChooseTheBlankActivityResultSchema;

    static createEmptyConfig(): ChooseTheBlankActivityConfig {
      return {
          version: "0.0.0",
          type: 'choose-the-blank' as const,
          text: "",
          hiddenWords: [],
          wordChoices: [],
      }
    }

    static aiStringifier = (config: ChooseTheBlankActivityConfig, result?: ChooseTheBlankResult) => {
      return trimAllLines(`
        # Choose the Blank Activity
        ## Config
        ### Text
        ${config.text}

        ### Hidden Words
        ${config.hiddenWords?.join(", ")}

        ### Choices
        ${config.wordChoices?.map((a) => `- "${a}"`).join("\n")}

        ${result && result.resultData ? `
          ## Result
          ### User Answers
          "${result.resultData.selectedAnswers.join(", ")}"

          ### Grade
          ${result.grade0to100}%
          `
          : 
          ""
        }
        
      `)
    }
}

staticValidateActivityTypeDefinition(ChooseTheBlankActivityTypeDefinition);
