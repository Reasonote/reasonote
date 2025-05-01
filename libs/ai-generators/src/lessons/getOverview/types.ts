import { z } from 'zod';

import { ActivityTypesGradedSchema } from '@reasonote/core';
import { Activity } from '@reasonote/core/src/interfaces/Activity';
import { AIGenerator } from '@reasonote/lib-ai-common';

export interface GetLessonOverviewBaseArgs {
    // The AI Generator to use
    ai: AIGenerator;
 
    // Core lesson info
    lessonContext: string;

    // What fields to generate
    fieldsToGet: Array<'slides' | 'practice'>;

    // Context - all pre-formatted strings
    skillContext?: {
        name: string;
        aiContext?: string;
        resources?: string;
    };

    // Optional additional context
    existingActivities?: Activity[];
}

export interface GetLessonOverviewArgs extends GetLessonOverviewBaseArgs {
    /**
     * Optional arguments to pass to genObject
     */
    genObjectArgs?: Parameters<AIGenerator['genObject']>[0];
}

export interface GetLessonOverviewStreamArgs extends GetLessonOverviewBaseArgs {
    /**
     * Optional arguments to pass to streamGenObject
     */
    streamGenObjectArgs?: Parameters<AIGenerator['streamGenObject']>[0];
}


export type LessonOverviewItem = 
    | { type: 'slide'; titleEmoji: string; title: string; content: string; }
    | { type: z.infer<typeof ActivityTypesGradedSchema>; [key: string]: any; }; // For activities

// Define the schema here instead of importing from core
export const LessonOverviewSchema = z.object({
    slides: z.array(z.object({
        type: z.literal('slide'),
        titleEmoji: z.string(),
        title: z.string(),
        content: z.string()
    })).nullable(),
    practice: z.object({
        activities: z.array(z.object({
            type: ActivityTypesGradedSchema,
            // TODO: this should produce things like:
            // - ["function", "derivative", "constant"]
            conceptsCovered: z.array(z.string()).describe('The concepts that are covered in the activity'),
            // Add other activity fields as needed
            // TODO: this should produce things like:
            // - "covers key definitions, such as 'definition of a function'"
            // - "review core misunderstanding, such as 'the derivative of a constant is 0'"
            // - "review core misunderstanding, such as 'the derivative of a constant is 0'"
            subject: z.string().describe('The subject of the activity'),
            description: z.string().describe('A description of the activity that should be created.'),
        }))
    }).nullable(),
}); 