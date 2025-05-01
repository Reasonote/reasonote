import _ from 'lodash';

import * as Priompt from '@anysphere/priompt';
import { notEmpty } from '@lukebechtel/lab-ts-utils';
import {
  Block,
  priomptRenderToString,
  UnifiedResource,
} from '@reasonote/lib-ai';

import { MatchGroupDocsSection } from '../../vectors/VectorStore';
import { AIPromptFormatterConfig } from '../AIPrompt';
import { AIPromptObj } from './AIPromptObj';

// Define types for the response objects to fix linter errors
type ResourceDbEntry = {
  id: string;
  rsn_page?: {
    id?: string;
    _name?: string | null;
    original_filename?: string | null;
    body?: string | null;
  } | null;
  snip?: {
    id?: string;
    _name?: string | null;
    source_url?: string | null;
    text_content?: string | null;
  } | null;
};

type PodcastData = {
  for_skill_path?: string[];
  resource?: ResourceDbEntry[];
};

type CourseData = {
  resource?: ResourceDbEntry[];
};



export type ResourceMetadata = {
  resourceId: string;
  pageId: string | null;
  pageName: string | null;
  snipId: string | null;
  snipName: string | null;
};

export const maxDuration = 300; // 5 minutes, adjust as needed

export class AIPromptObjResources extends AIPromptObj {
    /**
     * Shared helper function to fetch resources from podcasts, skills, and courses based on filter criteria.
     * This helps avoid code duplication between the various resource getter methods.
     * 
     * @param filter - Optional filter criteria to narrow down the resources.
     * @param selector - The database selector string for what fields to fetch.
     * @returns Data needed for resource processing.
     * @private
     */
    private async _fetchResourceData({
        filter, 
        selector
    }: {
        filter?: {skillIds?: string[], podcastId?: string, courseId?: string},
        selector: string
    }) {
        // Get the resources from the podcast
        const podcastResponse = await this.ai.sb.from('podcast').select(`*, resource(${selector})`)
            .eq('id', filter?.podcastId ?? 'FAKE_PODCAST_ID')
            .single();

        // When a podcastId is provided, we need to figure out what skills its under and include all of those
        const podcastData = podcastResponse.data as PodcastData | null;
        const podcastSkillId = podcastData?.for_skill_path?.[0];

        // Get all parent / child skills for podcastSkillId
        const {data: podcastSkillData} = podcastSkillId ? 
            await this.ai.prompt.skills.getConnectedSkills(podcastSkillId) : 
            {data: []};

        const podcastSkillIds = _.uniq(podcastSkillData?.map((s) => s.skill_id) || []);
        const allSkillIds = _.uniq([...podcastSkillIds, ...(filter?.skillIds ?? [])]);

        // Get skill data
        const skillData = allSkillIds.length > 0 ? 
            await this.ai.sb.from('skill').select(`*, resource(${selector})`).in('id', allSkillIds).then((res) => res.data ?? []) : 
            [];

        // Get resource data from course
        const courseResponse = filter?.courseId ? 
            await this.ai.sb.from('course').select(`*, resource(${selector})`).eq('id', filter.courseId).single() : 
            null;
            
        const courseData = courseResponse?.data as CourseData | null;

        return {
            podcastData,
            podcastSkillIds,
            allSkillIds,
            courseData,
            skillData
        };
    }

    /**
     * Converts a resource from the database format to a unified format.
     * This standardizes the resource structure regardless of whether it's a page or snip.
     * 
     * @param r - The resource object from the database
     * @returns A unified resource object with consistent properties
     * @private
     */
    private _toUnifiedResource(r: any): UnifiedResource {
        return {
            id: r.id,
            entityId: r.rsn_page ? r.rsn_page.id : r.snip?.id,
            type: r.rsn_page ? 'page' as const : 'snip' as const,
            name: r.rsn_page ? r.rsn_page._name || null : r.snip?._name || null,
            source: r.rsn_page ? r.rsn_page.original_filename || null : r.snip?.source_url || null,
            content: r.rsn_page ? r.rsn_page.body || null : r.snip?.text_content || null,
        }
    }

    /**
     * Converts a resource from the database format to metadata format.
     * 
     * @param r - The resource object from the database
     * @returns A resource metadata object
     * @private
     */
    private _toResourceMetadata(r: any): ResourceMetadata {
        return {
            resourceId: r.id,
            pageId: r.rsn_page?.id || null,
            pageName: r.rsn_page?._name || null,
            snipId: r.snip?.id || null,
            snipName: r.snip?._name || null
        };
    }

