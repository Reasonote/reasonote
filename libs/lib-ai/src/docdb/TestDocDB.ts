import { cosineSimilarity } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { AI } from '../AI';
import {
  DocDB,
  DocDBFilter,
  DocDBSearchOptions,
  DocDBSearchResult,
  Document,
  DocumentChunk,
  HierarchicalAnalysisOptions,
  HierarchicalAnalysisResult,
} from './types';

/**
 * Simple chunking function to split document content into chunks
 */
function chunkDocument(document: Document, chunkSize: number = 500, overlapSize: number = 100): DocumentChunk[] {
  const content = document.content;
  const chunks: DocumentChunk[] = [];

  for (let i = 0; i < content.length; i += chunkSize - overlapSize) {
    const start = i;
    const end = Math.min(i + chunkSize, content.length);
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
 * In-memory implementation of DocDB for testing purposes
 */
export class TestDocDB implements DocDB {
  private documents: Map<string, Document> = new Map();
  private chunks: DocumentChunk[] = [];

  constructor(private ai: AI, private chunkSize: number = 500, private overlapSize: number = 100) { }

  /**
   * Wait for vectors to be ready for a list of document IDs
   * @param documentIds List of document IDs to wait for
   * @returns Promise that resolves when all vectors are ready
   */
  async waitForVectors(documentIds: string[]): Promise<boolean> {
    return true;
  }

  /**
   * Add documents to the in-memory database
   */
  async addDocuments(documents: Document[]): Promise<void> {
    for (const document of documents) {
      // Store the document
      this.documents.set(document.id, document);

      // Create chunks from the document
      const newChunks = chunkDocument(document, this.chunkSize, this.overlapSize);
      this.chunks.push(...newChunks);
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  /**
   * Search for similar text using cosine similarity
   */
  async searchTextSimilarity(options: DocDBSearchOptions): Promise<DocDBSearchResult> {
    // For testing purposes, we'll use a simplified approach
    // In a real implementation, we would use AI's embedding capabilities

    // Create a simple vector for the query (for testing only)
    const queryVector = await this.getSimpleEmbedding(options.query);

    // Apply filters if provided
    let filteredChunks = this.chunks;
    if (options.filter) {
      filteredChunks = this.applyFilter(filteredChunks, options.filter);
    }

    // Calculate similarity scores for all filtered chunks
    const scoredChunks = await Promise.all(
      filteredChunks.map(async chunk => {
        // Get or calculate vector for chunk
        const chunkVector = chunk.vector || await this.getSimpleEmbedding(chunk.content);
        if (!chunk.vector) chunk.vector = chunkVector;

        // Calculate similarity
        const similarity = cosineSimilarity(queryVector, chunkVector);
        return { chunk, similarity };
      })
    );

    // Filter by threshold and sort by similarity
    const resultChunks = scoredChunks
      .filter(({ similarity }) => similarity >= (options.threshold || 0.75))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.maxResults || 10)
      .map(({ chunk }) => chunk);

    // Create result with documents map
    const documentsMap = this.createDocumentsMap(resultChunks);

    return {
      chunks: resultChunks,
      documents: documentsMap,
      expandWindow: (chunkId: string, windowSize: number) => this.expandChunkWindow(chunkId, windowSize)
    };
  }

  /**
   * Get all chunks for documents matching the filter
   */
  async getAllChunks(filter?: DocDBFilter): Promise<{
    chunks: DocumentChunk[];
    documents: Map<string, Document>;
  }> {
    let filteredChunks = this.chunks;

    if (filter) {
      filteredChunks = this.applyFilter(filteredChunks, filter);
    }

    // Sort chunks by document ID and position
    filteredChunks.sort((a, b) => {
      if (a.documentId !== b.documentId) {
        return a.documentId.localeCompare(b.documentId);
      }
      return a.startPosition - b.startPosition;
    });

    return {
      chunks: filteredChunks,
      documents: this.createDocumentsMap(filteredChunks)
    };
  }

  /**
   * Perform hierarchical analysis on document chunks
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

    // Group chunks by document
    const chunksByDocument = new Map<string, DocumentChunk[]>();
    for (const chunk of chunks) {
      if (!chunksByDocument.has(chunk.documentId)) {
        chunksByDocument.set(chunk.documentId, []);
      }
      chunksByDocument.get(chunk.documentId)!.push(chunk);
    }

    // Now, within each document, group chunks into manageable sizes
    const chunkGroupMap = new Map<string, DocumentChunk[][]>();
    for (const [documentId, documentChunks] of chunksByDocument.entries()) {
      chunkGroupMap.set(documentId, this.groupChunks(documentChunks, chunkGroupSize, maxTokens));
    }

    // Flatten by one level to get a single array of chunk groups
    const chunkGroups = Array.from(chunkGroupMap.values()).flat();
    
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
        You should analyze
        Analyze the following document chunks and ${question}
        

        </TASK>
        
        <INSTRUCTIONS>
        - Focus on extracting the most important concepts and information
        - Be concise but comprehensive
        - Ensure your response follows the required JSON structure
        - Include only information that is present in the chunks
        </INSTRUCTIONS>

        <CONTEXT>
            <CHUNKS>
            ${chunksText}
            </CHUNKS>
        </CONTEXT>
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
   * Apply filter to chunks
   */
  private applyFilter(chunks: DocumentChunk[], filter: DocDBFilter): DocumentChunk[] {
    let filteredChunks = chunks;

    // Filter by document IDs if provided
    if (filter.documentIds && filter.documentIds.length > 0) {
      filteredChunks = filteredChunks.filter(chunk =>
        filter.documentIds!.includes(chunk.documentId)
      );
    }

    // Filter by metadata if provided
    if (filter.metadata) {
      filteredChunks = filteredChunks.filter(chunk => {
        if (!chunk.metadata) return false;

        // Check if all metadata keys match
        return Object.entries(filter.metadata || {}).every(([key, value]) =>
          chunk.metadata?.[key] === value
        );
      });
    }

    // Filter by tags if provided
    if (filter.tags && filter.tags.length > 0) {
      filteredChunks = filteredChunks.filter(chunk => {
        const tags = chunk.metadata?.tags as string[] | undefined;
        if (!tags) return false;

        // Check if any tag matches
        return filter.tags?.some(tag => tags.includes(tag));
      });
    }

    return filteredChunks;
  }

  /**
   * Create a map of document IDs to documents
   */
  private createDocumentsMap(chunks: DocumentChunk[]): Map<string, Document> {
    const documentsMap = new Map<string, Document>();

    chunks.forEach(chunk => {
      if (!documentsMap.has(chunk.documentId)) {
        const document = this.documents.get(chunk.documentId);
        if (document) {
          documentsMap.set(chunk.documentId, document);
        }
      }
    });

    return documentsMap;
  }

  /**
   * Create a simple embedding for testing purposes
   * In a real implementation, we would use AI's embedding capabilities
   */
  private async getSimpleEmbedding(text: string): Promise<number[]> {
    // This is a very simplified embedding for testing
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

  /**
   * Expand the window around a chunk to get more context
   */
  private expandChunkWindow(chunkId: string, windowSize: number): DocumentChunk[] {
    const chunkIndex = this.chunks.findIndex(chunk => chunk.id === chunkId);
    if (chunkIndex === -1) return [];

    const chunk = this.chunks[chunkIndex];
    const documentChunks = this.chunks.filter(c => c.documentId === chunk.documentId);

    // Sort chunks by position
    documentChunks.sort((a, b) => a.startPosition - b.startPosition);

    // Find the index of our chunk in the sorted document chunks
    const sortedChunkIndex = documentChunks.findIndex(c => c.id === chunkId);
    if (sortedChunkIndex === -1) return [];

    // Calculate window boundaries
    const startIndex = Math.max(0, sortedChunkIndex - windowSize);
    const endIndex = Math.min(documentChunks.length - 1, sortedChunkIndex + windowSize);

    // Return the window of chunks
    return documentChunks.slice(startIndex, endIndex + 1);
  }

  /**
   * Directly add chunks for the test doc db
   */
  addChunks(chunks: DocumentChunk[]): void {
    this.chunks.push(...chunks);
  }
} 