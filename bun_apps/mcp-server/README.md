# MCP Server Demo

A simple demonstration of the Model Context Protocol (MCP) server implementation using TypeScript and Bun.

## What is MCP?

The Model Context Protocol (MCP) allows applications to provide context for LLMs in a standardized way, separating the concerns of providing context from the actual LLM interaction. This project implements a simple MCP server with:

- Calculator tool
- Greeting resource
- Notes resource
- Note-taking prompt template
- **Notion database integration with semantic search**

## Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env to add your Notion API key
```

## Setting Up Notion Integration

To use the Notion database integration:

1. Go to [Notion Integrations](https://www.notion.so/my-integrations) and create a new integration
2. Give it a name like "MCP Server Integration"
3. Copy the "Internal Integration Token" 
4. Add this token to your `.env` file as `NOTION_API_KEY=your_token_here`
5. Share your Notion database with the integration (click "Share" in the top-right of your database and add the integration)

## Running the Server

### Using stdio transport (default)

```bash
# Run the server with stdio transport
bun start
```

### Using HTTP/SSE transport

```bash
# Run the server with HTTP/SSE transport
TRANSPORT=http bun start
```

### Using both transports

```bash
# Run the server with both stdio and HTTP/SSE transports
TRANSPORT=both bun start
```

## Using with Claude Desktop

This server is designed to work well with Claude Desktop. To set up:

### Automatic Configuration (Recommended)

This project includes a configuration generator that will automatically find your Bun installation and create the proper configuration for Claude Desktop:

```bash
# Run the configuration generator
bun generate-config
```

The generator will:
1. Find your Bun executable
2. Generate the correct configuration with absolute paths
3. Offer to write it directly to your Claude Desktop configuration file
4. Provide instructions for completing the setup

### Manual Configuration

If you prefer to set up manually, follow these steps:

#### 1. Find your Bun installation path

First, find the exact path to your Bun executable:

```bash
# Option 1: Using 'which' command
which bun
# This will output something like: /Users/username/.bun/bin/bun

# Option 2: Using 'whereis' command
whereis bun
# This will show all instances of bun in standard locations
```

#### 2. Configure Claude Desktop

1. Open Claude app
2. Go to Developer > Advanced
3. Edit the MCP Servers configuration (usually at `~/Library/Application Support/Claude/claude_desktop_config.json`)
4. Add the following configuration, replacing the example paths with your actual paths:

```json
{
  "mcpServers": {
    "reasonote-mcp-server": {
      "command": "/Users/username/.bun/bin/bun",
      "args": [
        "/path/to/Reasonote/bun_apps/mcp-server/launch.js",
        "--debug"
      ]
    }
  }
}
```

### 3. Alternative Installation Methods

If you frequently encounter PATH issues with Claude Desktop, consider one of these approaches:
```bash
brew install bun
```

**Create a symlink in a standard location:**
```bash
sudo ln -s /Users/username/.bun/bin/bun /usr/local/bin/bun
```

After using one of these methods, you can simplify your configuration to:
```json
{
  "mcpServers": {
    "reasonote-mcp-server": {
      "command": "bun",
      "args": [
        "/path/to/Reasonote/bun_apps/mcp-server/launch.js",
        "--debug"
      ]
    }
  }
}
```

## Launcher Features

The launcher script (`launch.js`) provides several helpful features:

- **Automatic Dependency Installation**: The launcher automatically installs dependencies before starting the server, ensuring all required packages are available.
- **Working Directory Management**: Sets the correct working directory regardless of where the script is executed from.
- **Environment Variable Loading**: Reads environment variables from `.env` files.
- **Command-line Configuration**: Supports configuration via command-line options without modifying code.

### Launcher Options

```
bun launch.js [options]

Options:
  --transport=stdio|http|both   Set the transport type (default: stdio)
  --port=3001                   Set the HTTP port (default: 3001)
  --debug                       Enable debug logging
  --skip-install                Skip dependency installation
```

## Environment Variables

The server supports loading environment variables from multiple `.env` files in the following order:
1. Current working directory
2. Project root directory
3. Reasonote root directory

Common environment variables:
- `TRANSPORT`: Set to `stdio`, `http`, or `both` (default: `stdio`)
- `PORT`: HTTP port number (default: `3001`)
- `LOG_LEVEL`: Set to `debug` for more detailed logs
- `NOTION_API_KEY`: Your Notion API integration token
- `NOTION_DATABASE_ID`: The ID of your Notion database (default: the example database)

## Features

### Resources

- `greeting://{name}` - Returns a personalized greeting
- `notes://{topic}` - Returns notes about a specific topic
- `notion-db://{databaseId}` - Retrieves content from a Notion database

