import { RootSkillCtxInjectorConfig } from '@reasonote/core';

import { AI } from '../../../../';
import { RNCtxInjector } from '../RNCtxInjector';

export class RootSkillCtxInjector extends RNCtxInjector<RootSkillCtxInjectorConfig> {
    name: string = 'RootSkill';
    defaultConfig = null;

    async _get(ai: AI, resolvedConfig: RootSkillCtxInjectorConfig): Promise<{name: string, description?: string, content: string}> {
        if (!resolvedConfig.skillId) {
            throw new Error('skillId is required');
        }

        const {data: rsnUserId} = await ai.ctx.sb.rpc('current_rsn_user_id');

        if (!rsnUserId) {
            throw new Error('rsnUserId is required -- user is not logged in');
        }

        // TODO: This assumes we're generating the subskill tree *for the current user*.
        // This may be the default behavior, but we should have an argument to specify if we're generating a skill
        // Tree for a different user.
        const userSkillDataString = await ai.prompt.skills.formatUserSkillData({
            skillId: resolvedConfig.skillId,
            rsnUserId: rsnUserId as string,
            skillIdPath: resolvedConfig.skillIdPath ?? [],
        });

        // TODO: this only considers the current skill and its parents, 
        // but the resources in the rest of the tree should also be considered.
        const resourcesContextString = await ai.prompt.skills.formatAllResources({
            skillId: resolvedConfig.skillId,
            parentSkillIds: resolvedConfig.skillIdPath ?? [],
        });

        return {
            name: 'RootSkill',
            content: `
            <UserSkillData description="The user\'s skill data for the skill we are generating the subskill tree for.">
                ${userSkillDataString}
            </UserSkillData>
            <RelevantResources description="The relevant resources for the skill we are generating the subskill tree for.">
                ${resourcesContextString}
            </RelevantResources>
            `
        }
    }
}