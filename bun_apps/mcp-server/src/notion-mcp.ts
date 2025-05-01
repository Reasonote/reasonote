/**
 * MCP Tools and Resources for Notion Integration
 * 
 * This file defines MCP resources and tools for interacting with Notion:
 * - notion-db:// resource URL for accessing database content
 * - notion-search tool for searching the database
 */

import { z } from 'zod';

import { debug } from './logger.js';
import {
  getDatabaseContents,
  NOTION_DATABASE_ID,
  searchDatabase,
} from './notion-integration.js';

/**
 * Notion Database Resource
 * 
 * Resource URL format: notion-db://{databaseId}
 * If no database ID is provided, the default database ID is used
 */
export const notionDatabaseResource = {
  uriScheme: 'notion-db',
  async get(resourceId: string) {
    debug(`Getting Notion database resource: ${resourceId}`);
    
    // Use the provided database ID or fall back to default
    const databaseId = resourceId || NOTION_DATABASE_ID;
    
    // Fetch database contents
    const result = await getDatabaseContents(databaseId);
    
    if ('error' in result) {
      return {
        content: JSON.stringify({ error: result.error }),
        mimeType: 'application/json',
      };
    }
    
    // Limit to a reasonable number of items for context
    const limitedResults = result.results.slice(0, 20);
    
    // Format the data
    const formattedData = {
      databaseId,
      itemCount: result.results.length,
      displayedItems: limitedResults.length,
      items: limitedResults,
      hasMore: result.hasMore || result.results.length > limitedResults.length,
    };
    
    return {
      content: JSON.stringify(formattedData, null, 2),
      mimeType: 'application/json',
    };
  },
};

/**
 * Notion Search Tool
 * 
 * Allows searching within a Notion database
 */
export const notionSearchTool = {
  name: 'notion-search',
  description: 'Search for items in a Notion database',
  inputSchema: z.object({
    query: z.string().describe('The search query to find matching items in the database'),
    databaseId: z.string().optional().describe('Optional database ID to search in. If not provided, the default database is used'),
  }),
  async execute(input: any) {
    const { query, databaseId = NOTION_DATABASE_ID } = input;
    
    debug(`Executing notion-search tool with query: ${query}`);
    
    // Search the database
    const result = await searchDatabase(databaseId, query);
    
    if ('error' in result) {
      return {
        error: result.error,
      };
    }
    
    // Limit to a reasonable number of items
    const limitedResults = result.results.slice(0, 10);
    
    return {
      results: limitedResults,
      query: query, // Use the input query instead of result.query
      totalResults: result.results.length,
      displayedResults: limitedResults.length,
    };
  },
}; 