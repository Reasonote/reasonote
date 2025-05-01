import { z } from 'zod';

import { RNCoreMessage } from '@reasonote/lib-ai-common';
import { RNAgentCMR } from '@reasonote/lib-ai-common/src/types/RNAgentCMR';

import { AI } from '../../../../';

export const ViewingLessonCMRConfigSchema = z.object({
    lessonId: z.string().optional(),
});
    
export type ViewingLessonCMRConfig = z.infer<typeof ViewingLessonCMRConfigSchema>;

export class ViewingLessonCMR implements RNAgentCMR {
    name: string = 'ViewingLesson';
    inSchema: z.ZodType<any> = ViewingLessonCMRConfigSchema;
    config: ViewingLessonCMRConfig = {};

    constructor(readonly ai: AI) {}

    async get(message: RNCoreMessage): Promise<string> {
        if (!this.config.lessonId) {
            throw new Error('lessonId is required');
        }

        const activityPrompt = await this.ai.prompt.lessons.format({ lessonId: this.config.lessonId });

        return activityPrompt ?? '';
    }
}
