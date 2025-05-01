import _ from 'lodash';

import { observe } from '@lmnr-ai/lmnr';
import { Database } from '@reasonote/lib-sdk';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

import { AI } from '../AI';

export interface MatchArgs {
    queryText: string;
    queryEmbedding?: number[] | null;
    matchThreshold?: number;
    matchCount?: number;
    minContentLength?: number;
    filterTablename?: string;
    filterColname?: string;
    filterColpath?: string[];
    filterRefIds?: string[];
}

export interface MatchGroupDocsArgs extends MatchArgs {
    // TODO: Add condenseOverlappingSections
    // condenseOverlappingSections?: boolean;
    maxTokens?: number;
}

export interface MatchGroupDocsResult {
    rawResult: PostgrestSingleResponse<Database['public']['Functions']['match_rsn_vec']['Returns']>;
    docs: MatchGroupDocsResultItem[];
}

export type MatchGroupDocsSectionGap = {
    type: 'gap';
    gapLength: number;
}

export type MatchGroupDocsSectionContent = {
    id: string;
    type: 'content';
    content: string;
    contentOffset: number;
    contentLength: number
    similarity: number;
}

export type MatchGroupDocsSection = MatchGroupDocsSectionGap | MatchGroupDocsSectionContent;

export interface MatchGroupDocsResultItem {
    _ref_id: string;
    result_tablename: string | null;
    result_colname: string | null;
    result_colpath: string[] | null;
    sections: MatchGroupDocsSection[];
    avgSimilarity: number;
}

export class AIVectorStore {
    constructor(readonly ai: AI){}
    
    async match(args: MatchArgs): Promise<PostgrestSingleResponse<Database['public']['Functions']['match_rsn_vec']['Returns']>>{
        const ret = await observe(
            {name: 'AIVectorStore.match'},
            async ({queryText, queryEmbedding, matchCount, matchThreshold, minContentLength, filterColname, filterColpath, filterTablename, filterRefIds}: MatchArgs) => {
                const {sb} = this.ai.ctx;
                ///////////////
                // Logic
                const usingQueryEmbedding = queryEmbedding ? queryEmbedding : await this.ai.embed.embedItem(queryText);

                // Find the most similar result
                return await sb.rpc(
                    "match_rsn_vec",
                    {
                        match_embedding: usingQueryEmbedding as any,
                        match_threshold: matchThreshold ?? 0.8,
                        match_count: matchCount ?? 10,
                        min_content_length: minContentLength ?? 3,
                        filter_tablename: filterTablename,
                        filter_colname: filterColname,
                        filter_colpath: filterColpath,
                        filter_ref_ids: filterRefIds,
                        embedding_column: 'embedding_openai_text_embedding_3_small'
                    }
                );
            },
            args
        );

        return ret;
    }

    /**
     * Similar to match, but if multiple results refer to sections of the same _ref_id, they will be grouped together.
     */
    async matchGroupDocs({
        queryText, 
        queryEmbedding, 
        matchCount, 
        matchThreshold, 
        minContentLength, 
        filterColname, 
        filterColpath, 
        filterTablename, 
        filterRefIds,
        maxTokens,
        // TODO: Add condenseOverlappingSections
        // condenseOverlappingSections = false
    }: MatchGroupDocsArgs): Promise<MatchGroupDocsResult> {
        const matchResult = await this.match({
            queryText, 
            queryEmbedding, 
            matchCount, 
            matchThreshold, 
            minContentLength, 
            filterColname, 
            filterColpath, 
            filterTablename, 
            filterRefIds
        });

        // If maxTokens is provided, pare down results before grouping
        if (maxTokens && matchResult.data) {
            let currentTokenCount = 0;
            const paredResults: any[] = [];
            
            // Sort by similarity first to keep the most relevant results
            const sortedResults = _.orderBy(matchResult.data, ['similarity'], ['desc']);
            
            for (const result of sortedResults) {
                const tokenCount = (await this.ai.tokens.encode(result.raw_content)).length;
                if (currentTokenCount + tokenCount <= maxTokens) {
                    paredResults.push(result);
                    currentTokenCount += tokenCount;
                } else {
                    break;
                }
            }
            
            matchResult.data = paredResults;
        }

        const maxGapLength = 5;
        const overlapCheckLength = 50; // Number of characters to check for overlap

        // Group results by _ref_id
        const groupedResults = _.groupBy(matchResult.data, '_ref_id');

        // Create docs. Anytime we see a gap larger than 2, we add a gap representer.
        const docs: MatchGroupDocsResultItem[] = Object.entries(groupedResults).map(([_ref_id, matches]) => {
            // Sort matches by content_offset
            const sortedMatches = _.sortBy(matches, 'content_offset');
            const sections: MatchGroupDocsSection[] = [];
            let totalSimilarity = 0;
            let result_tablename: string | null = null;
            let result_colname: string | null = null;
            let result_colpath: string[] | null = null;

            for (let i = 0; i < sortedMatches.length; i++) {
                const current = sortedMatches[i];
                const next = sortedMatches[i + 1];

                result_tablename = current.result_tablename;
                result_colname = current.result_colname;
                result_colpath = current.result_colpath;

                // TODO: Check if we should join with previous section when condensing is enabled
                // if (condenseOverlappingSections) {
                //     // const prevSection = sections[sections.length - 1];
                //     // if (prevSection?.type === 'content') {
                //     //     const prevContent = prevSection.content;
                //     //     const currentContent = current.raw_content;
                        
                //     //     // Check if the start of current chunk is contained in the end of previous chunk
                //     //     const prevEnd = prevContent.slice(-overlapCheckLength);
                //     //     const currentStart = currentContent.slice(0, overlapCheckLength);
                        
                //     //     const overlapIndex = prevEnd.indexOf(currentStart);
                //     //     if (overlapIndex !== -1) {
                //     //         // Join the chunks by removing the overlapping part
                //     //         const overlapLength = prevEnd.length - overlapIndex;
                //     //         prevSection.content = prevContent + currentContent.slice(overlapLength);
                //     //         prevSection.contentLength = prevSection.content.length;
                //     //         prevSection.similarity = (prevSection.similarity + current.similarity) / 2;
                //     //         continue; // Skip adding a new section
                //     //     }
                //     // }
                // }

                // Add current content section
                sections.push({
                    id: current.id,
                    type: 'content',
                    content: current.raw_content,
                    contentOffset: current.content_offset,
                    contentLength: current.raw_content.length,
                    similarity: current.similarity
                });
                totalSimilarity += current.similarity;

                // If there's a next section, check for gap
                if (next) {
                    const currentEnd = current.content_offset + current.raw_content.length;
                    const nextStart = next.content_offset;
                    const gapLength = nextStart - currentEnd;

                    if (gapLength > maxGapLength) {
                        sections.push({
                            type: 'gap',
                            gapLength
                        });
                    }
                }
            }

            return {
                _ref_id,
                result_tablename,
                result_colname,
                result_colpath,
                sections,
                avgSimilarity: sections.length > 0 ? totalSimilarity / sections.length : 0
            };
        });

        return {
            rawResult: matchResult,
            docs
        };
    }
}