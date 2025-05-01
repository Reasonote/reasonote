import _ from 'lodash';

import { Document } from '@langchain/core/documents';
import {
  notEmpty,
  trimAllLines,
  trimLines,
} from '@lukebechtel/lab-ts-utils';

import { AIPromptFormatterConfig } from '../AIPrompt';
import { GroupToSize } from '../GroupToSize';
import { AIPromptObj } from './AIPromptObj';

export class AIPromptObjSkills extends AIPromptObj {
    async formatSnips({skillId, header, disableHeader, aiGenerateContext}: {
        skillId: string, 
        header?: string,
        disableHeader?: boolean,
        aiGenerateContext?: string,
        config?: AIPromptFormatterConfig
    }) {
        const {
            directSnips,
            resources,
        } = await this.getSkillPromptData({skillIds: [skillId]});

        const snipsFromResources = resources?.map((r) => r.snip);

        const allSnips = [...(directSnips ?? []), ...(snipsFromResources ?? [])].filter(notEmpty);

        // TODO: Get the sections of the snips that are most relevant,
        // either based on the context, or based on the skill name & description.
        if (aiGenerateContext){
            const snipsWithTextContent = allSnips.filter((snip) => !!snip.text_content && snip.text_content.trim().length > 0);
    
            if (snipsWithTextContent.length < 1){
                console.warn('No snips with text content found');
                return ``;
            }

            const grouper = new GroupToSize(this.ai);
            const docGroups = await grouper.groupDocs({
                docs: snipsWithTextContent.map((snip) => new Document<typeof allSnips[number]>({pageContent: snip.text_content!, metadata: snip})),
                ai: this.ai,
                maxTokensPerGroup: 10000 // TODO: load from model type
            });

            if (docGroups.length < 1){
                console.warn('No document groups found');
                return ``;
            }

            const relDocs = await this.ai.condense.aiSingle.condenseGroups({
                groups: docGroups,
                context: aiGenerateContext
            });
            
            // Now, for each group, ask the AI to pull out any relevant information for the group. 
            const ret = trimLines(`
                <RELEVANT_CONTEXT description="${header ?? 'The following documents help construct relevant context for the skill you are teaching:'}">
                    <SNIPS>
                        ${relDocs.map((d) => `
                        <SNIP name="${d.doc.metadata._name}" source="${d.doc.metadata.source_url}">
                            ${d.relevantInfo}
                        </SNIP>
                        `).join('\n')}
                    </SNIPS>
                </RELEVANT_CONTEXT>
            `);

            return ret;
        }
        else {
            return `
            <RELEVANT_CONTEXT description="${header ?? 'The following documents help construct relevant context for the skill you are teaching:'}">
                <SNIPS>
                    ${allSnips.map((s) => `
                    <SNIP name="${s._name}" source="${s.source_url}">
                        ${s.text_content}
                    </SNIP>
                    `).join('\n')}
                </SNIPS>
            </RELEVANT_CONTEXT>
            `
        }        
    }

    async getAllResources(args: Awaited<ReturnType<AIPromptObjSkills['getSkillPromptData']>>) {
        const {resources, directSnips} = args;

        const snipsFromResources = resources?.map((r) => r.snip).filter(notEmpty);
        const pagesFromResources = resources?.map((r) => r.rsn_page).filter(notEmpty);

        const allSnips = [...(directSnips ?? []), ...(snipsFromResources ?? [])].filter(notEmpty);
        const allResources = [
            ...allSnips.map(snip => ({
                entityId: snip.id,
                type: 'snip' as const,
                name: snip._name,
                source: snip.source_url,
                content: snip.text_content
            })),
            ...(pagesFromResources ?? []).map(page => ({
                entityId: page.id,
                type: 'page' as const,
                name: page._name,
                source: page.original_filename,
                content: page.body
            }))
        ].filter(resource => !!resource.content && resource.content.trim().length > 0);
        
        return allResources;
    }

    async formatAllResources({skillId, header, disableHeader, overrideQueryText, parentSkillIds, disableGreedy, ...args}: {
        skillId: string, 
        header?: string,
        disableHeader?: boolean,
        overrideQueryText?: string,
        parentSkillIds?: string[],
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
        config?: AIPromptFormatterConfig,
        disableGreedy?: boolean
    }) {
        const formattedResources = await this.getFormattedResources({skillId, header, disableHeader, overrideQueryText, parentSkillIds, disableGreedy, ...args});

        if (formattedResources.length < 1){
            return `
            <RELEVANT_CONTEXT description="${header ?? 'The following documents help construct relevant context:'}">
                <RESOURCES>
                    <NO_RESOURCES_FOUND/>
                </RESOURCES>
            </RELEVANT_CONTEXT>
            `;
        }

        return `
        <RELEVANT_CONTEXT description="${header ?? 'The following documents help construct relevant context:'}">
            <RESOURCES>
                ${formattedResources.join('\n')}
            </RESOURCES>
        </RELEVANT_CONTEXT>
        `;
    }

