import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
} from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  // Create a client that connects to our server via stdio
  const transport = new StdioClientTransport({
    command: "/Users/lukebechtel/.bun/bin/bun", // Full path to bun
    args: ["run", "src/index.ts"],
    // You can also add environment variables for better debugging
    env: {
      ...process.env,
      TRANSPORT: "stdio",
      LOG_LEVEL: "debug"
    }
  });

  const client = new Client(
    {
      name: "example-client",
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
    // Connect to the server
    console.log("Connecting to MCP server...");
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
    console.log("\nReading notes resource for 'typescript':");
    const notes = await client.readResource({
      uri: "notes://typescript"
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
        a: 5,
        b: 3
      }
    });
    console.log(JSON.stringify(addResult, null, 2));

    // List available prompts
    console.log("\nListing available prompts:");
    const prompts = await client.listPrompts();
    console.log(JSON.stringify(prompts, null, 2));

    // Get take-notes prompt
    console.log("\nGetting take-notes prompt:");
    const prompt = await client.getPrompt({
      name: "take-notes",
      arguments: {
        topic: "MCP",
        content: "The Model Context Protocol allows applications to provide context for LLMs. It includes resources, tools, and prompts."
      }
    });
    console.log(JSON.stringify(prompt, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await transport.close();
  }
}

main().catch(console.error); 