    /**
     * Processes resources from different sources (podcast, skills, course) and combines them.
     * 
     * @param podcastData - Podcast resource data
     * @param skillData - Skill resource data
     * @param allSkillIds - All skill IDs to process
     * @param courseData - Course resource data
     * @param processor - Function to process each resource
     * @param deduplicate - Whether to deduplicate results by ID
     * @param queryTexts - Optional array of query texts to run vector search against resources
     * @param matchOptions - Options to configure vector search matching behavior
     * @returns Combined and processed resources
     * @private 
     */
    private async _processResources<T extends { resourceId?: string, id?: string | null }>({
        podcastData,
        skillData,
        allSkillIds,
        courseData,
        processor,
        deduplicate = true,
        queryTexts,
        matchOptions,
    }: {
        podcastData: PodcastData | null,
        skillData: any,
        allSkillIds: string[],
        courseData: CourseData | null,
        processor: (resource: any) => T,
        deduplicate?: boolean,
        queryTexts?: string[],
        matchOptions?: {
            maxTokens?: number,
            matchCount?: number,
            minContentLength?: number,
        }
    }): Promise<T[]> {
        // Process podcast resources
        const podcastResources = (podcastData?.resource || []).map(processor);

        console.log('skillData', skillData);

        // Process skill resources
        const skillResources = _.flatten(skillData.map((s: any) => s.resource)).map(processor);

        // Process course resources
        const courseResources = courseData?.resource ? 
            courseData.resource.map(processor) : 
            [];
        
        // Combine all resources
        const combinedResources = [...podcastResources, ...skillResources, ...courseResources];

        // Deduplicate if requested
        let processedResources: T[];
        if (deduplicate) {
            const resourceMap = new Map<string, T>();
            combinedResources.forEach(r => {
                const id = (r as any).resourceId || (r as any).id;
                if (id && !resourceMap.has(id)) {
                    resourceMap.set(id, r);
                }
            });
            processedResources = Array.from(resourceMap.values());
        } else {
            processedResources = combinedResources;
        }
        
        // Run vector search if queryTexts are provided
        if (queryTexts?.length && processedResources.length) {
            // Get resource IDs for filtering
            const resourceRefIds: string[] = processedResources.map(r => {
                if ('entityId' in r) {
                   return r.entityId as string;
                } else {
                    return null;
                }
            }).filter(notEmpty);

            // Default match options
            const maxTokens = matchOptions?.maxTokens ?? 50_000;
            const matchCount = matchOptions?.matchCount ?? 100;
            const minContentLength = matchOptions?.minContentLength ?? 10;

            // Run matchGroupDocs for each query
            for (const queryText of queryTexts) {
                const groupResult = await this.ai.vectors.matchGroupDocs({
                    queryText,
                    minContentLength,
                    filterTablename: 'rsn_page',
                    filterColname: 'body',
                    maxTokens,
                    matchCount,
                    filterRefIds: resourceRefIds,
                    matchThreshold: 0.6
                });

                // Add matched sections to the corresponding resources
                for (const doc of groupResult.docs) {
                    const resourceIndex = processedResources.findIndex(r => {
                        const id = (r as any).entityId;
                        return id === doc._ref_id;
                    });

                    if (resourceIndex !== -1) {
                        // Create matchedSections array if it doesn't exist
                        if (!('matchedSections' in processedResources[resourceIndex])) {
                            (processedResources[resourceIndex] as any).matchedSections = [];
                        }

                        // Add this query's sections to matchedSections
                        (processedResources[resourceIndex] as any).matchedSections.push({
                            queryText,
                            sections: doc.sections
                        });
                    }
                }
            }
        }
        
        return processedResources;
    }

    /**
     * Gets all resources including their content.
     * 
     * @param filter - Optional filter criteria to narrow down the resources
     * @param queryTexts - Optional array of query texts to run vector search against resources
     * @param matchOptions - Options to configure vector search matching behavior
     * @returns Promise resolving to an array of unified resources with content
     */
    async getAllResources({
        filter,
        queryTexts,
        matchOptions
    }: {
        filter?: {skillIds?: string[], podcastId?: string, courseId?: string},
        queryTexts?: string[],
        matchOptions?: {
            maxTokens?: number,
            matchCount?: number,
            minContentLength?: number,
        }
    }): Promise<UnifiedResource[]> {
        const { podcastData, allSkillIds, courseData, skillData } = await this._fetchResourceData({
            filter,
            selector: '*, rsn_page(*), snip(*)'
        });

        const resources = await this._processResources<UnifiedResource>({
            podcastData,
            skillData,
            allSkillIds,
            courseData,
            processor: (r) => {
                // Otherwise convert from database format
                return this._toUnifiedResource(r);
            },
            queryTexts,
            matchOptions
        });

        return resources;
    }


