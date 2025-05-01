import _ from 'lodash';

import { notEmpty } from '@lukebechtel/lab-ts-utils';
import { Database } from '@reasonote/lib-sdk';
import { JSONSafeParse } from '@reasonote/lib-utils';

import { AIPromptObj } from './AIPromptObj';

type DBActivity = Database['public']['Tables']['activity']['Row'];
type DBLessonActivity = Database['public']['Tables']['lesson_activity']['Row'] & {
    activity: DBActivity | null | undefined
}

type LessonWithActivities = Database['public']['Tables']['lesson']['Row'] & {
    lesson_activity: DBLessonActivity[] | null | undefined
};

export class LessonAIPromptObj extends AIPromptObj {
    async formatMany({lessonIds}: {lessonIds: string[]}) {
        const {data: lessonData} = await this.ai.sb.from('lesson')
            .select('*, lesson_activity(*, activity(*))')
            .in('id', lessonIds);

        return await Promise.all(lessonData?.map(async (lesson) => await this.formatObj(lesson)).filter(notEmpty) ?? []);
    }

    async format({lessonId, context}: {lessonId: string, context?: string}) {
        // Get lesson, & lesson_activity

        const {data: lessonData} = await this.ai.sb.from('lesson')
            .select('*, lesson_activity(*, activity(*))')
            .eq('id', lessonId)
            .single();

        // Order lesson_activity by position
        if (lessonData?.lesson_activity){
            lessonData.lesson_activity = lessonData.lesson_activity.sort((a, b) => a.position - b.position);
        }

        return await this.formatObj(lessonData);
    }

    async formatSnips({lessonId}: {lessonId: string}) {
        const lesson = (await this.ai.sb.from('lesson').select('*').eq('id', lessonId).single())?.data;

        const snipsFromLessonRes = (await this.ai.sb.from('snip').select('*').in('id', lesson?.snip_ids ?? []));
        const snipsFromLesson = snipsFromLessonRes.data ?? [];
        
        if (snipsFromLesson.length > 0){
            return `
            <DOCUMENT_CONTEXT>
                ${snipsFromLesson.map((snip, idx) => {
                    return `
                    <DOC-${idx} name="${snip._name}">
                        ${snip.text_content}
                    </DOC-${idx}>
                    `
                }).join('\n')}
            </DOCUMENT_CONTEXT>
            `
        }
        else {
            return ''
        }
    }

    async formatObj(lesson: LessonWithActivities | null | undefined){
        if (!lesson){
            return null;
        }

        const learningObjectives = JSONSafeParse(lesson.metadata)?.data?.learningObjectives;
        const activities: (DBLessonActivity & {activityText?: string})[] | undefined = 
            lesson.lesson_activity 
            ?
                (await Promise.all(lesson.lesson_activity
                    ?.map(async (lessAct) => {
                        const activity = lessAct.activity;

                        var activityText: string | undefined = undefined;
                        const activityConfig = JSONSafeParse(activity?.type_config)?.data;

                        if (activityConfig){
                            activityText = await this.ai.prompt.activities.formatConfigResult(activityConfig)
                        }

                        return {
                            ...lessAct,
                            activityText
                        }
                    })
                )).filter(notEmpty)
                :
                undefined;

        return `
        <Lesson 
            name="${lesson._name}" 
            summary="${lesson._summary ?? ''}" 
            ${lesson.chapter_order ? `chapterOrder="${lesson.chapter_order}"` : ''}
        >
            ${learningObjectives ? 
                `<LearningObjectives>
                    ${learningObjectives.map((lo: any) => `- ${lo.name}`).join('\n')}
                </LearningObjectives>
                `
                :
                ''
            }
            ${activities && activities.length > 0 ?
                `<Activities>
                    ${activities
                        .map((act, idx) =>
                            `
                            <ACT-${idx} type="${act.activity?._type}">
                                ${act.activityText ? act.activityText : 'No other details available'}
                            </ACT-${idx}>
                            `
                        )
                        .join('\n')
                    }
                </Activities>
                `
                :
                ''
            }
        </Lesson>
        `
    }
}