### Tools

- `calculate` - Performs basic calculations (add, subtract, multiply, divide)
- `notion-search` - Searches for items in a Notion database with keyword matching or semantic search
- `notion-index-database` - Indexes a Notion database for semantic search

### Prompts

- `take-notes` - A prompt template for organizing notes on a topic

## Using the Notion Integration

### From Claude

Once the MCP server is set up with Claude Desktop, you can use the Notion integration in your conversations:

**Accessing the database:**
```
Can you summarize the content of this Notion database: notion-db://
```

**Keyword searching the database:**
```
Use the notion-search tool to find items containing "example" in the database.
```

**Semantic searching the database:**
```
Use the notion-search tool with semantic=true to find items related to "project management strategies" in the database.
```

**Indexing the database for semantic search:**
```
Please index my Notion database for semantic search using the notion-index-database tool.
```

### Notion Search Options

The `notion-search` tool supports the following parameters:

- `query` (required): The search term to look for
- `databaseId` (optional): Specific Notion database ID to search, uses default if not specified
- `limit` (optional): Maximum number of results to return, defaults to 10
- `semantic` (optional): Set to `true` to use semantic search instead of keyword matching, defaults to `false`

### Semantic Search Features

The Notion integration includes advanced semantic search capabilities:

- **Meaning-based search**: Find relevant items even if they don't contain the exact keywords
- **Similarity ranking**: Results are sorted by semantic similarity to your query
- **Automatic indexing**: Databases are automatically indexed when needed, with periodic re-indexing
- **Efficient caching**: Identical content is only embedded once, saving resources
- **Rich context**: All properties from database items are included in the search

#### How Semantic Search Works

1. The system checks if the database needs indexing (if it's never been indexed or if it's been 6+ hours)
2. If needed, the system automatically indexes or refreshes the database content
3. The system uses the Xenova/transformers library to generate embeddings for database content
4. Each database item is converted to a vector representation
5. When you search, your query is also converted to a vector
6. The system finds items with vectors most similar to your query vector
7. Results are ranked by similarity and returned with confidence scores

#### When to Use Explicit Indexing

While the system automatically handles indexing, there are cases where you might want to explicitly index a database:

- After making many changes to the Notion database
- Before performing a large number of searches (to avoid indexing delays)
- When switching to a different database
- If you suspect the index might be outdated

In these cases, you can use the `notion-index-database` tool:

```
Please index my Notion database for semantic search using the notion-index-database tool.
```

## API Endpoints (when using HTTP transport)

- `GET /sse` - Server-Sent Events endpoint for establishing a connection
- `POST /messages` - Endpoint for sending messages to the server

## Project Structure

- `src/index.ts` - Main server implementation
- `src/client.ts` - Sample client for testing
- `src/notion-integration.ts` - Notion API integration
- `src/notion-mcp.ts` - MCP tools and resources for Notion
- `launch.js` - Launcher script for Claude Desktop integration
- `generate-config.js` - Helper script to generate Claude Desktop configuration

## Testing

A sample client is included to demonstrate how to interact with the MCP server:

```bash
# Run the client to test the server
bun run client
```

## Debugging Tips

When debugging issues with your MCP server:

1. Check the Claude app's MCP logs (under Developer > Advanced > Show MCP logs)
2. Run the server with debug logs: `LOG_LEVEL=debug bun start`
3. Make sure the server is using the correct transport type
4. For stdio transport issues, verify your server only outputs JSON-RPC messages to stdout

### Common Issues

- **"spawn bun ENOENT" error**: This means Claude Desktop cannot find the Bun executable. Make sure to use the full absolute path to Bun in your configuration.
- **"Cannot find package X" error**: This occurs when dependencies haven't been installed. The launcher should automatically handle this now, but you can also run `bun install` manually in the server directory.
- **JSON parsing errors**: These typically occur when console logs are being sent through the stdio channel. The server is configured to avoid this, but check your code for any direct `console.log` calls.
- **Connection issues**: If the server disconnects immediately, check your launch parameters and environment variables.
- **Notion API errors**: If you see errors related to Notion, verify that your API key is correct and that you've shared your database with the integration.

## Resources

- [Model Context Protocol](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://github.com/modelcontextprotocol/protocol)
- [MCP Debugging Guide](https://modelcontextprotocol.io/docs/tools/debugging)
- [Notion API Documentation](https://developers.notion.com/)
