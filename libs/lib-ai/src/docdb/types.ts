import { z } from 'zod';

/**
 * Represents a document in the DocDB
 */
export interface Document {
  id: string;
  fileName: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Represents a chunk of a document with position information
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  startPosition: number;
  endPosition: number;
  metadata?: Record<string, any>;
  vector?: number[]; // Vector representation for similarity search
}

/**
 * Extends DocumentChunk to include a similarity score for search results
 */
export interface DocumentChunkSearchResult extends DocumentChunk {
  similarity: number; // Similarity score from vector search
}

/**
 * Search result containing chunks and their source documents
 */
export interface DocDBSearchResult {
  chunks: DocumentChunk[]; // Ordered by relevance
  documents: Map<string, Document>; // Map of document IDs to documents
  
  // Method to expand window around a chunk
  expandWindow(chunkId: string, windowSize: number): DocumentChunk[];
}

/**
 * Filter options for DocDB
 */
export interface DocDBFilter {
  documentIds?: string[]; // Filter to specific document IDs
  tags?: string[]; // Filter by document tags
  metadata?: Record<string, any>; // Filter by document metadata
  // Add more filter options as needed
}

/**
 * Search options for DocDB
 */
export interface DocDBSearchOptions {
  query: string;
  maxResults?: number;
  threshold?: number;
  filter?: DocDBFilter; // Use the DocDBFilter interface for filtering
}

/**
 * Options for hierarchical chunk analysis
 */
export interface HierarchicalAnalysisOptions<T> {
  // The question to ask about each chunk group
  question: string;
  
  // Zod schema for the analysis result
  schema: z.ZodType<T>;
  
  // Maximum number of chunks per group
  chunkGroupSize?: number;
  
  // Filter to apply when retrieving chunks
  filter?: DocDBFilter;
  
  // AI model to use for analysis
  model?: string;
  
  // Maximum number of tokens to include in the analysis
  maxTokens?: number;
}

/**
 * Result of hierarchical chunk analysis
 */
export interface HierarchicalAnalysisResult<T> {
  // Analysis results for each chunk group
  chunkAnalyses: Array<{
    chunks: DocumentChunk[];
    analysis: T;
  }>;
  
  // Map of document IDs to documents
  documents: Map<string, Document>;
}

/**
 * Main DocDB interface for document storage and retrieval
 */
export interface DocDB {
  /**
   * Add documents to the database
   */
  addDocuments(documents: Document[]): Promise<void>;
  
  /**
   * Get a document by ID
   */
  getDocument(id: string): Promise<Document | null>;
  
  /**
   * Search for similar text
   */
  searchTextSimilarity(options: DocDBSearchOptions): Promise<DocDBSearchResult>;
  
  /**
   * Perform hierarchical analysis on document chunks
   * @param options Options for the hierarchical analysis
   * @returns Analysis results for each chunk group
   */
  analyzeChunksHierarchically<T>(options: HierarchicalAnalysisOptions<T>): Promise<HierarchicalAnalysisResult<T>>;
  
  /**
   * Get all chunks for documents matching the filter
   * @param filter Filter to apply when retrieving chunks
   * @returns All chunks matching the filter
   */
  getAllChunks(filter?: DocDBFilter): Promise<{
    chunks: DocumentChunk[];
    documents: Map<string, Document>;
  }>;

  /**
   * Wait for vectors to be ready for a list of document IDs
   * @param documentIds List of document IDs to wait for
   * @returns Promise that resolves when all vectors are ready
   */
  waitForVectors(documentIds: string[]): Promise<boolean>;
} 