import { z } from 'zod';

import { Document } from '@langchain/core/documents';
import {
  notEmpty,
  tryUntilAsync,
  TryUntilTryLimitsOptions,
} from '@lukebechtel/lab-ts-utils';
import { ChatDriverConfig } from '@reasonote/lib-ai-common';

import { AI } from '../../AI';

export interface AISingleCondenserCondenseArgs {
    context: string;
    aiDriverConfig?: ChatDriverConfig;
    docs: Document[];
    tryLimits?: TryUntilTryLimitsOptions;
}

export interface AISingleCondenserCondenseGroupArgs {
    context: string;
    aiDriverConfig?: ChatDriverConfig;
    groups: Document[][];
}

export class AISingleCondenser {
    constructor(readonly ai: AI){
        
    }

    async condense({docs, context, aiDriverConfig, tryLimits}: AISingleCondenserCondenseArgs){
        const {object: resData} = await tryUntilAsync({
            func: async () => {
                return await this.ai.genObject({
                    system: `
                    # Your Role
                    You are responsible for condensing information from the following documents into a single summary.
        
                    # The Context
                    You have been provided with the following context:
                    \`\`\`
                    ${context}
                    \`\`\`
        
                    # Documents
                    You will now be given a list of documents -- read them carefully, and extract the most relevant information.
        
                    # Final Notes
                    - Do 
        
                    `,
                    functionName: 'output_relevant_context',
                    functionDescription: 'Output the most relevant context from a list of documents.',
                    schema: z.object({
                        docs: z.object({
                            docId: z.number().describe('The id of the document.'),
                            summarizedRelevantInformation: z.string().optional().nullable().describe('Summarized Relevant information from the document that is relevant to the context. NULL if none.')
                        }).array(),
                    }),
                    messages: docs.map((doc, docIdx) => ({
                        role: 'user' as const,
                        content: `
                        # Document ${docIdx}
                        ${JSON.stringify({
                            docId: docIdx,
                            content: doc.pageContent,
                        }, null, 2)}
                        `
                    })), 
                })
            },
            tryLimits: tryLimits ?? {
                maxAttempts: 3
            },
            onError: ({err, failedAttempts}) => {
                console.error(`Error in condensing documents... (failed attempts: ${failedAttempts})`);
            }
        })

        if (!resData){
            // console.warn('No data returned from AI');
            return null;
        }

        // For each doc, get the relevant info.
        return resData.docs.map((doc) => {
            const docId = doc.docId;
            const relevantInfo = doc.summarizedRelevantInformation;

            if (!docs[docId] || relevantInfo === null || relevantInfo === undefined){
                // console.warn('No document found for docId', docId);
                return null;
            }

            return {
                relevantInfo,
                doc: docs[docId]
            }
        }).filter(notEmpty);
    }

    async condenseGroups({groups, context, aiDriverConfig}: AISingleCondenserCondenseGroupArgs){
        return (await Promise.all(groups.map(async (group) => {
            try {
                return (await this.condense({docs: group, context, aiDriverConfig, tryLimits: {maxAttempts: 3}}))
            }
            catch(e){
                console.error('Error in condensing group', e);
                return null;
            }
        }))).filter(notEmpty).flat();
    }
}