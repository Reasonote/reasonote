import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { pipeline } from '@xenova/transformers';

import { config } from './config.js';
import {
  debug,
  error,
  info,
} from './logger.js';

// Initialize the Notion client
const initNotionClient = (): Client | null => {
  const notionApiKey = process.env.NOTION_API_KEY;
  
  if (!notionApiKey) {
    error('Notion API key not found in environment variables. Set NOTION_API_KEY in your .env file.');
    return null;
  }
  
  try {
    return new Client({ auth: notionApiKey });
  } catch (err) {
    error('Failed to initialize Notion client:', err);
    return null;
  }
};

// Get the Notion client (lazy-loaded)
let _notionClient: Client | null = null;
export const getNotionClient = (): Client | null => {
  if (!_notionClient) {
    _notionClient = initNotionClient();
  }
  return _notionClient;
};

// Type for property values
type PropertyValueMap = {
  [key: string]: {
    type: string;
    [key: string]: any;
  };
};

// Type for select option
interface SelectOption {
  name: string;
}

// Function to safely extract text from rich text objects
const extractTextFromRichText = (richTextArr: Array<{ plain_text: string }>) => {
  return richTextArr.map(t => t.plain_text).join('');
};

// Define document type for our vector database
interface NotionDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

// Semantic search infrastructure
class NotionVectorStore {
  private documents: NotionDocument[] = [];
  private embedder: any = null;
  private modelName: string;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;
  private contentHashMap: Map<string, string> = new Map(); // Maps content hash to document ID

  constructor(modelName: string = 'Xenova/all-MiniLM-L6-v2') {
    this.modelName = modelName;
  }

