import express from 'express';
import {
  existsSync,
  readFileSync,
} from 'fs';
import {
  dirname,
  join,
  resolve,
} from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/stdio.js';

// Import the Notion integration
import {
  getDatabaseContents,
  indexDatabaseForSearch,
  NOTION_DATABASE_ID,
  searchDatabase,
  semanticSearchDatabase,
} from './notion-integration.js';

// Extend SSEServerTransport to include clientId
declare module '@modelcontextprotocol/sdk/server/sse.js' {
  interface SSEServerTransport {
    clientId?: string;
  }
}

// Calculate the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Try to load environment variables from .env files
function loadEnvFile(path: string): void {
  if (existsSync(path)) {
    const envContent = readFileSync(path, 'utf8');
    const envVars = envContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=', 2))
      .filter(parts => parts.length === 2);
    
    for (const [key, value] of envVars) {
      // Only set if not already defined
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
      }
    }
  }
}

// First check for .env in the current working directory
loadEnvFile(join(process.cwd(), '.env'));
// Then check for .env in the project root (as fallback)
if (process.cwd() !== projectRoot) {
  loadEnvFile(join(projectRoot, '.env'));
}
// Also check for .env in the Reasonote root directory if we're launched from Claude Desktop
loadEnvFile('/Users/lukebechtel/localdev/Reasonote/.env');

// Get transport type from args or environment
const args = process.argv.slice(2);
const transportType = args[0] || process.env.TRANSPORT || "stdio";

// Custom logger that respects transport type
// Only log to console when not in stdio mode, to avoid breaking the JSON protocol
const log = {
  info: (message: string) => {
    if (transportType !== "stdio") {
      console.log(`[INFO] ${message}`);
    } else if (process.stderr) {
      // In stdio mode, we can safely log to stderr without breaking the protocol
      process.stderr.write(`[INFO] ${message}\n`);
    }
  },
  error: (message: string, error?: any) => {
    if (transportType !== "stdio") {
      console.error(`[ERROR] ${message}`, error || '');
    } else if (process.stderr) {
      process.stderr.write(`[ERROR] ${message} ${error ? JSON.stringify(error) : ''}\n`);
    }
  },
  debug: (message: string) => {
    if ((transportType !== "stdio" && process.env.LOG_LEVEL === "debug") ||
        (transportType === "stdio" && process.env.LOG_LEVEL === "debug" && process.stderr)) {
      const output = `[DEBUG] ${message}\n`;
      transportType === "stdio" ? process.stderr.write(output) : console.log(output);
    }
  }
};

// Log the environment info
log.info(`Project root directory: ${projectRoot}`);
log.info(`Current working directory: ${process.cwd()}`);
log.info(`Node environment: ${process.env.NODE_ENV || 'not set'}`);

// Log Notion API key status
if (process.env.NOTION_API_KEY) {
  log.info('Notion API key found, Notion integration will be enabled');
} else {
  log.info('Notion API key not found, Notion integration will be limited');
}

// Create an MCP server
const server = new McpServer({
  name: "ReasonoteMcpDemo",
  version: "1.0.0"
});

// Add a simple calculator tool
server.tool(
  "calculate",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number()
  },
  async ({ operation, a, b }) => {
    let result: number = 0; // Initialize with default value
    
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          return {
            content: [{ type: "text", text: "Error: Cannot divide by zero" }],
            isError: true
          };
        }
        result = a / b;
        break;
    }
    
    return {
      content: [{ type: "text", text: String(result) }]
    };
  }
);

