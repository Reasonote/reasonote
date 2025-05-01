import _ from 'lodash';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import { AI_EXPLAINERS } from '@reasonote/core-static-prompts';
import {
  SimpleSkillTreeFactory,
  SimpleSkillTreeNode,
} from '@reasonote/lib-ai-common';
import { Database } from '@reasonote/lib-sdk';
import {
  GetActivityResultsDeepDocument,
} from '@reasonote/lib-sdk-apollo-client';
import { JSONSafeParse } from '@reasonote/lib-utils';

import { AI } from '../../AI';
import { RESIChatMessage } from '../../interfaces';

type DBChatMessage = Database['public']['Tables']['chat_message']['Row'];


interface ChatInputFormatterFormatArgs {
    chatId: string;
    botId?: string;
}

interface ChatInputFormatterFormatResult {
    messages: RESIChatMessage[];
}


export class ChatInputFormatter {
    constructor(readonly ai: AI){}

    async format(args: ChatInputFormatterFormatArgs): Promise<ChatInputFormatterFormatResult> {
        const {chatId, botId} = args;

        const chatMsgResp = await this.ai.sb.from('chat_message')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_date', {ascending: true})
        
        const chatMessages = chatMsgResp.data;

        if (!chatMessages){
            return {
                messages: [{
                    role: 'system',
                    content: 'You are a helpful assistant.'
                }]
            };
        }

        var seenContextTypeAndIds = new Set<`${string}-${string}`>();

        const messagesBefore = await Promise.all(chatMessages
            // We reverse here so it makes it easier for us to perform our seenContextTypeAndIds check.
            // Specifically, we always show the *last* message of a given context type.
            // So we don't have to go back and adjust, we just do the work in reverse, showing the first one.
            ?.reverse()
            .map(async (msg) => {
                const functionCallName = _.get(msg, 'function_call.name') as any;
                const functionCallArguments = _.get(msg, 'function_call.arguments') as any;

                const function_call = functionCallName && functionCallArguments ? {
                    name: functionCallName,
                    arguments: JSON.stringify(functionCallArguments)
                } : undefined;

                // Context messages.
                if (msg.context_type && msg.context_id) {
                    // Now, we only use the 'active' formatter for the most recent instance of a context_type.
                    const contextTypeAndId = `${msg.context_type}-${msg.context_id}` as const;
                    
                    const formatter = this.formatters[msg.context_type];
                    if (formatter){
                        // If we already have this, we don't need to show it.
                        if (seenContextTypeAndIds.has(contextTypeAndId)){
                            return {
                                role: 'system' as const,
                                content: await formatter.inactive(msg)
                            }
                        }
                        else {
                            seenContextTypeAndIds.add(contextTypeAndId);
                            return {
                                role: 'system' as const,
                                content: await formatter.active(msg)
                            }
                        }
                    }
                    else {
                        return {
                            role: 'system' as const,
                            content: msg.body ?? `
                                <${msg.context_type}>
                                ${JSON.stringify(msg.context_data)}
                                </${msg.context_type}>
                            `
                        }
                    }
                }
                // Just a normal message.
                else {
                    return {
                        role: (msg._role ? msg._role : (msg.bot_id ? 'assistant' : 'system')) as any,
                        content: msg.body ?? trimLines(`
                            <CONTEXT>
                            ${JSON.stringify(msg.context_data)}
                            </CONTEXT>
                        `),
                        function_call
                    }
                }
            })
            ?.reverse()
        )

        const botResp = botId ? await this.ai.sb.from('bot')
            .select('*')
            .eq('id', botId)
            .single() : undefined;
 
        const botPrompt = botResp?.data?.prompt;
 
        if (!botPrompt){
            return {
                messages: [{
                    role: 'system',
                    content: 'You are a helpful assistant named Reasonator.'
                },
                ...messagesBefore
                ]
            }
        }
        else {
            return {
                messages: [
                    {
                        role: 'system',
                        content: botPrompt
                    },
                    ...messagesBefore,
                ]
            }
        }
    }

