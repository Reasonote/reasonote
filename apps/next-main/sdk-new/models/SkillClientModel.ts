import _ from "lodash";

import {SkillStub} from "@reasonote/ai-generators";

import {__RsnClientModel__} from "./__RsnClientModel__";

export class SkillClientModel extends __RsnClientModel__ {
    async getSkillsInPath(skillPath: string[]) {
        const {data, error, ...rest} = await this.client.sb.from('skill').select('*').in('id', skillPath);
        
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

    async skillIdToStub(skillId: string, parentSkillIds?: string[]): Promise<{data: SkillStub, error?: string | null | undefined} | {data?: null | undefined, error: any}> {
        // Get all the skills in the path
        const skillsInPath = await this.getSkillsInPath([...(parentSkillIds ?? []), skillId]);

        if (!skillsInPath.data) {
            return {data: null, error: 'No skills in path'}
        }

        // Convert all skills to SkillStubs
        const skillStubs = skillsInPath.data.map((s) => ({
            id: s.id,
            name: s._name,
        }));

        // The last skill is the one we want to use.
        const lastSkill = skillStubs[skillStubs.length - 1];

        return {data: {
            ...lastSkill,
            parentSkills: skillStubs.slice(0, -1),
            parentIds: skillStubs.slice(0, -1).map((s) => s.id),
        }, error: null}
    }

    async addPageToSkill({pageId, skillId}: {pageId: string, skillId: string}) {
        const {data, error, ...rest} = await this.client.sb.from('resource').insert({
            parent_skill_id: skillId,
            child_page_id: pageId,
        }).select('*');
        
        return {data, error, ...rest}
    }

    async upsertSkillsForUser({skillPath, addToUserSkillSet, skillResources}: {skillPath: ({id: string; name?: string}[] | {id?: string, name: string}[]), addToUserSkillSet?: boolean, skillResources?: {pageId?: string | null, snipId?: string | null}[] | null}) {
        if (skillPath.length === 0) {
            return {data: null, error: 'No skills provided'}
        }

        // First, we need to get the skills with ids
        var skillsFull: {id: string, name: string}[] = [];
        const userId = await this.client.currentUserId();
        
        if ((skillPath as any).every((s) => s.name)) {

            


            const {data, error, ...rest} = await this.client.sb.from('skill')
                .insert(skillPath.map((s) => ({
                    _name: s.name,
                    for_user: userId,
                })))
                .select('id, _name');

            if (error) {
                console.error(error)
                throw new Error(error.message)
            }

            // The first skill in the skill path is the root skill.
            // Update all returned skills to have the root skill id.
            const rootSkillId = data[0].id;
            const updatedSkills = data.map((s) => ({...s, root_skill_id: rootSkillId}));
            const {data: updatedData, error: updatedError} = await this.client.sb.from('skill')
                .upsert(updatedSkills, {onConflict: 'id'})
                .select('id, _name');
            
            if (updatedError) {
                console.error(updatedError)
                throw new Error(updatedError.message)
            }

            skillsFull = data?.map((s) => ({id: s.id, name: s._name})) || [];

            // Make sure in same name order as we received them. 
            skillsFull = skillsFull.sort((a, b) => skillPath.findIndex((s) => s.name === a.name) - skillPath.findIndex((s) => s.name === b.name))
        }
        else {
            if ((skillPath as any).every((s) => s.id)) {
                // Otherwise, we assume it's a list of ids.
                const {data, error, ...rest} = await this.client.sb.from('skill').select('id, _name').in('id', skillPath.map((s) => s.id));
                
                if (error) {
                    console.error(error)
                    throw new Error(error.message)
                }

                skillsFull = data?.map((s) => ({id: s.id, name: s._name})) || [];
                
                // Make sure in same order as we received them. 
                skillsFull = skillsFull.sort((a, b) => skillPath.findIndex((s) => s.id === a.id) - skillPath.findIndex((s) => s.id === b.id))
            }
            else {
                return {data: null, error: 'Either all skills must have ids, or all skills must have names.'}
            }
        }

        if (!skillsFull.every((s) => !!s.id)) {
            return {data: null, error: 'Skills did not return with ids'}
        }
        
        if (!skillsFull.every((s) => !!s.name)) {
            return {data: null, error: 'Skills did not return with name'}
        }

        // Now we need to make sure that all the links between adjacent skills exist.
        const {data: existingLinks, error: existingLinksError} = await this.client.sb.from('skill_link').select('*').in('downstream_skill', skillsFull.map((s) => s.id));

        // Walk along our original path, and ensure that the rootSkill is downstream of the second skill, and so on.
        const linksToCreate: {upstream_skill: string, downstream_skill: string}[] = [];
        for (let i = 0; i < skillsFull.length - 1; i++) {
            const currentSkill = skillsFull[i];
            const nextSkill = skillsFull[i + 1];

            const existingLink = existingLinks?.find((link) => link.downstream_skill === currentSkill.id && link.upstream_skill === nextSkill.id);
            if (!existingLink) {
                linksToCreate.push({
                    downstream_skill: currentSkill.id,
                    upstream_skill: nextSkill.id,
                })
            }
        }

        // If we need to make links, do so.
        if (linksToCreate.length > 0) {
            const {data: links, error: linksError} = await this.client.sb.from('skill_link').insert(linksToCreate).select('*');

            if (linksError) {
                return {data: null, error: linksError}
            }
        }

        // Now add the rootSkill to the user's skill set, if we want to.
        if (addToUserSkillSet) {
            const { data: library, error: libraryError } = await this.addSkillsToUserSkillSet({
                addIds: [skillsFull[0].id],
                rsnUserId: userId,
            })

            if (libraryError) {
                return {data: null, error: libraryError}
            }

            return {
                data: {
                    addToSkillSetData: library,
                    skills: skillsFull,
                },
                error: null,
            }
        }

        if (skillResources) {
            const {data: skillResourceData, error: skillResourceError} = await this.addSkillsToUserSkillSet({
                addSkillResources: skillResources,
                rsnUserId: userId,
            })

            if (skillResourceError) {
                return {data: null, error: skillResourceError}
            }
            else {
                return {
                    data: {
                        addToSkillSetData: undefined,
                        addSkillResourceData: skillResourceData,
                        skills: skillsFull,
                    },
                    error: null,
                }
            }
        }

        return {
            data: {
                addToSkillSetData: undefined,
                skills: skillsFull,
            },
            error: null
        }
    }

    async addSkillsToUserSkillSet({
        addIds,
        addSkills,
        addSkillResources,
        rsnUserId
    }: {
        addIds?: string[] | null,
        addSkills?: { id?: string, name: string, description?: string | null, emoji?: string | null }[] | null,
        addSkillResources?: { pageId?: string | null, snipId?: string | null }[] | null,
        rsnUserId?: string | null
    }) {
        try {
            const { data, error } = await this.client.sb.rpc('add_skills_to_user_skill_set', {
                p_add_ids: addIds ?? undefined,
                p_add_skills: addSkills,
                p_add_skill_resources: addSkillResources,
                p_rsn_user_id: rsnUserId ?? undefined
            });

            if (error) {
                throw new Error(error.message);
            }

            // The data returned from the function is now directly what we want
            return { data, error: null };
        } catch (error) {
            console.error('Error in addSkillsToUserSkillSet:', error);
            return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
        }
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