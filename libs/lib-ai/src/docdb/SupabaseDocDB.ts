import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { AI } from '../AI';
import {
  DocDB,
  DocDBFilter,
  DocDBSearchOptions,
  DocDBSearchResult,
  Document,
  DocumentChunk,
  DocumentChunkSearchResult,
  HierarchicalAnalysisOptions,
  HierarchicalAnalysisResult,
} from './types';

// Get embedding type from environment or use default
const EMBEDDING_TYPE = process.env.EMBEDDING_TYPE || 'openai/text-embedding-3-small';

/**
 * Approximate token count for a string
 * This is a simple approximation - in a real implementation, you would use a more accurate tokenizer
 * @param text The text to count tokens for
 * @returns Approximate token count
 */
function estimateTokenCount(text: string): number {
  // A very rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Options for configuring the SupabaseDocDB
 */
export interface SupabaseDocDBOptions {
  /** AI instance for generating embeddings and analysis */
  ai: AI;
  /** Supabase client instance */
  supabase: any;
  /** Size of each document chunk in characters */
  chunkSize?: number;
  /** Size of overlap between chunks in characters */
  overlapSize?: number;
  /** Maximum number of attempts to check for vectors */
  maxVectorWaitAttempts?: number;
  /** Delay between attempts in milliseconds */
  vectorWaitDelayMs?: number;
}

/**
 * SupabaseDocDB implementation that directly integrates with Supabase
 * for document retrieval and vector search
 */
export class SupabaseDocDB implements DocDB {
  private embeddingColumn: string;
  private ai: AI;
  private chunkSize: number;
  private overlapSize: number;
  private supabase: any;
  private maxVectorWaitAttempts: number;
  private vectorWaitDelayMs: number;

  constructor(options: SupabaseDocDBOptions) {
    this.ai = options.ai;
    this.supabase = options.supabase;
    this.chunkSize = options.chunkSize || 500;
    this.overlapSize = options.overlapSize || 100;
    this.maxVectorWaitAttempts = options.maxVectorWaitAttempts || 10;
    this.vectorWaitDelayMs = options.vectorWaitDelayMs || 1000;

    // Determine which embedding column to use based on the embedding type
    this.embeddingColumn = EMBEDDING_TYPE === 'openai/text-embedding-3-small'
      ? 'embedding_openai_text_embedding_3_small'
      : 'embedding';
  }

  /**
   * Checks if vectors exist for the given document IDs
   * @param documentIds Array of document IDs to check
   * @returns True if vectors exist for all documents, false otherwise
   */
  async checkVectorsExist(documentIds: string[]): Promise<boolean> {
    if (documentIds.length === 0) return true;

    try {
      // Query the rsn_vec table to check if vectors exist for all document IDs
      const { data, error } = await this.supabase
        .from('rsn_vec')
        .select('_ref_id')
        .in('_ref_id', documentIds);

      if (error) {
        console.error('Error checking vectors:', error);
        return false;
      }

      // Get unique document IDs that have vectors
      const uniqueDocIds = new Set(data.map((row: any) => row._ref_id));

      // Check if all document IDs have vectors
      return documentIds.every(id => uniqueDocIds.has(id));
    } catch (error) {
      console.error('Error in checkVectorsExist:', error);
      return false;
    }
  }

  /**
 * Waits for vectors to be generated for all document IDs
 * @param supabase Supabase client
   * @param documentIds Array of document IDs to wait for
   * @returns True if vectors were generated within the timeout, false otherwise
   */
  async waitForVectors(documentIds: string[]): Promise<boolean> {
    if (documentIds.length === 0) return true;

    for (let attempt = 0; attempt < this.maxVectorWaitAttempts; attempt++) {
      const vectorsExist = await this.checkVectorsExist(documentIds);

      if (vectorsExist) {
        return true;
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, this.vectorWaitDelayMs));
    }

    return false;
  }

  /**
   * Add documents to the database
   * This method processes documents and adds them to Supabase
   */
  async addDocuments(documents: Document[]): Promise<void> {
    for (const document of documents) {
      // Create chunks from the document
      const chunks = this.chunkDocument(document);

      // Generate embeddings and store chunks in Supabase
      for (const chunk of chunks) {
        try {
          // Generate embedding for the chunk using OpenAI
          chunk.vector = await this.generateEmbedding(chunk.content);

          // Here you would typically insert the chunk into Supabase
          // This is a placeholder for actual Supabase insertion logic
          console.log(`Generated embedding for chunk from document ${document.id}`);

          // In a real implementation, you would insert the chunk into Supabase
          // For example:
          // await this.supabase.from('document_chunks').insert({
          //   id: chunk.id,
          //   document_id: chunk.documentId,
          //   content: chunk.content,
          //   start_position: chunk.startPosition,
          //   end_position: chunk.endPosition,
          //   metadata: chunk.metadata,
          //   embedding: chunk.vector
          // });
        } catch (error: unknown) {
          console.error('Error generating embedding for chunk:', error);
        }
      }
    }
  }

  /**
   * Get a document by ID
   * Always fetches from the database
   */
  async getDocument(id: string): Promise<Document | null> {
    try {
      // Determine document type based on prefix
      let documentType: 'page' | 'snippet' | null = null;

      if (id.startsWith('rsnpage_')) {
        documentType = 'page';
      } else if (id.startsWith('snip_')) {
        documentType = 'snippet';
      }

      // Based on the ID prefix or lack thereof, query the appropriate table
      if (documentType === 'page' || id.startsWith('rsnpage_')) {
        const { data: pageData } = await this.supabase
          .from('rsn_page')
          .select('id, _name, original_filename, body')
          .eq('id', id)
          .single();

        if (pageData) {
          return {
            id: pageData.id,
            fileName: pageData._name || pageData.original_filename || 'Page',
            content: pageData.body || '',
            metadata: {
              type: 'page',
              source: 'database'
            }
          };
        }
      } else if (documentType === 'snippet' || id.startsWith('snip_')) {
        const { data: snippetData } = await this.supabase
          .from('snip')
          .select('id, _name, source_url, text_content')
          .eq('id', id)
          .single();

        if (snippetData) {
          return {
            id: snippetData.id,
            fileName: snippetData._name || 'Snippet',
            content: snippetData.text_content || '',
            metadata: {
              type: 'snippet',
              source: 'database',
              sourceUrl: snippetData.source_url
            }
          };
        }
      } else {
        // If no clear prefix, try both tables
        // Try to fetch from rsn_page first
        const { data: pageData } = await this.supabase
          .from('rsn_page')
          .select('id, _name, original_filename, body')
          .eq('id', id)
          .single();

        if (pageData) {
          return {
            id: pageData.id,
            fileName: pageData._name || pageData.original_filename || 'Page',
            content: pageData.body || '',
            metadata: {
              type: 'page',
              source: 'database'
            }
          };
        }

        // If not found, try to fetch from snip
        const { data: snippetData } = await this.supabase
          .from('snip')
          .select('id, _name, source_url, text_content')
          .eq('id', id)
          .single();

        if (snippetData) {
          return {
            id: snippetData.id,
            fileName: snippetData._name || 'Snippet',
            content: snippetData.text_content || '',
            metadata: {
              type: 'snippet',
              source: 'database',
              sourceUrl: snippetData.source_url
            }
          };
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching document from database:', error);
    }

    return null;
  }

  /**
   * Search for similar text using Supabase vector search
   */
  async searchTextSimilarity(options: DocDBSearchOptions): Promise<DocDBSearchResult> {
    const { query, threshold = 0.75, maxResults = 10, filter } = options;

    try {
      // Generate embedding for the query
      const queryVector = await this.generateEmbedding(query);

      // Prepare filter parameters
      const filterTablename = filter?.metadata?.type || undefined;

      // If we have specific document IDs to filter by, use them in the query
      const filterDocIds = filter?.documentIds || [];

      // Call the match_rsn_vec function in Supabase
      const { data: matchResults, error } = await this.supabase.rpc('match_rsn_vec', {
        match_embedding: queryVector,
        match_threshold: threshold,
        match_count: maxResults,
        filter_tablename: filterTablename,
        filter_ref_ids: filterDocIds.length > 0 ? filterDocIds : null, // Pass document IDs if available
        embedding_column: this.embeddingColumn,
        min_content_length: 10
      });

      if (error) {
        console.error('Error searching for similar text:', error);
        return { chunks: [], documents: new Map(), expandWindow: () => [] };
      }

      // Convert match results to document chunks
      const resultChunks: DocumentChunk[] = [];
      const documentsMap = new Map<string, Document>();

      // If we have match results, process them
      if (matchResults && matchResults.length > 0) {
        for (const match of matchResults) {
          // Create a document ID based on the table and record ID
          const documentId = match.id;

          // Fetch the full document
          if (!documentsMap.has(documentId)) {
            const document = await this.getDocument(documentId);
            if (document) {
              documentsMap.set(documentId, document);
            }
          }

          // Create a chunk from the match with similarity score
          const chunk: DocumentChunkSearchResult = {
            id: uuidv4(),
            documentId,
            content: match.content,
            startPosition: 0, // We don't have position info from the vector search
            endPosition: match.content.length,
            similarity: match.similarity,
            metadata: {
              type: match.tablename,
              source: 'database'
            }
          };

          resultChunks.push(chunk);
        }
      }

      return {
        chunks: resultChunks,
        documents: documentsMap,
        expandWindow: (chunkId: string, windowSize: number) => this.fetchExpandedChunkWindow(chunkId, windowSize, documentsMap)
      };
    } catch (error: unknown) {
      console.error('Error in searchTextSimilarity:', error);
      return { chunks: [], documents: new Map(), expandWindow: () => [] };
    }
  }

  /**
   * Get all chunks for documents matching the filter
   * Always fetches from the database
   */
  async getAllChunks(filter?: DocDBFilter): Promise<{
    chunks: DocumentChunk[];
    documents: Map<string, Document>;
  }> {
    try {
      const documentsMap = new Map<string, Document>();
      const allChunks: DocumentChunk[] = [];

      // Process document IDs to handle types - don't strip prefixes
      const pageIds: string[] = [];
      const snippetIds: string[] = [];

      if (filter?.documentIds && filter.documentIds.length > 0) {
        // Sort document IDs by type based on prefix
        for (const docId of filter.documentIds) {
          if (docId.startsWith('rsnpage_')) {
            pageIds.push(docId);
          } else if (docId.startsWith('snip_')) {
            snippetIds.push(docId);
          } else {
            // If no prefix, try both tables
            pageIds.push(docId);
            snippetIds.push(docId);
          }
        }

        // Wait for vectors to be generated for all document IDs
        const vectorsExist = await this.waitForVectors(filter.documentIds);
        if (!vectorsExist) {
          console.warn('Vectors not generated for some documents after maximum attempts');
          return { chunks: [], documents: documentsMap };
        }
      }

      // Fetch pages based on filter
      const shouldFetchPages = pageIds.length > 0;

      if (shouldFetchPages) {
        let pagesQuery = this.supabase.from('rsn_page').select('id, _name, original_filename, body');

        // Apply filter if provided
        if (pageIds.length > 0) {
          pagesQuery = pagesQuery.in('id', pageIds);
        }

        const { data: pages } = await pagesQuery.limit(50);

        if (pages && pages.length > 0) {
          for (const page of pages) {
            const document: Document = {
              id: page.id,
              fileName: page._name || page.original_filename || 'Page',
              content: page.body || '',
              metadata: {
                type: 'page',
                source: 'database'
              }
            };

            documentsMap.set(document.id, document);

            // Fetch chunks for this page from rsn_vec
            const { data: chunks } = await this.supabase
              .from('rsn_vec')
              .select('id, raw_content, content_offset')
              .eq('_ref_id', page.id)
              .order('content_offset', { ascending: true });

            if (chunks) {
              allChunks.push(...chunks.map((chunk: { id: string; raw_content: string | null; content_offset: number }) => ({
                id: chunk.id,
                documentId: page.id,
                content: chunk.raw_content || '',
                startPosition: chunk.content_offset,
                endPosition: chunk.content_offset + (chunk.raw_content?.length || 0),
                metadata: {
                  type: 'page',
                  source: 'database'
                }
              })));
            }
          }
        }
      }

      // Are there any snip ids?
      const shouldFetchSnippets = snippetIds.length > 0;

      if (shouldFetchSnippets) {
        let snippetsQuery = this.supabase.from('snip').select('id, _name, source_url, text_content');

        if (snippetIds.length > 0) {
          snippetsQuery = snippetsQuery.in('id', snippetIds);
        }

        const { data: snippets } = await snippetsQuery.limit(50);

        if (snippets && snippets.length > 0) {
          for (const snippet of snippets) {
            const document: Document = {
              id: snippet.id,
              fileName: snippet._name || 'Snippet',
              content: snippet.text_content || '',
              metadata: {
                type: 'snippet',
                source: 'database',
                sourceUrl: snippet.source_url
              }
            };

            documentsMap.set(document.id, document);

            // Fetch chunks for this snippet from rsn_vec
            const { data: chunks } = await this.supabase
              .from('rsn_vec')
              .select('id, raw_content, content_offset')
              .eq('_ref_id', snippet.id)
              .order('content_offset', { ascending: true });

            if (chunks) {
              allChunks.push(...chunks.map((chunk: { id: string; raw_content: string | null; content_offset: number}) => ({
                id: chunk.id,
                documentId: snippet.id,
                content: chunk.raw_content || '',
                startPosition: chunk.content_offset,
                endPosition: chunk.content_offset + (chunk.raw_content?.length || 0),
                metadata: {
                  type: 'snippet',
                  source: 'database',
                  sourceUrl: snippet.source_url
                }
              })));
            }
          }
        }
      }

      // Sort chunks by document ID and position
      allChunks.sort((a, b) => {
        if (a.documentId !== b.documentId) {
          return a.documentId.localeCompare(b.documentId);
        }
        return a.startPosition - b.startPosition;
      });

      return {
        chunks: allChunks,
        documents: documentsMap
      };
    } catch (error: unknown) {
      console.error('Error in getAllChunks:', error);
      return { chunks: [], documents: new Map() };
    }
  }

  /**
   * Perform hierarchical analysis on document chunks
   * @param options Options for the hierarchical analysis
   * @returns Analysis results for each chunk group
   */
  async analyzeChunksHierarchically<T>(options: HierarchicalAnalysisOptions<T>): Promise<HierarchicalAnalysisResult<T>> {
    const {
      question,
      schema,
      chunkGroupSize = 5,
      filter,
      model = "openai:gpt-4o-mini",
      maxTokens = 8000
    } = options;

    // Get all chunks matching the filter
    const { chunks, documents } = await this.getAllChunks(filter);

    console.log('chunks.length', chunks.length);
    console.log('filter', filter);
    console.log('documents.size', documents.size);

    // Group chunks into manageable sizes
    const chunkGroups = this.groupChunks(chunks, chunkGroupSize, maxTokens);

    // Analyze each chunk group
    const chunkAnalyses = await Promise.all(
      chunkGroups.map(async (group) => {
        // Format the chunks for the prompt
        const chunksText = group.map((chunk, index) => {
          const document = documents.get(chunk.documentId);
          return `
          <CHUNK-${index} fileName="${document?.fileName}">
          ${chunk.content}
          </CHUNK-${index}>
          `;
        }).join('\n');

        // Create the prompt for analysis
        const prompt = `
        <TASK>
        Analyze the following document chunks and ${question}
        
        <CHUNKS>
        ${chunksText}
        </CHUNKS>
        </TASK>
        
        <INSTRUCTIONS>
        - Focus on extracting the most important concepts and information
        - Be concise but comprehensive
        - Ensure your response follows the required JSON structure
        - Include only information that is present in the chunks
        </INSTRUCTIONS>
        `;

        // Generate analysis using AI
        const analysis = await this.ai.genObject({
          schema,
          prompt,
          model,
          mode: 'json',
          providerArgs: {
            structuredOutputs: true,
          },
        });

        return {
          chunks: group,
          analysis: analysis.object as T
        };
      })
    );

    return {
      chunkAnalyses,
      documents
    };
  }

  /**
   * Group chunks into manageable sizes for analysis
   */
  private groupChunks(
    chunks: DocumentChunk[],
    chunkGroupSize: number,
    maxTokens: number
  ): DocumentChunk[][] {
    const groups: DocumentChunk[][] = [];
    let currentGroup: DocumentChunk[] = [];
    let currentTokenCount = 0;

    // Group by document first
    const chunksByDocument = new Map<string, DocumentChunk[]>();

    for (const chunk of chunks) {
      if (!chunksByDocument.has(chunk.documentId)) {
        chunksByDocument.set(chunk.documentId, []);
      }
      chunksByDocument.get(chunk.documentId)!.push(chunk);
    }

    // Sort chunks within each document by position
    const documentIds = Array.from(chunksByDocument.keys());
    for (const docId of documentIds) {
      const docChunks = chunksByDocument.get(docId);
      if (docChunks) {
        docChunks.sort((a, b) => a.startPosition - b.startPosition);
      }
    }

    // Create groups, trying to keep chunks from the same document together
    for (const docId of documentIds) {
      const docChunks = chunksByDocument.get(docId);
      if (!docChunks) continue;

      for (const chunk of docChunks) {
        const chunkTokens = estimateTokenCount(chunk.content);

        // If adding this chunk would exceed the token limit or group size, start a new group
        if (currentGroup.length >= chunkGroupSize ||
          (currentTokenCount + chunkTokens > maxTokens && currentGroup.length > 0)) {
          groups.push([...currentGroup]);
          currentGroup = [];
          currentTokenCount = 0;
        }

        currentGroup.push(chunk);
        currentTokenCount += chunkTokens;
      }

      // If we have chunks in the current group after processing a document, add them as a group
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
        currentTokenCount = 0;
      }
    }

    // Add any remaining chunks
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Split a document into chunks
   */
  private chunkDocument(document: Document): DocumentChunk[] {
    const content = document.content;
    const chunks: DocumentChunk[] = [];

    for (let i = 0; i < content.length; i += this.chunkSize - this.overlapSize) {
      const start = i;
      const end = Math.min(i + this.chunkSize, content.length);
      const chunkContent = content.substring(start, end);

      chunks.push({
        id: uuidv4(),
        documentId: document.id,
        content: chunkContent,
        startPosition: start,
        endPosition: end,
        metadata: document.metadata
      });

      if (end === content.length) break;
    }

    return chunks;
  }

  /**
   * Fetch expanded chunk window from the database
   * This is a replacement for the cached expandChunkWindow method
   */
  private fetchExpandedChunkWindow(
    chunkId: string,
    windowSize: number,
    documentsMap: Map<string, Document>
  ): DocumentChunk[] {
    // Since we don't have the chunk in memory, we need to find it in the results
    // This is a simplified implementation that would need to be enhanced in a real system

    // In a real implementation, you would query the database for chunks around the given chunk
    // For now, we'll return an empty array as we don't have the context
    console.log(`Requested expanded window for chunk ${chunkId} with size ${windowSize}`);
    return [];
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use the appropriate embedding model based on the embedding type
      if (EMBEDDING_TYPE === 'openai/text-embedding-3-small') {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          encoding_format: "float",
        });

        return response.data[0].embedding;
      } else {
        // For other embedding types, use a simple fallback
        // In a real implementation, you would call the appropriate embedding service
        return this.generateSimpleEmbedding(text);
      }
    } catch (error: unknown) {
      console.error('Error generating embedding:', error);
      // Return a simple fallback embedding
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Generate a simple embedding as fallback
   */
  private generateSimpleEmbedding(text: string): number[] {
    // This is a simplified embedding for demonstration
    // It creates a vector based on character frequencies
    const vector: number[] = new Array(26).fill(0);

    // Count character frequencies (a-z)
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toLowerCase();
      const code = char.charCodeAt(0) - 97; // 'a' is 97
      if (code >= 0 && code < 26) {
        vector[code]++;
      }
    }

    // Normalize the vector
    const sum = vector.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= sum;
      }
    }

    return vector;
  }
} 