import _ from "lodash";

import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    FillInTheBlankActivityConfig,
    FillInTheBlankActivityConfigSchema,
    FillInTheBlankActivityResultSchema,
    FillInTheBlankResult,
} from "./schema";

export * from './schema';

export class FillInTheBlankActivityTypeDefinition {
    static type = "fill-in-the-blank" as const;

    static typeHumanName = "Fill in the Blank";

    static configSchema = FillInTheBlankActivityConfigSchema;

    static resultSchema = FillInTheBlankActivityResultSchema;

    static createEmptyConfig(): FillInTheBlankActivityConfig {
      return {
          version: "0.0.1",
          type: 'fill-in-the-blank' as const,
          text: "",
      }
    }

    static aiStringifier = (config: FillInTheBlankActivityConfig, result?: FillInTheBlankResult) => {
      if (config.version === '0.0.1'){
        return trimAllLines(`
        # Fill in the Blank Activity
        ## Config
        ### Text
        ${config.text}

        ${result ? `
          ## Result
          ### User Answers
          ${result.resultData.userAnswers.map((ans, idx) => `Answer ${idx + 1}: "${ans}"`).join("\n")}
          `
          : 
          ""
        }
        
        `)
      }
      else {
        return trimAllLines(`
        # Fill in the Blank Activity
        ## Config
        ### Text
        ${config.text}

        ### Hidden Words
        ${config.hiddenWords?.join(", ")}

        ${result ? `
          ## Result
          ### User Answers
          ${result.resultData.userAnswers?.map((ans, idx) => `Answer ${idx + 1}: "${ans}"`).join("\n")}
          `
          : 
          ""
        }
        
        `)
      }
    }
}

staticValidateActivityTypeDefinition(FillInTheBlankActivityTypeDefinition);
