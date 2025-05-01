#!/usr/bin/env bun

/**
 * Claude Desktop Configuration Generator
 * 
 * This script generates the proper configuration for Claude Desktop
 * with the correct paths for your system.
 * 
 * Usage:
 *   bun generate-config.js
 */

import { execSync } from 'child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { homedir } from 'os';
import {
  dirname,
  join,
  resolve,
} from 'path';
import { fileURLToPath } from 'url';

// Get the absolute path to this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

// Find the Bun executable
function findBunPath() {
  try {
    // Try using 'which bun'
    const bunPath = execSync('which bun', { encoding: 'utf8' }).trim();
    if (existsSync(bunPath)) {
      return bunPath;
    }
  } catch (e) {
    // which command failed, continue with other methods
  }
  
  // Check common installation paths
  const commonPaths = [
    '/Users/' + homedir().split('/').pop() + '/.bun/bin/bun',
    '/usr/local/bin/bun',
    '/opt/homebrew/bin/bun',
    '/usr/bin/bun'
  ];
  
  for (const path of commonPaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  // If we can't find Bun, return a placeholder
  return '/path/to/bun';
}

// Get the absolute path to the launch.js script
const launchScriptPath = resolve(projectRoot, 'launch.js');

// Find the Bun executable
const bunPath = findBunPath();

// Generate the configuration
const config = {
  mcpServers: {
    "reasonote-mcp-server": {
      command: bunPath,
      args: [
        launchScriptPath,
        "--debug"
      ]
    }
  }
};

// Format the configuration as JSON
const configJson = JSON.stringify(config, null, 2);

// Output the configuration
console.log(`\n=== Claude Desktop Configuration ===\n`);
console.log(configJson);
console.log(`\n=== End Configuration ===\n`);

// Path to the Claude Desktop config file
const claudeConfigPath = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

// Ask if the user wants to write the config directly
console.log(`This configuration should be placed at:\n${claudeConfigPath}\n`);
console.log(`Do you want to write this configuration to your Claude Desktop config file? (y/n)`);

// Simulate a prompt
const response = await new Promise((resolve) => {
  process.stdin.once('data', (data) => {
    resolve(data.toString().trim().toLowerCase());
  });
});

if (response === 'y' || response === 'yes') {
  try {
    // Read the existing config if it exists
    let existingConfig = {};
    if (existsSync(claudeConfigPath)) {
      try {
        existingConfig = JSON.parse(readFileSync(claudeConfigPath, 'utf8'));
      } catch (e) {
        console.log(`Warning: Could not parse existing config. Creating a new one.`);
      }
    }
    
    // Merge configurations
    existingConfig.mcpServers = {
      ...existingConfig.mcpServers,
      ...config.mcpServers
    };
    
    // Write the config file
    writeFileSync(claudeConfigPath, JSON.stringify(existingConfig, null, 2));
    console.log(`\nConfiguration written to:\n${claudeConfigPath}`);
    console.log(`\nPlease restart Claude Desktop for the changes to take effect.`);
  } catch (e) {
    console.error(`Error writing configuration: ${e.message}`);
    console.log(`\nPlease manually add the configuration to your Claude Desktop config file.`);
  }
} else {
  console.log(`\nPlease manually add the configuration to your Claude Desktop config file.`);
}

// Final instructions
console.log(`\nTo use this MCP server in Claude Desktop, follow these steps:
1. Open Claude Desktop
2. Go to Developer > Advanced > MCP Servers
3. Select "reasonote-mcp-server" from the dropdown
4. Try it out!
`); 