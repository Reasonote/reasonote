/**
 * Configuration for the MCP server
 */

import {
  dirname,
  join,
} from 'path';
import { fileURLToPath } from 'url';

// Determine the root directory and other paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');
const reasonoteDir = join(projectDir, '..', '..');

// Configuration object
export const config = {
  // Server configuration
  server: {
    // Default port for HTTP/SSE transport
    port: parseInt(process.env.PORT || '3001', 10),
    
    // Transport type: 'stdio', 'http', or 'both'
    transportType: (process.env.TRANSPORT || 'stdio').toLowerCase(),
  },
  
  // Path configuration
  paths: {
    // Root directory of the MCP server
    projectDir,
    
    // Root directory of the entire Reasonote app
    reasonoteDir,
  },
  
  // Notion configuration
  notion: {
    // Default database ID (can be overridden in .env file)
    databaseId: process.env.NOTION_DATABASE_ID || '78a8a2224dc7472891d9ca6dbc6018fa',
  },
}; 