    /**
     * Gets the formatted resources for the given skill.
     * 
     * Results look like:
     * <doc name="name" source="source">
     *     <section sectionOffset="0">
     *         content
     *     </section>
     * </doc>
     * 
     * @param skillId - The skill to get resources for.
     * @param header - The header to use for the resources.
     * @param disableHeader - Whether to disable the header.
     * @param overrideQueryText - The override query text to use for the resources.
     * @param parentSkillIds - The parent skill ids to use for the resources.
     * @param disableGreedy - Whether to disable greedy.
     * @returns The formatted resources.
     */
    async getFormattedResources({skillId, header, disableHeader, overrideQueryText, parentSkillIds, disableGreedy, ...args}: {
        skillId: string, 
        header?: string,
        disableHeader?: boolean,
        overrideQueryText?: string,
        parentSkillIds?: string[],
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
        config?: AIPromptFormatterConfig,
        disableGreedy?: boolean
    }): Promise<string[]> {
        // DEFAULTS
        const matchMaxTokens = args.matchMaxTokens ?? 50_000;
        const matchMaxResults = args.matchMaxResults ?? 100;

        const {
            directSnips,
            resources,
            skills,
        } = await this.getSkillPromptData({skillIds: [skillId, ...(parentSkillIds ?? [])]});

        const skillName = skills?.find((s) => s.id === skillId)?._name;

        const skillPathName = (await this.getSkillPathAiContext({ids: [...(parentSkillIds ?? []), skillId]})).data;

        if (!skillName){
            throw new Error(`Skill ${skillId} not found`);
        }

        const snipsFromResources = resources?.map((r) => r.snip).filter(notEmpty);
        const pagesFromResources = resources?.map((r) => r.rsn_page).filter(notEmpty);

        const allSnips = [...(directSnips ?? []), ...(snipsFromResources ?? [])].filter(notEmpty);
        const allResources = [
            ...allSnips.map(snip => ({
                entityId: snip.id,
                type: 'snip' as const,
                name: snip._name,
                source: snip.source_url,
                content: snip.text_content
            })),
            ...(pagesFromResources ?? []).map(page => ({
                entityId: page.id,
                type: 'page' as const,
                name: page._name,
                source: page.original_filename,
                content: page.body
            }))
        ].filter(resource => !!resource.content && resource.content.trim().length > 0);


        // If there are no resources, then we're done.
        if (allResources.length < 1) {
            return [];
        }


        // If we're allowed to be greedy.
        if (!disableGreedy) {
            // First, check to see if we can fit all resources in the available context based on their token length.
            // If they fit -- then we just embed all of them.
            const totalTokens = (await Promise.all(allResources.map(async (resource) => this.ai.tokens.encode(resource.content!)))).reduce((acc, token) => acc + token.length, 0);
            if (totalTokens <= matchMaxTokens) {
                const docs = allResources.map((resource) => new Document({
                    pageContent: resource.content!,
                    metadata: resource
                }));

                return docs.map((d) => trimLines(`
                    <DOC name="${d.metadata.name}" source="${d.metadata.source}">
                        ${d.pageContent}
                    </DOC>
                `));
            }
        }

        const groupResult = await this.ai.vectors.matchGroupDocs({
            queryText: overrideQueryText ?? (skillPathName ?? skillName),
            minContentLength: 10,
            // TODO: this should probably search snip too, no?
            filterTablename: 'rsn_page',
            filterColname: 'body',
            maxTokens: matchMaxTokens,
            matchCount: matchMaxResults,
            filterRefIds: allResources.map((r) => r.entityId),
        })

        const docsWithNames = groupResult.docs.map((r) => {
            const resource = allResources.find((res) => res.entityId === r._ref_id);
            return {
                ...r,
                name: resource?.name,
            }
        })

        return docsWithNames.map((r) => trimLines(`
            <doc name="${r.name}" source="${r.result_colpath}">
                    ${r.sections.map((s) => s.type === 'content' ? 
                        trimLines(`
                        <section sectionOffset="${s.contentOffset}">
                            ${s.content}
                        </section>
                        `) 
                        : 
                        trimAllLines(`
                        <gap gapLength="${s.gapLength}"/>
                    `)).join('\n')}
            </doc>
        `));
    }

