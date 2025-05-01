import { BasicUserInfoCtxInjectorConfig } from '@reasonote/core';

import { AI } from '../../../../';
import { RNCtxInjector } from '../RNCtxInjector';

export class BasicUserInfoCtxInjector extends RNCtxInjector<BasicUserInfoCtxInjectorConfig> {
    name: string = 'BasicUserInfo';
    defaultConfig = null;

    async _get(ai: AI, resolvedConfig: BasicUserInfoCtxInjectorConfig): Promise<{name: string, description?: string, content: string}> {
        // Fetch the user's basic details
        // TODO maybe a faster way to do this
        const rsnUserId = (await ai.sb.rpc('current_rsn_user_id')).data;

        if (!rsnUserId) {
            return {
                name: 'BasicUserInfo',
                content: ''
            }
        }

        const user = await ai.sb.from('rsn_user').select('*, user_profile(*), user_setting!user_setting_rsn_user_fkey(*)').eq('id', rsnUserId).single();

        if (!user.data) {
            return {
                name: 'BasicUserInfo',
                content: ''
            }
        }

        return {
            name: 'BasicUserInfo',
            description: 'Basic information about the current user.',
            content: JSON.stringify(user.data, null, 2)
        }
    }
}