    async getAllReferencesAndChunks({
        skillIds
    }: {
        skillIds: string[]
    }): Promise<{
        references: {id: string, content: string, docId: string, name: string}[],
        chunks: {id: string, content: string, docId: string, name: string}[]
    }> {
        // Fetch the skill reference sentences and chunks
        const referenceIds = await this.ai.sb.from('skill').select('reference_ids, rsn_vec_ids').in('id', skillIds);
        const referenceSentences = await this.ai.sb.from('reference').select('id, raw_content, _ref_id').in('id', referenceIds.data?.map((r) => r.reference_ids).flat() ?? []);
        const referenceChunks = await this.ai.sb.from('rsn_vec').select('id, raw_content, _ref_id').in('id', referenceIds.data?.map((r) => r.rsn_vec_ids).flat() ?? []);
        
        console.log('referenceSentences', referenceSentences);
        console.log('referenceChunks', referenceChunks);

        return {
            references: referenceSentences.data?.map((r, idx) => ({id: `reference-${idx + 1}`, content: r.raw_content ?? '', docId: r._ref_id ?? '', name: `Reference ${idx + 1}`})) ?? [],
            chunks: referenceChunks.data?.map((r, idx) => ({id: `chunk-${idx + 1}`, content: r.raw_content ?? '', docId: r._ref_id ?? '', name: `Chunk ${idx + 1}`})) ?? []
        };
    }

    /**
     * Priompt component for a single section within a resource document
     */
    static SectionPriompt = (props: { section: MatchGroupDocsSection }) => {
        const { section } = props;
        
        if (section.type === 'content') {
            return (
                <Block 
                    name="section" 
                    attributes={{ 
                        sectionOffset: section.contentOffset.toString()
                    }}
                >
                    {section.content}
                </Block>
            );
        } else {
            return (
                <Block 
                    name="gap" 
                    attributes={{ 
                        gapLength: section.gapLength.toString()
                    }}
                />
            );
        }
    }

    /**
     * Priompt component for a single resource document
     */
    static SingleResourcePriompt = (props: { 
        doc: {
            name: string | null | undefined;
            source: string | null | undefined;
            sections: MatchGroupDocsSection[];
        }
    }) => {
        const { doc } = props;
        
        return (
            <Block 
                name="doc" 
                attributes={{ 
                    name: doc.name || '',
                    source: doc.source || ''
                }}
            >
                {doc.sections.map((section, index) => (
                    <AIPromptObjResources.SectionPriompt section={section} />
                ))}
            </Block>
        );
    }

    /**
     * Priompt component for all resources
     */
    static ResourcesPriompt = (props: { 
        docs: Array<{
            name: string | null | undefined;
            source: string | null | undefined;
            sections: MatchGroupDocsSection[];
        }>;
        disableWrapper?: boolean;
    }) => {
        const { docs, disableWrapper } = props;
        
        return (
            <Block name={disableWrapper ? '' : 'RESOURCES'}>
                {docs.map((doc, index) => (
                    <AIPromptObjResources.SingleResourcePriompt doc={doc} />
                ))}
            </Block>
        );
    }

    /**
     * Format resources into a string representation.
     * 
     * @param docs - Documents with sections to format
     * @param disableWrapper - Whether to include wrapper tags
     * @returns Formatted string representation of resources
     * @private
     */
    private async _formatResourceString(
        docs: {
            name: string | null | undefined;
            source: string | null | undefined;
            sections: MatchGroupDocsSection[];
        }[],
        disableWrapper?: boolean
    ): Promise<string> {
        const resourcesJSX = <AIPromptObjResources.ResourcesPriompt docs={docs} disableWrapper={disableWrapper} />;
        return await priomptRenderToString(resourcesJSX);
    }

