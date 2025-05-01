import { trimAllLines } from "@lukebechtel/lab-ts-utils";

import {
    SequenceActivityConfig,
    SequenceActivityConfigSchema,
    SequenceResult,
    SequenceResultSchema,
} from "./schema";

export * from './schema';

/**
 * A helper class for sequence activities.
 * 
 * We prefer static methods to encourage reliance on the backend for state.
 */
export class SequenceActivityTypeDefinition {
    static type = "sequence" as const;

    static typeHumanName = "Sequence";

    static resultSchema = SequenceResultSchema;

    static configSchema = SequenceActivityConfigSchema;
 
    static createEmptyConfig(): SequenceActivityConfig {
        return {
            version: "0.0.1",
            type: SequenceActivityTypeDefinition.type,
            prompt: "",
            items: [],
            aiScoringEnabled: true,
        }
    } 

    static aiStringifier = (config: SequenceActivityConfig, result?: SequenceResult) => {
        const itemsById = Object.fromEntries(
            config.items.map(item => [item.id, item])
        );
        
        
        return trimAllLines(`
        # Sequence Activity
        ## Config
        ### Prompt
        ${config.prompt}

        ### Items
        ${config.items.map((item) => {
            let itemStr = `- "${item.label}"`;
            
            // Handle v0.0.1 imageUrl
            if ('imageUrl' in item && item.imageUrl) {
                itemStr += ` [Image: ${item.imageUrl}]`;
            }
            
            // Handle v0.0.2 hiddenPositionLabel
            if ('hiddenPositionLabel' in item && item.hiddenPositionLabel) {
                itemStr += ` [Hidden Label: ${item.hiddenPositionLabel}]`;
            }
            
            return itemStr;
        }).join("\n")}

        ${config.positionLabels ? `
        ### Position Labels
        ${config.positionLabels.join(", ")}
        ` : ''}

        ### Correct Order
        ${config.items.map(item => `${itemsById[item.id].label}`).join(" → ")}

        ${result && result.resultData ? `
          ## Result
          ### User Sequence
          ${result.resultData.userSequence.map(id => `${itemsById[id].label}`).join(" → ")}

          ### Grade
            ${result.grade0to100 ? `${result.grade0to100}%` : 'Not Graded'}
          `
          : 
          ""
        }
        `);
    }
}