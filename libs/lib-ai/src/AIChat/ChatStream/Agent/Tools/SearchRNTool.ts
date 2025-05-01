import _ from 'lodash';
import { z } from 'zod';

import { AI } from '../../../../';
import { RNAgentTool } from '../RNAgentTool';

export const SearchRNToolArgsSchema = z.object({
    query: z.object({
        type: z.enum(['documents']),
        string: z.string().describe("The query to search for."),
        similarityThreshold: z.number().optional().default(0.7).describe("The similarity threshold to use for the search (0-1). Defaults to .7"),
    }),
    maxResults: z.number().describe("The maximum number of results to return (1-10)."),
})
export type SearchRNToolArgs = z.infer<typeof SearchRNToolArgsSchema>;

// Define the interface for the search result items
interface MatchResultDataEntry {
    id: string;
    raw_content: string;
    similarity: number;
    _ref_id: string;
    result_tablename: string;
    result_colname: string;
    result_colpath?: string[] | null;
}

export class SearchRNTool implements RNAgentTool<any, any, any> {
    name = 'SearchRN';
    description = 'Search for documents in the Reasonote database.';
    args = SearchRNToolArgsSchema;
    requiresIteration = true;

    formatResults(results: {id: string, content: string, similarity: number, refId: string, tableName: string, columnName: string, columnPath: string[], contentOffset?: number, pageName?: string, pageDescription?: string}[]) {
        // For rsn_page results, group by refId
        if (results.length > 0 && results[0].tableName === 'rsn_page') {
            // Group results by refId
            const groupedByRefId = _.groupBy(results, 'refId');
            
            return `
            <search-results>
                ${Object.entries(groupedByRefId).map(([refId, chunks]) => {
                    // Sort chunks by contentOffset to maintain document order
                    const sortedChunks = _.sortBy(chunks, 'contentOffset');
                    
                    // Get page name and description from the first chunk (they should be the same for all chunks with the same refId)
                    const pageName = sortedChunks[0].pageName || '';
                    const pageDescription = sortedChunks[0].pageDescription || '';
                    
                    return `
                    <document ref-id="${refId}" name="${pageName}" description="${pageDescription}">
                        ${sortedChunks.map((chunk, index, array) => {
                            // Determine if there's a gap based on contentOffset
                            let hasGap = false;
                            if (index > 0) {
                                const prevChunk = array[index - 1];
                                const prevContentLength = prevChunk.content.length;
                                const prevOffset = prevChunk.contentOffset || 0;
                                const currentOffset = chunk.contentOffset || 0;
                                
                                // If there's a gap between the end of the previous chunk and the start of this one
                                hasGap = (prevOffset + prevContentLength < currentOffset);
                            }
                            
                            return `
                            ${hasGap ? '<gap>...</gap>' : ''}
                            <chunk id="${chunk.id}" similarity="${chunk.similarity.toFixed(2)}" offset="${chunk.contentOffset || 0}">
                                ${chunk.content}
                            </chunk>`;
                        }).join('')}
                    </document>`;
                }).join('')}
            </search-results>
            `;
        }
        
        // Default format for other result types
        return `
        <search-results>
            ${results.map((result) => `
                <result>
                    <id>${result.id}</id>
                    <content>${result.content}</content>
                </result>
            `).join('')}
        </search-results>
        `;
    }

    async invoke(args: SearchRNToolArgs, ai: AI): Promise<any> {
        const { query, maxResults } = args;

        // Map query type to the corresponding table name
        const typeToTableMap = {
            'documents': 'rsn_page',
            'lessons': 'lesson',
            'courses': 'course',
            'activities': 'activity'
        };
        
        const tableName = typeToTableMap[query.type];
        const textValue = query.string;
        
        try {
            // Use the vector search functionality directly through Supabase
            const matchResult = await ai.vectors.match({
                queryText: textValue,
                matchCount: maxResults,
                matchThreshold: query.similarityThreshold || 0.7,
                minContentLength: 3,
                filterTablename: tableName
            });
            
            // Format the results
            const results = await Promise.all((matchResult.data || []).map(async (item: any) => {
                const result = {
                    id: item.id,
                    content: item.raw_content,
                    similarity: item.similarity,
                    refId: item._ref_id,
                    tableName: item.result_tablename,
                    columnName: item.result_colname,
                    columnPath: item.result_colpath,
                    contentOffset: item.content_offset,
                    pageName: '',
                    pageDescription: ''
                };
                
                // If this is a rsn_page result, fetch the page name and description
                if (item.result_tablename === 'rsn_page') {
                    try {
                        const pageData = await ai.sb
                            .from('rsn_page')
                            .select('_name, _description')
                            .eq('id', item._ref_id)
                            .single();
                            
                        if (pageData.data) {
                            result.pageName = pageData.data._name || '';
                            result.pageDescription = pageData.data._description || '';
                        }
                    } catch (error) {
                        console.error('Error fetching page data:', error);
                    }
                }
                
                return result;
            }));
            
            return {
                query: textValue,
                type: query.type,
                tableName,
                count: results.length,
                results: this.formatResults(results)
            };
        } catch (error) {
            console.error('Error searching for content:', error);
            return {
                query: textValue,
                type: query.type,
                tableName,
                count: 0,
                results: [],
                error: String(error)
            };
        }
    }
} 