    formatters: Record<string, {active: (msg: DBChatMessage) => Promise<string>, inactive: (msg: DBChatMessage) => Promise<string>}> = {
        'viewing_skill': {
            active: async (msg: DBChatMessage): Promise<string> => {
                const skillId = _.get(msg, 'context_data.skillId');
                
                if (!skillId){
                    return '<SKILL_CONTEXT> No skill ID found. </SKILL_CONTEXT>'
                }
                
                const skillRes = await this.ai.sb.from('skill')
                    .select('*')
                    .eq('id', skillId)
                    .single();

                if (!skillRes.data){
                    return '<SKILL_CONTEXT> Skill not found. </SKILL_CONTEXT>'
                }

                const {data: skillsWithScores} = await this.ai.sb.rpc('get_linked_skills_with_scores', {
                    input_skill_id: skillId,
                    user_id: 'FAKE'
                });

                if (!skillsWithScores){
                    return '<SKILL_CONTEXT> No skill tree found. </SKILL_CONTEXT>'
                }

                const skillTree = SimpleSkillTreeFactory.fromSkillsWithScores({
                    skillsWithScores,
                    skillId
                });

                const formatter = (n: SimpleSkillTreeNode) => {
                    if (n.activity_result_count_upstream > 0){
                        return `${n.skill_name} (USER SCORE: ${n.average_normalized_score_upstream * 100}%)`
                    }
                    else {
                        return `${n.skill_name} (USER SCORE: No results)`
                    }
                }

                const treeString = SimpleSkillTreeFactory.toAiStringNoLevels({skillTree, indent: 0, formatLine: formatter});

                return `
                    <SKILL_CONTEXT>
                        The user is viewing one of their skills.
                        <SKILL>
                            <NAME>${skillRes.data._name}</NAME>
                            ${skillRes.data._description ? `<DESCRIPTION>${skillRes.data._description}</DESCRIPTION>` : ''}
                            <SKILL_TREE>
                                ${treeString}
                            </SKILL_TREE>
                        </SKILL>
                    </SKILL_CONTEXT>
                `;
            },
            inactive: async (msg: DBChatMessage): Promise<string> => {
                return `
                    <SKILL_CONTEXT>
                        This context may have been updated, and is no longer active.
                    </SKILL_CONTEXT>
                `
            }
        },
        'viewing_lesson': {
            active: async (msg: DBChatMessage): Promise<string> => {
                const lessonId = _.get(msg, 'context_data.lessonId');             
                const activityId = _.get(msg, 'context_data.activityId');
                const lessonSessionId = _.get(msg, 'context_data.lessonSessionId');
                const extraInfo = _.get(msg, 'context_data.extraInfo');

                const lessonSession = lessonSessionId ? await this.ai.sb.from('lesson_session')
                    .select('*')
                    .eq('id', lessonSessionId)
                    .single() : undefined;

                // Now, we fetch the lesson and activity.
                const lessonResp = await this.ai.sb.from('lesson')
                    .select('*')
                    .eq('id', lessonId ?? lessonSession?.data?.lesson ?? 'FAKE')
                    .single();
                
                const lesson = lessonResp.data;

                const activityResp = activityId ? await this.ai.sb.from('activity')
                    .select('*')
                    .eq('id', activityId)
                    .single() : undefined;

                const activity = activityResp?.data;


                // TODO: this should be fetched once at start, along with all the other stuff for this lesson or lesson session.
                // Then we can just use that result and get all the other data we need, saving many fetches...
                const activityResults = await this.ai.ac.query({
                    query: GetActivityResultsDeepDocument,
                    variables: {
                        filter: {
                            lessonSessionId: {
                                eq: lessonSessionId
                            }
                        }
                    },
                    fetchPolicy: 'network-only'
                })

                const resultNodes = activityResults.data?.userActivityResultCollection?.edges?.map(e => e.node) ?? [];

                const previousActivityText = (await Promise.all(resultNodes.map(async (r, idx) => {
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
                
                // Now, we need to format this into a message for the AI to see.
                return `
                    <LESSON_CONTEXT>
                        The user is viewing a lesson.
                        <LESSON>
                            ${lesson ? AI_EXPLAINERS.LESSON_DB({lesson}) : `Lesson not found.`}
                        </LESSON>

                        <PREVIOUS_ACTIVITIES>
                            This is what the user has done so far.
                            <ACTS>
                            ${resultNodes.length > 0 ? previousActivityText : 'No activities completed.'}
                            </ACTS>
                        </PREVIOUS_ACTIVITIES>

                        <CURRENT_ACTIVITY>
                            This is what the user is currently doing.
                            <ACT>
                            ${activity ? JSON.stringify(activity) : `No activity active.`}
                            </ACT>
                        </CURRENT_ACTIVITY>
                        ${extraInfo ? `<EXTRA_INFO>${extraInfo}</EXTRA_INFO>` : ''}
                    </LESSON_CONTEXT>
                `;
            },
            inactive: async (msg: DBChatMessage): Promise<string> => {
                // If this is the user not viewing an activity, we need to fetch the activity.
                return `<LESSON_CONTEXT>
                    This context may have been updated.
                </LESSON_CONTEXT>
                `
            }
        }
    }
}