    /**
     * Gets all resource metadata including IDs for rsn_page and snip entries.
     * This function returns lightweight metadata about resources without fetching full content,
     * making it more efficient when you only need identification information.
     * 
     * The metadata includes:
     * - resourceId: The main ID of the resource
     * - pageId: ID of the page if this is a page resource, null otherwise
     * - pageName: Name of the page if this is a page resource, null otherwise
     * - snipId: ID of the snip if this is a snip resource, null otherwise
     * - snipName: Name of the snip if this is a snip resource, null otherwise
     * 
     * @param filter - Optional filter criteria to narrow down the resources.
     * @returns Promise resolving to an array of resource metadata objects.
     */
    async getAllResourceMetadata({filter}: {filter?: {skillIds?: string[], podcastId?: string, courseId?: string}}): Promise<ResourceMetadata[]> {
        const { podcastData, allSkillIds, courseData, skillData } = await this._fetchResourceData({
            filter,
            selector: '*, rsn_page(id, _name), snip(id, _name)'
        });

        const resourceMetadata = await this._processResources({
            podcastData,
            skillData,
            allSkillIds,
            courseData,
            processor: (r) => {
                // Convert resource between formats as needed
                if ('entityId' in r) {
                    // This is coming from skills.getAllResources, so it's already in UnifiedResource format
                    return {
                        resourceId: r.entityId,
                        pageId: r.type === 'page' ? r.entityId : null,
                        pageName: r.type === 'page' ? r.name : null,
                        snipId: r.type === 'snip' ? r.entityId : null,
                        snipName: r.type === 'snip' ? r.name : null
                    };
                } else {
                    // This is from the database query
                    return this._toResourceMetadata(r);
                }
            }
        });
        
        console.debug('resourceMetadata count:', resourceMetadata.length);
        return resourceMetadata;
    }

    /**
     * Formats resources into a structured text format with optional vector search.
     * 
     * @param options - Configuration options
     * @returns Formatted resource string
     */
    async formatResources({
        queryText,
        filter,
        includeAllFilteredResourcesIfPossible,
        ...args
    }: {
        /**
         * The query that will be used to construct vector search results.
         */
        queryText: string,
        
        /**
         * The filter to apply to the resources that will be used to construct vector search results.
         */
        filter?: {
            /**
             * If provided, resources associated with this podcast will be specifically included.
             */
            podcastId?: string,
            /**
             * If provided, resources associated with these skills will be specifically included.
             */
            skillIds?: string[],

            /**
             * If provided, resources associated with this course will be specifically included.
             */
            courseId?: string,
        },

        /**
         * If true, the wrapper tags will not be included.
         */
        disableWrapper?: boolean,

        /**
         * If true AND if a filter is provided AND the filtered resources will fit into the matchMaxTokens,
         * then all resources will be included, and match will not be run.
         */
        includeAllFilteredResourcesIfPossible?: boolean,

        /**
         * The maximum number of tokens which will be allowed for the vector search results in total.
         * 
         * NOTE: this is applied *after* matchMaxResults.
         */
        matchMaxTokens?: number,

        /**
         * The maximum number of vector search results which will be returned from the vector store when using vector similarity search.
         * 
         * NOTE: this is applied *before* maxTokens.
         */
        matchMaxResults?: number,
        config?: AIPromptFormatterConfig
    }): Promise<string> {
        // DEFAULTS
        const matchMaxTokens = args.matchMaxTokens ?? 50_000;
        const matchMaxResults = args.matchMaxResults ?? 100;
        
        // Use unified approach to getting resources with vector search
        const allResources = await this.getAllResources({
            filter,
            // Only do the vector search if we're not including all resources
            queryTexts: includeAllFilteredResourcesIfPossible ? undefined : [queryText],
            matchOptions: {
                maxTokens: matchMaxTokens,
                matchCount: matchMaxResults,
                minContentLength: 10
            }
        });

        if (includeAllFilteredResourcesIfPossible && filter) {
            // Get full token count of all resources
            const fullTokens = (await this.ai.tokens.encode(allResources.map((r) => r?.content).filter(notEmpty).join('\n'))).length;

            if (fullTokens <= matchMaxTokens) {
                // If we can include all filtered resources, we should return early 
                const formattedDocs = allResources.map((r) => ({
                    name: r.name,
                    source: r.source,
                    // TODO: kind of hacky
                    sections: [{
                        id: r.id ?? '',
                        type: 'content' as const,
                        content: r.content ?? '',
                        contentLength: r.content?.length ?? 0,
                        similarity: 1,
                        contentOffset: 0,
                    }]
                })).filter(notEmpty);
                
                return await this._formatResourceString(formattedDocs, args.disableWrapper);
            }
        }

        // If we got here, we should extract the matched sections from the resources
        const docsWithMatchedSections = allResources
            .filter(r => r.matchedSections?.length)
            .map((r) => {
                // Find sections from the query
                const matchedData = r.matchedSections?.find(m => m.queryText === queryText);
                
                return matchedData ? {
                    name: r.name,
                    source: r.source,
                    sections: matchedData.sections,
                } : null;
            }).filter(notEmpty);

        return await this._formatResourceString(docsWithMatchedSections, args.disableWrapper);
    }
}