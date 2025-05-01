import { MatchGroupDocsSection } from '../vectors/VectorStore';

/**
 * Defines return types for the unified resource formats used throughout the application.
 * This common format allows for consistent handling of different resource types.
 */
export type UnifiedResource = {
    id?: string | null;
    entityId?: string | null;
    type: 'page' | 'snip';
    name: string | null;
    source: string | null;
    content: string | null;
    /**
     * Stores sections of the resource that matched query texts from vector search.
     * This is used to highlight and prioritize relevant portions of a document
     * when showing content to users or processing documents with AI.
     * 
     * Each entry contains:
     * - queryText: The original query that matched this section
     * - sections: Array of matched sections with their content and position information
     */
    matchedSections?: Array<{
      queryText: string;
      sections: MatchGroupDocsSection[];
    }>;
  };