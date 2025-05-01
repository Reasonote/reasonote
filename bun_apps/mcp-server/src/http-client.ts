/**
 * This is a sample script showing how to connect to an MCP server via HTTP/SSE
 * 
 * The MCP Inspector uses the HTTP/SSE transport, so this matches its behavior
 */

import { HttpClientTransport } from '@modelcontextprotocol/sdk/client/http.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function main() {
  // Set a client ID that we'll use for the connection
  const clientId = `client-${Date.now()}`;
  console.log(`Using client ID: ${clientId}`);
  
  // Create an HTTP client that connects to our server
  const transport = new HttpClientTransport({
    baseUrl: `http://localhost:3002`,  // Match the port you specified when starting the server
    clientId,                         // Pass the clientId to use in query parameters
    fetch: globalThis.fetch            // Use the global fetch
  });

  const client = new Client(
    {
      name: "http-example-client",
      version: "1.0.0"
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {}
      }
    }
  );

  try {
    console.log("Connecting to MCP server via HTTP...");
    await client.connect(transport);
    console.log("Connected!");

    // List available resources
    console.log("\nListing available resources:");
    const resources = await client.listResources();
    console.log(JSON.stringify(resources, null, 2));

    // Read greeting resource
    console.log("\nReading greeting resource:");
    const greeting = await client.readResource({
      uri: "greeting://user"
    });
    console.log(JSON.stringify(greeting, null, 2));

    // Read notes resource
    console.log("\nReading notes resource for 'mcp':");
    const notes = await client.readResource({
      uri: "notes://mcp"
    });
    console.log(JSON.stringify(notes, null, 2));

    // List available tools
    console.log("\nListing available tools:");
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));

    // Call the calculator tool
    console.log("\nCalling calculator tool for addition:");
    const addResult = await client.callTool({
      name: "calculate",
      arguments: {
        operation: "add",
        a: 10,
        b: 5
      }
    });
    console.log(JSON.stringify(addResult, null, 2));

    // Keep the connection alive for a while to let the MCP Inspector connect
    console.log("\nConnection will be kept open for 60 seconds...");
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    console.log("Closing connection...");
    await transport.close();
    console.log("Connection closed.");
  }
}

main().catch(console.error); 