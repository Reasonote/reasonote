import { z } from 'zod';

import {
  DocDB,
  DocDBFilter,
} from '../../docdb';

export const SkillDetailsSchema = z.object({
    skillName: z.string(),
    description: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    goals: z.array(z.string()),
    emoji: z.string(),
});

export type SkillDetails = z.infer<typeof SkillDetailsSchema>;

export interface DocumentInfo {
    id: string;
    fileName: string;
    content: string;
    pageId?: string;
    metadata?: Record<string, any>;
}

export interface DocumentInfoWithSummary extends DocumentInfo {
    title: string;
    summary: string;
    totalChunks: number;
}

export interface SuggestSkillArgs {
    userInput?: string;
    // Option 1: Provide raw documents directly
    documents?: Array<DocumentInfo>;
    // Option 2: Use DocDB with filter
    docDB?: DocDB;
    docDBFilter?: DocDBFilter;
    
    // Maximum number of tokens to include from documents
    // If not provided, defaults to 10,000
    maxDocTokens?: number;
    
    // AI model to use for generating the skill
    // If not provided, defaults to "openai:gpt-4o-mini"
    model?: string;
}

export interface SuggestSkillResult {
    skillDetails: SkillDetails;
} 