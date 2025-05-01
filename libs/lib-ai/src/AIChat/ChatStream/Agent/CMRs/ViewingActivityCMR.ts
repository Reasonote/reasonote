import _ from 'lodash';
import { z } from 'zod';

import { RNCoreMessage } from '@reasonote/lib-ai-common';
import { RNAgentCMR } from '@reasonote/lib-ai-common/src/types/RNAgentCMR';
import {
  GetActivityResultsDeepDocument,
  OrderByDirection,
} from '@reasonote/lib-sdk-apollo-client';
import { JSONSafeParse } from '@reasonote/lib-utils';

import { AI } from '../../../../';

export const ViewingActivityCMRConfigSchema = z.object({
    activityId: z.string().optional(),
    activityResultId: z.string().optional(),
    extraInfo: z.string().optional(),
});

export type ViewingActivityCMRConfig = z.infer<typeof ViewingActivityCMRConfigSchema>;

export class ViewingActivityCMR implements RNAgentCMR {
    name: string = 'ViewingActivity';
    inSchema: z.ZodType<any> = ViewingActivityCMRConfigSchema;
    config: ViewingActivityCMRConfig = {};

    constructor(readonly ai: AI) {}

    async get(message: RNCoreMessage): Promise<string> {
        if (message.role !== 'context') {
            console.warn('message is not context', message);
            return '';
        }

        const contextData = JSONSafeParse(message.contextData);
        if (!contextData.success) {
            console.warn('contextData is not valid json', message);
            return '';
        }

        const { activityId, activityResultId, extraInfo } = contextData.data;

        // Fetch current activity, activity result  (if specified), and current_rsn_user_id in parallel
        const [activityResp, activityResultResp, rsnUserId] = await Promise.all([
            activityId ? this.ai.sb.from('activity')
                .select('*')
                .eq('id', activityId)
                .single() : undefined,
            activityResultId ? this.ai.sb.from('user_activity_result')
                .select('*')
                .eq('id', activityResultId)
                .single() : undefined,
            this.ai.sb.rpc('current_rsn_user_id')
        ]);

        const activity = activityResp?.data;

        //@ts-ignore
        const generatedForSkillPaths: string[] = _.isArray(activity?.generated_for_skill_paths) ? 
                _.isArray(activity?.generated_for_skill_paths?.[0]) ? 
                    activity?.generated_for_skill_paths?.[0] 
                    : 
                    []
                    : 
                [];

        const skillPath = (await this.ai.prompt.skills.getSkillPathAiContext({
            ids: generatedForSkillPaths
        })).data;

        const activityResults = await this.ai.ac.query({
            query: GetActivityResultsDeepDocument,
            variables: {
                filter: {
                    user: {
                        eq: (rsnUserId.data as string) ?? 'FAKE'
                    },
                    activity: {
                        eq: activityId ?? 'FAKE'
                    }
                },
                first: 1,
                orderBy: {
                    createdDate: OrderByDirection.DescNullsLast
                }
            },
            fetchPolicy: 'network-only'
        });

        const resultNodes = activityResults.data?.userActivityResultCollection?.edges?.map(e => e.node) ?? [];

        // TODO: Format previous activities to give AI context about the user's progress.
        // const previousActivityText = (await Promise.all(resultNodes.map(async (r, idx) => {
        //     const typeConfig = JSONSafeParse(r.activity?.typeConfig)?.data;
        //     const activityResult = await this.ai.prompt.activities.activityResultDbToActivityResult(r);

        //     // Use activity type specific formatter if available
        //     if (r.activity?.type && typeConfig && activityResult) {
        //         const actTypeDef = await this.ai.ctx.getActivityTypeDefinition({activityType: r.activity?.type});
        //         if (actTypeDef?.aiStringifier) {
        //             return await actTypeDef.aiStringifier(typeConfig, activityResult);
        //         }
        //     }

        //     // Default formatting
        //     return trimLines(`
        //         <ACT-${idx} type="${r.activity?.type}">
        //             <TYPE_CONFIG>
        //             ${JSON.stringify(r.activity?.typeConfig, null, 2)}
        //             </TYPE_CONFIG>
        //             <USER_RESULT_DATA>
        //             ${JSON.stringify(activityResultResp?.data, null, 2)}
        //             </USER_RESULT_DATA>
        //             <USER_SCORE>
        //             ${r.score}
        //             </USER_SCORE>
        //         </ACT-${idx}>
        //     `);
        // }))).join('\n');

        // Return formatted context
        return `
            <ACTIVITY_CONTEXT description="The user's context for the current activity.">
                <CURRENT_ACTIVITY>
                    <SKILL_PATH description="The skill path the user is currently on, setting the context for the activity.">
                        ${skillPath ? JSON.stringify(skillPath) : `No skill path active.`}
                    </SKILL_PATH>
                    This is what the user is currently doing.

                    ${resultNodes.length > 0 ? `
                        <ACTIVITY_IS_COMPLETE>
                            This activity has been completed, so you can help the user if they have questions.
                        </ACTIVITY_IS_COMPLETE>
                    ` : `
                        <ACTIVITY_IS_NOT_COMPLETE>
                            This activity has not been completed. NEVER give the user the answer outright, instead help them think through the problem.
                        </ACTIVITY_IS_NOT_COMPLETE>
                    `}

                    <ACT description="The current activity the user is working on.">
                    ${activity ? JSON.stringify(activity) : `No activity active.`}
                    </ACT>
                    <RESULT description="The user's result for the current activity">
                    ${activityResultResp?.data ? JSON.stringify(activityResultResp?.data) : `No activity result active.`}
                    </RESULT>
                </CURRENT_ACTIVITY>
                ${extraInfo ? `<EXTRA_INFO>${extraInfo}</EXTRA_INFO>` : ''}
            </ACTIVITY_CONTEXT>
        `;
    }
}
