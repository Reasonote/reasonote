import { CourseCtxInjectorConfig } from '@reasonote/core';

import { AI } from '../../../../';
import { RNCtxInjector } from '../RNCtxInjector';

export class CourseCtxInjector extends RNCtxInjector<CourseCtxInjectorConfig> {
    name: string = 'Course';
    defaultConfig = null;

    async _get(ai: AI, resolvedConfig: CourseCtxInjectorConfig): Promise<{name: string, description?: string, content: string}> {
        if (!resolvedConfig.courseId) {
            throw new Error('courseId is required');
        }

        const course = await ai.sb.from('course').select('*').eq('id', resolvedConfig.courseId).single();

        // Get all lessons for the course
        const lessons = await ai.sb.from('course_lesson').select('*, lesson(id)').eq('course_id', resolvedConfig.courseId);

        const formattedLessons = await ai.prompt.lessons.formatMany({ lessonIds: lessons.data?.map(l => l.lesson.id) ?? [] });

        const formattedResources = await ai.prompt.resources.formatResources({
            // TODO: The query for the fetched resources should probably be more than the name, but this will do for now...
            queryText: `${course.data?._name} (${course.data?._description ?? ''})`,
            filter: {
                courseId: resolvedConfig.courseId
            }
        });

        return {
            name: 'Course',
            content: `
            <Course>
                <Lessons>
                    ${formattedLessons}
                </Lessons>
                <Resources>
                    ${formattedResources}
                </Resources>
            </Course>
            `
        }
    }
}