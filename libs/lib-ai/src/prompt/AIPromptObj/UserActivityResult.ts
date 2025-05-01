import _ from 'lodash';

import { FetchPolicy } from '@apollo/client';
import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  GetActivityResultsDeepDocument,
  GetActivityResultsDeepQueryVariables,
} from '@reasonote/lib-sdk-apollo-client';
import { JSONSafeParse } from '@reasonote/lib-utils';

import { AIPromptObj } from './AIPromptObj';

export class UserActivityResultAIPromptObj extends AIPromptObj {
    async format(props: {variables: GetActivityResultsDeepQueryVariables, fetchPolicy?: FetchPolicy}){
        const activityResults = await this.ai.ac.query({
            query: GetActivityResultsDeepDocument,
            variables: props.variables,
            fetchPolicy: props.fetchPolicy
        })

        const resultNodes = activityResults.data?.userActivityResultCollection?.edges?.map(e => e.node) ?? [];

        const activityText = (await Promise.all(resultNodes.map(async (r, idx) => {
            const typeConfig = JSONSafeParse(r.activity?.typeConfig)?.data;

            const activityResult = await this.ai.prompt.activities.activityResultDbToActivityResult(r);

            // If we have a context formatter, we use that.
            if (r.activity?.type && typeConfig){
                const actTypeDef = await this.ai.ctx.getActivityTypeDefinition({activityType: r.activity?.type});

                if (actTypeDef?.aiStringifier){
                    return await actTypeDef.aiStringifier(
                        typeConfig,
                        activityResult
                    );
                }
            }

            // Otherwise we do our best.
            return trimLines(`
                # Activity ${idx}
                ## Type
                ${r.activity?.type}
                ## Type Config
                ${JSON.stringify(r.activity?.typeConfig, null, 2)}

                ## User's Result Data
                ${JSON.stringify(r.resultData, null, 2)}

                ## User's Score
                ${r.score}
            `)
        }))).join('\n');

        return activityText;
    }
}


/**
 * 
 * 
 */