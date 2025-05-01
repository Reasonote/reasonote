import { Document } from '@langchain/core/documents';
import { TokenTextSplitter } from '@langchain/textsplitters';

import { AI } from '../AI';

export interface GroupToSizeGroupDocsArgs {
    docs: Document[];
    ai: AI;
    maxTokensPerGroup: number;
}

export class GroupToSize {
    constructor(readonly ai: AI){}

    async groupDocs(args: GroupToSizeGroupDocsArgs): Promise<Document[][]> {
        // For each snip, split it into sections that our contextGenerateAI can use (if necessary) and then generate the context.
        const splitter = new TokenTextSplitter({
            encodingName: 'gpt2',
            chunkSize: 5000,
        });
        
        const splitDocuments = await splitter.splitDocuments(args.docs);
    
        // now, get tokens
        const withTokens = await Promise.all(splitDocuments.map(async (d) => {
            const encoded = await this.ai.tokens.encode(d.pageContent);
            d.metadata.tokens = encoded;
    
            return d;
        }));
    
        // Now, it's possible that *some* sections are quite small, and we could pack them in together.
        // Reduce this down to an array of arrays, keeping a running total of the encoded token length for each subarray.
        var runningEncodedLength = 0;
        const docGroups = withTokens.reduce((acc, cur) => {
            const curEncodedLength = cur.metadata.tokens.length;
            if (runningEncodedLength + curEncodedLength > args.maxTokensPerGroup){
                acc.push([]);
                runningEncodedLength = 0;
            }
    
            acc[acc.length - 1].push(cur);
            runningEncodedLength += curEncodedLength;
            return acc;
        }, [[]] as Document<Record<string, any>>[][]);

        return docGroups;
    }
}

