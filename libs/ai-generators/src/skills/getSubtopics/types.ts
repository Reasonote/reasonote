import { z } from 'zod';

import { AIGenerator } from '@reasonote/lib-ai-common';

import { AIExtraContext } from '../../utils/AIExtraContext';

export const ExpertQuestionSchema = z.object({
    question: z.string(),
    answer: z.string()
});

// Keep emoji at the end
export const SubTopicSchema = z.object({
    name: z.string(),
    description: z.string(),
    expertQuestions: z.array(ExpertQuestionSchema),
    emoji: z.string(),
});

export const SubTopicsResponseSchema = z.object({
    subTopics: z.array(SubTopicSchema)
});

export interface GetSubtopicsArgs {
    ai: AIGenerator;
    skill: {
        name: string;
        description?: string | null;
    };
    numTopics?: number;
    customPrompt?: string;
    existingTopics?: Array<{
        name: string;
        description: string;
        emoji: string;
    }>;
    extraContext?: Array<AIExtraContext>;
    includeExpertQuestions?: boolean;
} 