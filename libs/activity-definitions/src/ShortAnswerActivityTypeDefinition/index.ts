import _ from "lodash";

import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    ShortAnswerActivityConfig,
    ShortAnswerActivityConfigSchema,
    ShortAnswerActivityResultSchema,
    ShortAnswerResult,
} from "./schema";

export * from './schema';

export class ShortAnswerActivityTypeDefinition {
    static type = "short-answer" as const;

    static typeHumanName = "Short Answer";

    static configSchema = ShortAnswerActivityConfigSchema;

    static resultSchema = ShortAnswerActivityResultSchema;

    static createEmptyConfig(): ShortAnswerActivityConfig {
      return {
          version: "0.0.0",
          type: 'short-answer' as const,
          questionText: "",
          gradingCriteria: ""
      }
    }

    static aiStringifier = (config: ShortAnswerActivityConfig, result?: ShortAnswerResult) => { 
      return trimAllLines(`
        # Short Answer Activity
        ## Config
        ### Question Text
        ${config.questionText}

        ${result ? `
          ## Result
          ### User Answer
          \`\`\`
          ${result.resultData.userAnswer}
          \`\`\`
          `
          : 
          ""
        }
      `)
    }
}

staticValidateActivityTypeDefinition(ShortAnswerActivityTypeDefinition);