// Add the Notion search tool
server.tool(
  "notion-search",
  {
    query: z.string().describe('The search query to find matching items in the database'),
    databaseId: z.string().optional().describe('Optional database ID to search in. If not provided, the default database is used'),
    limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
    semantic: z.boolean().optional().describe('Whether to use semantic search instead of keyword matching (default: false)')
  },
  async (args) => {
    const { query, databaseId = NOTION_DATABASE_ID, limit = 10, semantic = false } = args;
    
    log.debug(`Executing notion-search tool with query: "${query}", semantic: ${semantic}`);
    
    // Use semantic search or keyword search based on the semantic flag
    const result = semantic 
      ? await semanticSearchDatabase(databaseId, query, limit)
      : await searchDatabase(databaseId, query);
    
    if ('error' in result) {
      return {
        content: [{ 
          type: "text", 
          text: `Error searching Notion database: ${result.error}\n\nTrying to use database ID: ${databaseId}` 
        }],
        isError: true
      };
    }
    
    if (result.results.length === 0) {
      const searchType = semantic ? "semantic" : "keyword";
      return {
        content: [{ 
          type: "text", 
          text: `No results found for ${searchType} query "${query}" in database ${databaseId}.` 
        }]
      };
    }
    
    // Limit to a reasonable number of items
    const limitedResults = result.results.slice(0, limit);
    
    // Format the response
    const searchType = semantic ? "semantically similar" : "matching";
    let responseText = `Found ${result.results.length} ${searchType} results for "${query}"`;
    if (limitedResults.length < result.results.length) {
      responseText += ` (showing first ${limitedResults.length})`;
    }
    responseText += ":\n\n";
    
    // Add each result to the response
    limitedResults.forEach((item, index) => {
      responseText += `${index + 1}. `;
      
      // Display similarity score for semantic search
      if (semantic && 'similarity' in item) {
        responseText += `(${(item.similarity * 100).toFixed(2)}% match) `;
      }
      
      // Try to find a title property
      const titleProp = Object.entries(item.properties)
        .find(([key, value]) => key.toLowerCase().includes('title') || key.toLowerCase().includes('name'));
      
      if (titleProp) {
        responseText += `${titleProp[1]}\n`;
      } else {
        responseText += `Item ${item.id}\n`;
      }
      
      // Add a few key properties
      const keyProps = Object.entries(item.properties)
        .filter(([key]) => !key.toLowerCase().includes('title') && !key.toLowerCase().includes('name'))
        .slice(0, 3);
      
      keyProps.forEach(([key, value]) => {
        const displayValue = Array.isArray(value) 
          ? value.join(', ') 
          : typeof value === 'object' && value !== null 
            ? JSON.stringify(value) 
            : String(value);
        responseText += `   - ${key}: ${displayValue}\n`;
      });
      
      responseText += '\n';
    });
    
    return {
      content: [{ type: "text", text: responseText }]
    };
  }
);

// Add a tool to index a Notion database for semantic search
server.tool(
  "notion-index-database",
  {
    databaseId: z.string().optional().describe('Database ID to index. If not provided, the default database is used')
  },
  async (args) => {
    const { databaseId = NOTION_DATABASE_ID } = args;
    
    log.debug(`Executing notion-index-database tool for database: ${databaseId}`);
    
    // Index the database
    const result = await indexDatabaseForSearch(databaseId);
    
    if ('error' in result) {
      return {
        content: [{ 
          type: "text", 
          text: `Error indexing Notion database: ${result.error}\n\nTrying to use database ID: ${databaseId}` 
        }],
        isError: true
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: result.message
      }]
    };
  }
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}! Welcome to the Reasonote MCP server.`
    }]
  })
);

// Add a notes resource
server.resource(
  "notes",
  new ResourceTemplate("notes://{topic}", { list: undefined }),
  async (uri, variables) => {
    const topic = variables.topic;
    const notes: Record<string, string> = {
      "javascript": "JavaScript is a high-level, interpreted programming language used primarily for web development.",
      "typescript": "TypeScript is a strongly typed programming language that builds on JavaScript, adding static type definitions.",
      "mcp": "The Model Context Protocol (MCP) allows applications to provide context for LLMs in a standardized way.",
      "bun": "Bun is a fast all-in-one JavaScript runtime and toolkit designed for speed, complete with a bundler, test runner, and Node.js-compatible package manager.",
      "reasonote": "Reasonote is a developer tool for building LLM applications with context."
    };
    
    // Check if topic exists in notes and is a string
    const topicString = typeof topic === 'string' ? topic : '';
    const noteText = topicString in notes
      ? notes[topicString]
      : `No notes available for topic: ${topicString}`;
    
    return {
      contents: [{
        uri: uri.href,
        text: noteText
      }]
    };
  }
);

// Add the Notion database resource
server.resource(
  "notion-db",
  new ResourceTemplate("notion-db://{databaseId}", { list: undefined }),
  async (uri, variables) => {
    // Extract the database ID, handle it potentially being an array or undefined
    const databaseIdVar = variables.databaseId;
    const databaseId = Array.isArray(databaseIdVar) 
      ? databaseIdVar[0] 
      : (databaseIdVar || NOTION_DATABASE_ID);
    
    log.debug(`Requesting notion database: ${databaseId}`);
    
    // Fetch database contents
    const result = await getDatabaseContents(databaseId);
    
    if ('error' in result) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error accessing Notion database: ${result.error}`
        }]
      };
    }
    
    if (result.results.length === 0) {
      return {
        contents: [{
          uri: uri.href,
          text: `The Notion database with ID ${databaseId} exists but contains no items.`
        }]
      };
    }
    
    // Limit to a reasonable number of items
    const limitedResults = result.results.slice(0, 20);
    
    // Format the results as a text summary
    let text = `# Notion Database: ${databaseId}\n\n`;
    text += `Total items: ${result.results.length}`;
    
    if (limitedResults.length < result.results.length) {
      text += ` (showing first ${limitedResults.length})`;
    }
    text += '\n\n';
    
    // Get property names from the first item to understand the database schema
    const firstItem = limitedResults[0];
    const propertyNames = Object.keys(firstItem.properties);
    
    text += `## Database Structure\n`;
    text += `This database has the following properties: ${propertyNames.join(', ')}\n\n`;
    
    // Add each item to the summary
    limitedResults.forEach((item, index) => {
      text += `## Item ${index + 1}\n\n`;
      
      // Try to find a title property
      const titleProp = Object.entries(item.properties)
        .find(([key]) => key.toLowerCase().includes('title') || key.toLowerCase().includes('name'));
      
      if (titleProp) {
        text += `**${titleProp[0]}**: ${titleProp[1]}\n\n`;
      }
      
      // Add all other properties
      Object.entries(item.properties)
        .filter(([key]) => !key.toLowerCase().includes('title') || !titleProp || key !== titleProp[0])
        .forEach(([key, value]) => {
          const displayValue = Array.isArray(value) 
            ? value.join(', ') 
            : typeof value === 'object' && value !== null 
              ? JSON.stringify(value) 
              : String(value);
          text += `- **${key}**: ${displayValue}\n`;
        });
      
      text += '\n';
    });
    
    return {
      contents: [{
        uri: uri.href,
        text
      }]
    };
  }
);

