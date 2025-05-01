import { trimAllLines } from "@lukebechtel/lab-ts-utils";
import { staticValidateActivityTypeDefinition } from "@reasonote/core";

import {
    TermMatchingActivityConfig,
    TermMatchingActivityConfigSchema,
    TermMatchingActivityResultSchema,
    TermMatchingResult,
} from "./schema";

export * from './schema';

export class TermMatchingActivityTypeDefinition {
    static type = "term-matching" as const;

    static typeHumanName = "Term Matching";

    static configSchema = TermMatchingActivityConfigSchema;

    static resultSchema = TermMatchingActivityResultSchema;

    static createEmptyConfig(): TermMatchingActivityConfig {
      return {
          version: "0.0.0",
          type: 'term-matching' as const,
          termPairs: [
              { term: "", definition: "" },
              { term: "", definition: "" },
          ],
          instructions: "Match the terms with their correct definitions.",
      }
    }

    static aiStringifier = (config: TermMatchingActivityConfig, result?: TermMatchingResult) => { 
      return trimAllLines(`
        # Term Matching Activity
        ## Config
        ### Instructions
        ${config.instructions}

        ### Term Pairs
        ${config.termPairs.map(pair => `- ${pair.term}: ${pair.definition}`).join('\n')}

        ${result ? `
          ## Result
          ### User Matches
          ${result.resultData.userMatches.map(match => `- ${match.term}: ${match.matchedDefinition}`).join('\n')}
          `
          : 
          ""
        }
      `)
    }
}

staticValidateActivityTypeDefinition(TermMatchingActivityTypeDefinition);