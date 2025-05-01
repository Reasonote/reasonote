import _ from 'lodash';

import {
  notEmpty,
  trimLines,
} from '@lukebechtel/lab-ts-utils';
import { ActivityResult } from '@reasonote/activity-definitions';
import {
  ActivityConfig,
  ActivityGenerateManyRequest,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { GenActContextSection } from '@reasonote/lib-ai';
import {
  ActivityRequestHydratedValues,
} from '@reasonote/lib-ai/ActivityGeneratorV2/types';
import {
  ActivityFlatFragFragment,
  UserActivityResultFlatFragFragment,
} from '@reasonote/lib-sdk-apollo-client';
import { JSONSafeParse } from '@reasonote/lib-utils';

import { priomptRenderToString } from '../priomptUtils/priomptRenderToString';
import { AIPromptObj } from './AIPromptObj';

export class ActivityAIPromptObj extends AIPromptObj {
    async getActivityConfigsFormatted(genRequest: ActivityGenerateManyRequest): Promise<string[]> {
        const { from: { skill, documents, activityConfigs, activityIds } } = genRequest;

        const activityConfigsFromIds = activityIds ?
            ((await this.ai.sb.from('activity').select('*').in('id', activityIds))?.data ?? [])
                .map((ac) => JSONSafeParse(ac.type_config)?.data) ?? []
            : 
            [];

        const activityConfigsFormatted = (await Promise.all([...activityConfigsFromIds, ...(activityConfigs ?? [])].map(async (activityConfig) => {
            return await this.formatConfigResult(activityConfig);
        }) ?? [])).filter(notEmpty);

        return activityConfigsFormatted;
    }

    // Add the data fetcher method
    // async getGenActContextStringArgs(req: ActivityGenerateRequest): Promise<GenActContextSectionProps> {
    //     const { user, userSkill, lesson, from, additionalInstructions, ctxInjectors } = req;
    //     const { skill, activityIds, activityConfigs } = from;

    //     // Fetch source documents if skill is provided
    //     const sourceDocuments = skill && skill.id 
    //         ? await this.ai.prompt.skills.getFormattedResources({ skillId: skill.id, parentSkillIds: from.skill?.parentSkillIds })
    //         : [];

    //     // Get activity prompts from IDs if provided
    //     const fromActivities = activityIds 
    //         ? (await this.ai.sb.from('activity').select('*').in('id', activityIds))?.data ?? [] 
    //         : [];

    //     const fromActivityPrompts = await Promise.all(fromActivities.map(async (activity) => {
    //         const activityConfig = JSONSafeParse(activity?.type_config)?.data;
    //         return this.ai.prompt.activities.formatConfigResult(activityConfig);
    //     }));

    //     // Prepare the context injectors
    //     const ctxInjectorsFormatted = await this.ai.getCtxStringFromInvokeConfigs(ctxInjectors ?? []);

    //     // Prepare the explainer sections
    //     const explainerSections = [
    //         user ? aiExplainerFormat(AI_EXPLAINERS.USER_PROFILE(user)) : null,
    //         userSkill && user && skill ? aiExplainerFormat(AI_EXPLAINERS.USER_SKILL({
    //             user,
    //             userSkill,
    //             skill
    //         })) : null,
    //         skill ? aiExplainerFormat(AI_EXPLAINERS.SKILL_CONTEXT_DOCUMENTS(skill)) : null,
    //         skill?.id ? await this.ai.prompt.skills.formatAllResources({ skillId: skill.id, parentSkillIds: from.skill?.parentSkillIds }) : null,
    //         skill ? aiExplainerFormat(AI_EXPLAINERS.SKILL_EXPERT_QUESTIONS(skill)) : null,
    //         lesson ?
    //             `
    //                 ${aiExplainerFormat(AI_EXPLAINERS.LESSON({ lessonConfig: lesson }))}
    //                 ${'id' in lesson && lesson.id !== undefined ? await this.ai.prompt.lessons.formatSnips({ lessonId: lesson.id }) : ''}
    //                 `
    //             :
    //             null,
    //         aiExplainerFormat(AI_EXPLAINERS.OUTPUT_FORMAT_MARKDOWN_LATEX),
    //         ctxInjectorsFormatted
    //     ].filter(notEmpty);


    //     console.log('sourceDocuments', sourceDocuments);

    //     return {
    //         sourceResources: sourceDocuments.map((sd) => ({
    //             ...sd,
    //             resourceId: sd.id
    //         })),
    //         activityConfigs,
    //         additionalInstructions,
    //         fromActivityPrompts,
    //         explainerSections
    //     };
    // }

    /**
     * TODO: Need to fix these methods, and make sure that the evaluator still works after that...
     */

    // Update the existing method to use the new component and data fetcher
    async generateActivityContextString(req: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}): Promise<string> {
        return await priomptRenderToString(await GenActContextSection.renderAsync(this.ai, req));
    }

    // TODO: do this, then fix the result usage below.
    // TODO: then, make sure this mistake isn't happening elsewhere.
    async activityResultDbToActivityResult(res: UserActivityResultFlatFragFragment & { activity?: ActivityFlatFragFragment | null }): Promise<undefined | ActivityResult> {
        if (res.skipped) {
            return {
                type: 'skipped',
                activityType: res.activity?.type ?? '',
                resultData: JSONSafeParse(res.resultData)?.data,
                activityConfig: JSONSafeParse(res.activity?.typeConfig)?.data,
                grade0to100: res.score,
                feedback: JSONSafeParse(res.metadata)?.data?.feedback,
            }
        }
        else {
            return {
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                // TODO: THIS IS WRONG!!! Treats everything as graded.
                type: 'graded',
                // TODO: THIS IS WRONG!!! Treats everything as graded-numeric.
                // TODO: THIS IS WRONG!!! Treats everything as graded-numeric.
                gradeType: 'graded-numeric',
                activityType: (res.activity?.type ?? '') as any,
                resultData: JSONSafeParse(res.resultData)?.data,
                activityConfig: JSONSafeParse(res.activity?.typeConfig)?.data,
                grade0to100: res.score ?? 0,
                feedback: JSONSafeParse(res.metadata)?.data?.feedback,
            }
        }
    }

    async formatConfigsByIds(ids: string[]) {
        // Get all the activities in batches of 100.

        const chunkedActivityIds = _.chunk(ids, 100);

        const formattedResults = _.flatten(await Promise.all(chunkedActivityIds.map(async (chunk) => {
            const activities = (await this.ai.sb.from('activity').select('*').in('id', chunk)).data;

            if (!activities) {
                console.warn('Error fetching activities:', chunk);
                return [];
            }

            const typeConfigs = activities.map(act => JSONSafeParse(act.type_config)?.data);

            return await Promise.all(typeConfigs.map(async (typeConfig) => {
                if (typeConfig) {
                    return await this.formatConfigResult(typeConfig);
                }
                else {
                    return `<Activity><NotFound/></Activity>`
                }
            }));
        })));

        return `
            <Activities>
                ${formattedResults.join('\n')}
            </Activities>
        `
    }


    async formatConfigById(id: string, resultData?: any) {
        // Fetch
        const activity = (await this.ai.sb.from('activity').select('*').eq('id', id)?.single());

        if (!activity.data) {
            return `
            <Activity id="${id}">
                <NotFound/>
            </Activity>
            `
        }

        const typeConfig = JSONSafeParse(activity.data.type_config)?.data;

        if (!typeConfig) {
            console.warn('No type config found for activity id:', id);
            return `
                <Activity id="${id}">
                    <NoConfigFound/>
                </Activity>
            `
        }

        return await this.formatConfigResult(typeConfig, resultData);
    }

    async formatConfigResult(typeConfig: ActivityConfig, resultData?: ActivityResult) {
        // Protection...
        const usingTypeConfig = _.isString(typeConfig) ? JSONSafeParse(typeConfig)?.data : typeConfig;

        if (!usingTypeConfig) {
            return 'No Type Config Provided';
        }

        // If we have a context formatter, we use that.
        if (usingTypeConfig) {
            const actTypeDef = await this.ai.ctx.getActivityTypeDefinition({ activityType: usingTypeConfig.type });

            if (actTypeDef?.aiStringifier) {
                return actTypeDef.aiStringifier(
                    typeConfig,
                    resultData ? {
                        ...resultData,
                        resultData: JSONSafeParse(resultData.resultData)?.data
                    } : undefined
                );
            }
        }

        const grade0to100 = resultData?.grade0to100;

        // Otherwise we do our best.
        return trimLines(`
            <Activity type="${typeConfig?.type}">
                <TypeConfig>
                ${JSON.stringify(typeConfig, null, 2)}
                </TypeConfig>

                <ResultData>
                ${JSON.stringify(resultData, null, 2)}
                </ResultData>

                <UserScore>
                ${notEmpty(grade0to100) ? `${grade0to100}%` : 'Not Graded'}
                </UserScore>
            </Activity>
        `)
    }
}