    async formatUserSkillData({skillId, rsnUserId, skillIdPath}: {
        skillId: string, 
        rsnUserId: string,
        skillIdPath: string[],
        config?: AIPromptFormatterConfig
    }) {
        const {skills} = await this.getSkillPromptData({skillIds: [skillId]});

        const userSkill = skills?.[0]?.user_skill?.[0];

        if (!userSkill) {
            return `
            <USER_SKILL_INFO>
                <SELF_ASSESSED_SKILL_LEVEL>
                    The user has not yet self-assessed their skill level for this skill.
                </SELF_ASSESSED_SKILL_LEVEL>
                <SKILL_INTEREST_REASONS>
                    The user has not yet indicated any interest reasons for this skill.
                </SKILL_INTEREST_REASONS>
            </USER_SKILL_INFO>
            `
        }
        else {
            return `
            <USER_SKILL_INFO>
                <SELF_ASSESSED_SKILL_LEVEL>
                The user has self-assessed their skill level for this skill as ${userSkill.self_assigned_level}.
                </SELF_ASSESSED_SKILL_LEVEL>
                <SKILL_INTEREST_REASONS>
                    ${
                        userSkill?.interest_reasons ? 
                            userSkill.interest_reasons.map((r) => `
                            <REASON>
                                ${r}
                            </REASON>
                            `).join('\n')
                        :
                        ''
                    }
                </SKILL_INTEREST_REASONS>
            </USER_SKILL_INFO>
            `
        }
    }

    // TODO: this should actually take in a skillIdPath.
    // If we're studying a subject in a particular loction, we wanna know the context.
    // We also don't wanna overfetch on sibling branches, bc why?
    async getSkillPromptData({skillIds}: {skillIds: string[]}){
        const {sb} = this.ai.ctx;
        const skillRes = await sb.from('skill').select('*, snip(*), resource(snip(*), rsn_page(*)), user_skill(*)').in('id', skillIds)

        return {
            skills: skillRes?.data,
            directSnips: _.flatten(skillRes?.data?.map((s) => s.snip)).filter(notEmpty),
            resources: _.flatten(skillRes?.data?.map((s) => s.resource)).filter(notEmpty),
        }
    }

    /**
     * Gets all skills that are upstream or downstream of the given skill.
     * @param skillId The skill to get connections for.
     * @returns An object containing the data, error, and other metadata.
     */
    async getConnectedSkills(skillId: string) {
        // Upstream..
        const {data: upstreamData, error: upstreamError, ...upstreamRest} = await this.ai.ctx.sb.rpc('get_linked_skills_with_scores', {input_skill_id: skillId, user_id: ''});
        const {data: downstreamData, error: downstreamError, ...downstreamRest} = await this.ai.ctx.sb.rpc('get_downstream_skills_with_scores', {input_skill_id: skillId, user_id: ''});
        
        // Combine the two.
        const data = [...(upstreamData ?? []), ...(downstreamData ?? [])]
        const error = upstreamError ?? downstreamError;
        const rest = {...upstreamRest, ...downstreamRest}

        return {data, error, upstreamRest, downstreamRest}
    }

    async getSkillsInPath(skillPath: string[]) {
        if (skillPath.length < 1){
            return {data: [], error: null}
        }

        const {data, error, ...rest} = await this.ai.sb.from('skill').select('*').in('id', skillPath);
        
        if (!data){
            return {data, error, ...rest}
        }
        else {
            // Make sure it's in the same order.
            const newData = data.sort((a: any, b: any) => skillPath.indexOf(a.id) - skillPath.indexOf(b.id))
            return {
                data: newData,
                error,
                ...rest
            }
        }
    }

    async getSkillPathExplainer({skillId, parentSkillIds}: {skillId: string, parentSkillIds?: string[]}) {
        return await this.getSkillPathAiContext({ids: [...(parentSkillIds ?? []), skillId]});
    }

    async getSkillPathAiContext({ids, names}: {ids?: string[], names?: string[]}) {
        if (ids && names) {
            return {data: null, error: 'Cannot provide both ids and names'}
        }
        
        var namesUsing = names;
        
        // If we got ids, grab skills in path, and override names.
        if (ids){
            const skillsInPath = await this.getSkillsInPath(ids)
            namesUsing = skillsInPath.data?.map((s) => s._name)
        }
        
        if (!namesUsing) {
            return {data: null, error: 'No ids or names provided'}
        }

        const lastSkillName = namesUsing[namesUsing.length - 1]
        if (!lastSkillName){
            return {data: null, error: 'No skill name provided'}
        }

        return {
            data: `${lastSkillName}${namesUsing.length > 1 ? ` (In the context of ${namesUsing.slice(0, -1).join(' > ')})` : ''}`
        }
    }
}