// Add a simple prompt for note taking
server.prompt(
  "take-notes",
  { topic: z.string(), content: z.string() },
  ({ topic, content }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please organize these notes about ${topic}:\n\n${content}\n\nCreate a well-structured summary with key points.`
      }
    }]
  })
);

// Start based on transport type
log.info(`Starting MCP server with transport type: ${transportType}`);

if (transportType === "http" || transportType === "both") {
  const app = express();
  const port = parseInt(process.env.PORT || "3001");
  log.info(`HTTP server will use port: ${port}`);
  
  let activeTransports: SSEServerTransport[] = [];

  app.use(express.json());
  
  app.get("/sse", async (req, res) => {
    log.info(`New SSE connection established from: ${req.ip}`);
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const clientId = req.query.clientId?.toString() || Date.now().toString();
    log.info(`Client ID assigned: ${clientId}`);
    
    const transport = new SSEServerTransport("/messages", res);
    
    // Store the transport for message routing
    transport.clientId = clientId;
    activeTransports.push(transport);
    log.info(`Active connections: ${activeTransports.length}`);
    
    // Clean up when connection closes
    req.on("close", () => {
      log.info(`Connection closed for client: ${clientId}`);
      activeTransports = activeTransports.filter(t => t !== transport);
      log.info(`Remaining active connections: ${activeTransports.length}`);
    });
    
    await server.connect(transport);
  });
  
  app.post("/messages", async (req, res) => {
    const clientId = req.query.clientId?.toString();
    log.info(`Message received from client: ${clientId}`);
    
    if (!clientId) {
      log.error(`Request rejected: Missing clientId`);
      return res.status(400).json({ error: "Missing clientId" });
    }
    
    const transport = activeTransports.find(t => t.clientId === clientId);
    if (!transport) {
      log.error(`Request rejected: Client connection not found for ID: ${clientId}`);
      return res.status(404).json({ error: "Client connection not found" });
    }
    
    try {
      // Handle messages from client
      log.debug(`Processing message from client: ${clientId}`);
      await transport.handlePostMessage(req, res);
      log.debug(`Message processed successfully for client: ${clientId}`);
    } catch (error) {
      log.error(`Error handling message from client ${clientId}:`, error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });
  
  app.listen(port, () => {
    log.info(`----------------------------------------------------------`);
    log.info(`MCP HTTP server is now running on port ${port}`);
    log.info(`SSE endpoint: http://localhost:${port}/sse`);
    log.info(`Messages endpoint: http://localhost:${port}/messages`);
    log.info(`Use ?clientId=YOUR_CLIENT_ID with both endpoints`);
    log.info(`----------------------------------------------------------`);
  });
}

if (transportType === "stdio" || transportType === "both") {
  // Don't log anything in stdio mode
  if (transportType === "both") {
    log.info(`----------------------------------------------------------`);
    log.info(`Starting MCP server with stdio transport...`);
    log.info(`This mode is typically used when another process directly communicates with this server.`);
    log.info(`----------------------------------------------------------`);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
} 