  // Initialize the embedding model
  async initialize(): Promise<void> {
    if (this.embedder) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    debug(`Initializing Notion semantic search with embedding model: ${this.modelName}`);
    
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        // Load the embedding model
        this.embedder = await pipeline('feature-extraction', this.modelName);
        info(`Embedding model loaded: ${this.modelName}`);
        this.isInitializing = false;
        resolve();
      } catch (err) {
        error(`Failed to initialize embedding model: ${err}`);
        this.isInitializing = false;
        reject(err);
      }
    });

    return this.initPromise;
  }

  // Generate embedding for a text
  async getEmbedding(text: string): Promise<number[]> {
    await this.initialize();
    
    try {
      const result = await this.embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    } catch (err) {
      error(`Error generating embedding: ${err}`);
      throw err;
    }
  }

  // Create a simple hash of the content to identify identical texts
  private getContentHash(text: string): string {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Add a document to the vector database, avoiding duplicates
  async addDocument(id: string, text: string, metadata: Record<string, any> = {}): Promise<string> {
    // Check if we already have this content embedded
    const contentHash = this.getContentHash(text);
    const existingDocId = this.contentHashMap.get(contentHash);
    
    if (existingDocId) {
      debug(`Document with identical content already exists with ID ${existingDocId}, skipping embedding generation`);
      // Update metadata for the existing document if needed
      const existingDoc = this.documents.find(d => d.id === existingDocId);
      if (existingDoc) {
        existingDoc.metadata = { ...existingDoc.metadata, ...metadata };
      }
      return existingDocId;
    }
    
    try {
      const embedding = await this.getEmbedding(text);
      this.documents.push({
        id,
        text,
        metadata,
        embedding
      });
      // Store the content hash to avoid re-vectorizing identical content
      this.contentHashMap.set(contentHash, id);
      debug(`Added Notion document ${id} to vector store`);
      return id;
    } catch (err) {
      error(`Failed to add document ${id} to vector store: ${err}`);
      throw err;
    }
  }

  // Add multiple documents at once
  async addDocuments(documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>): Promise<string[]> {
    const addedIds: string[] = [];
    for (const doc of documents) {
      const id = await this.addDocument(doc.id, doc.text, doc.metadata || {});
      addedIds.push(id);
    }
    info(`Added ${addedIds.length} Notion documents to vector store`);
    return addedIds;
  }

  // Compute cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Search for similar documents
  async search(query: string, limit: number = 5): Promise<Array<{ id: string; text: string; metadata: Record<string, any>; similarity: number }>> {
    if (this.documents.length === 0) {
      debug('No documents in Notion vector store');
      return [];
    }
    
    try {
      debug(`Performing semantic search for: "${query}"`);
      const queryEmbedding = await this.getEmbedding(query);
      
      // Calculate similarity for each document
      const results = this.documents
        .map(doc => ({
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
          similarity: this.cosineSimilarity(queryEmbedding, doc.embedding || [])
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      debug(`Found ${results.length} results for semantic query: "${query}"`);
      return results;
    } catch (err) {
      error(`Semantic search failed: ${err}`);
      throw err;
    }
  }

  // Get count of documents in database
  get count(): number {
    return this.documents.length;
  }

  // Clear the database
  clear(): void {
    this.documents = [];
    this.contentHashMap.clear();
    debug('Notion vector store cleared');
  }
}

// Singleton instance of the vector store
let vectorStore: NotionVectorStore | null = null;

// Map to track when databases were last indexed
const databaseLastIndexed: Map<string, number> = new Map();

// Time threshold for re-indexing (6 hours in milliseconds)
const INDEX_EXPIRATION_MS = 6 * 60 * 60 * 1000;

export const getVectorStore = (): NotionVectorStore => {
  if (!vectorStore) {
    vectorStore = new NotionVectorStore();
  }
  return vectorStore;
};

// Function to check if a database needs to be re-indexed
export const databaseNeedsIndexing = (databaseId: string): boolean => {
  const lastIndexed = databaseLastIndexed.get(databaseId);
  
  // Database has never been indexed
  if (!lastIndexed) {
    return true;
  }
  
  const now = Date.now();
  const timeSinceLastIndex = now - lastIndexed;
  
  // Database was indexed more than the threshold ago
  return timeSinceLastIndex > INDEX_EXPIRATION_MS;
};

// Function to mark a database as indexed
export const markDatabaseAsIndexed = (databaseId: string): void => {
  databaseLastIndexed.set(databaseId, Date.now());
};

// Function to fetch database contents
export const getDatabaseContents = async (databaseId: string) => {
  const notion = getNotionClient();
  if (!notion) {
    return { error: 'Notion client not initialized' };
  }
  
  try {
    debug(`Fetching contents from database: ${databaseId}`);
    
    // Query the database without specifying any sort
    // This will return results in Notion's default order
    const response = await notion.databases.query({
      database_id: databaseId,
      // Remove the sorts parameter to avoid errors with non-existent properties
    });
    
    info(`Retrieved ${response.results.length} items from Notion database`);
    
    // Process and transform the results
    const results = response.results
      .filter((page): page is PageObjectResponse => 'properties' in page) // Filter to only include pages with properties
      .map(page => {
        const properties: Record<string, any> = {};
        
        // Extract properties from the page
        Object.entries(page.properties as PropertyValueMap).forEach(([key, value]) => {
          switch (value.type) {
            case 'title':
              properties[key] = extractTextFromRichText(value.title);
              break;
            case 'rich_text':
              properties[key] = extractTextFromRichText(value.rich_text);
              break;
            case 'number':
              properties[key] = value.number;
              break;
            case 'select':
              properties[key] = value.select?.name || null;
              break;
            case 'multi_select':
              properties[key] = value.multi_select.map((s: SelectOption) => s.name);
              break;
            case 'date':
              properties[key] = value.date?.start || null;
              break;
            case 'checkbox':
              properties[key] = value.checkbox;
              break;
            case 'url':
              properties[key] = value.url;
              break;
            case 'email':
              properties[key] = value.email;
              break;
            case 'phone_number':
              properties[key] = value.phone_number;
              break;
            case 'formula':
              properties[key] = value.formula.type === 'string' ? value.formula.string :
                              value.formula.type === 'number' ? value.formula.number :
                              value.formula.type === 'boolean' ? value.formula.boolean :
                              value.formula.type === 'date' ? value.formula.date?.start : null;
              break;
            case 'created_time':
              properties[key] = value.created_time;
              break;
            case 'last_edited_time':
              properties[key] = value.last_edited_time;
              break;
            default:
              properties[key] = 'Unsupported property type: ' + value.type;
          }
        });
        
        return {
          id: page.id,
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
          properties
        };
      });
    
    return {
      results,
      nextCursor: response.next_cursor,
      hasMore: response.has_more
    };
  } catch (err) {
    error('Failed to fetch database contents:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// Function to search for a specific item in the database
export const searchDatabase = async (databaseId: string, query: string) => {
  const notion = getNotionClient();
  if (!notion) {
    return { error: 'Notion client not initialized' };
  }
  
  try {
    debug(`Searching database ${databaseId} for: ${query}`);
    
    // First, get all database items
    const dbContents = await getDatabaseContents(databaseId);
    
    if ('error' in dbContents) {
      debug(`Error while searching: ${dbContents.error}`);
      return dbContents;
    }
    
    // Perform a simple search across all properties
    const lowerQuery = query.toLowerCase();
    const filteredResults = dbContents.results.filter(item => {
      // Search in all string properties
      for (const [key, value] of Object.entries(item.properties)) {
        if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // Search in arrays (like multi-select)
        if (Array.isArray(value)) {
          for (const arrItem of value) {
            if (typeof arrItem === 'string' && arrItem.toLowerCase().includes(lowerQuery)) {
              return true;
            }
          }
        }
      }
      
      return false;
    });
    
    info(`Found ${filteredResults.length} items matching "${query}"`);
    
    return {
      results: filteredResults,
      query
    };
  } catch (err) {
    error('Failed to search database:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// Utility function to extract all searchable text from a Notion item
const extractSearchableText = (item: any): string => {
  let text = '';
  
  // Add all string properties
  for (const [key, value] of Object.entries(item.properties)) {
    if (typeof value === 'string') {
      text += `${key}: ${value}\n`;
    } else if (Array.isArray(value)) {
      // Handle arrays like multi-select
      const arrayValues = value.filter(v => typeof v === 'string').join(', ');
      if (arrayValues) {
        text += `${key}: ${arrayValues}\n`;
      }
    }
  }
  
  return text.trim();
};

// Function to perform semantic search on Notion database items
export const semanticSearchDatabase = async (databaseId: string, query: string, limit: number = 5): Promise<{ results: SemanticSearchResult[], query: string } | { error: string }> => {
  const notion = getNotionClient();
  if (!notion) {
    return { error: 'Notion client not initialized' };
  }
  
  try {
    debug(`Performing semantic search on database ${databaseId} for: "${query}"`);
    
    // Get the vector store
    const vectorStore = getVectorStore();
    
    // Check if we need to index or re-index the database
    const needsIndexing = databaseNeedsIndexing(databaseId) || vectorStore.count === 0;
    
    if (needsIndexing) {
      debug(`Database ${databaseId} needs indexing before search`);
      const indexResult = await indexDatabaseForSearch(databaseId);
      
      if ('error' in indexResult) {
        const errorMessage = indexResult.error || 'Unknown error indexing database';
        debug(`Error while indexing database: ${errorMessage}`);
        return { error: errorMessage };
      }
      
      info(`Successfully indexed database before search: ${indexResult.count} items`);
    }
    
    // Perform the semantic search
    const searchResults = await vectorStore.search(query, limit);
    
    return {
      results: searchResults.map(result => ({
        id: result.id,
        notionId: result.metadata.notionId,
        url: result.metadata.url,
        properties: result.metadata.properties,
        similarity: result.similarity
      })),
      query
    };
  } catch (err) {
    error('Failed to perform semantic search on database:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// Define the result type for semantic search to help with type checking
export interface SemanticSearchResult {
  id: string;
  notionId: string;
  url: string;
  properties: Record<string, any>;
  similarity: number;
}

// Define the return type for the indexDatabaseForSearch function
export interface IndexingResult {
  message: string;
  count: number;
}

// Function to index all items in a Notion database for semantic search
export const indexDatabaseForSearch = async (databaseId: string): Promise<IndexingResult | { error: string }> => {
  const notion = getNotionClient();
  if (!notion) {
    return { error: 'Notion client not initialized' };
  }
  
  try {
    debug(`Indexing database ${databaseId} for semantic search`);
    
    // Get all database items
    const dbContents = await getDatabaseContents(databaseId);
    
    if ('error' in dbContents) {
      const errorMessage = dbContents.error || 'Unknown error fetching database';
      debug(`Error while fetching database: ${errorMessage}`);
      return { error: errorMessage };
    }
    
    // Get the vector store
    const vectorStore = getVectorStore();
    
    // Index all items
    const documentsToAdd = dbContents.results.map(item => ({
      id: item.id,
      text: extractSearchableText(item),
      metadata: {
        notionId: item.id,
        url: item.url,
        properties: item.properties
      }
    }));
    
    await vectorStore.addDocuments(documentsToAdd);
    info(`Indexed ${documentsToAdd.length} Notion items for semantic search`);
    
    // Mark the database as recently indexed
    markDatabaseAsIndexed(databaseId);
    
    return {
      message: `Successfully indexed ${documentsToAdd.length} Notion items for semantic search`,
      count: documentsToAdd.length
    };
  } catch (err) {
    error('Failed to index database for semantic search:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// Export the specific database ID you're interested in
export const NOTION_DATABASE_ID = config.notion.databaseId; 