#!/usr/bin/env bun

/**
 * MCP Server Launcher
 * 
 * This script helps launch the MCP server with the correct working directory,
 * making it easier to configure in Claude Desktop without using full paths.
 * 
 * Usage:
 *   bun launch.js [options]
 * 
 * Options:
 *   --transport=stdio|http|both   Set the transport type (default: stdio)
 *   --port=3001                   Set the HTTP port (default: 3001)
 *   --debug                       Enable debug logging
 *   --skip-install                Skip dependency installation
 */

import {
  execSync,
  spawn,
} from 'child_process';
import {
  dirname,
  join,
} from 'path';
import { fileURLToPath } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

// Set environment variables based on options
const env = { ...process.env };

if (options.transport) {
  env.TRANSPORT = options.transport;
}

if (options.port) {
  env.PORT = options.port;
}

if (options.debug) {
  env.LOG_LEVEL = 'debug';
}

// Determine if we're using stdio - critical for proper handling of stdout/stderr
const isStdioMode = env.TRANSPORT === 'stdio' || env.TRANSPORT === 'both' || (!env.TRANSPORT && !options.transport);

// Only write to stderr to avoid breaking the JSON-RPC protocol in stdio mode
const log = {
  info: (message) => {
    if (isStdioMode) {
      process.stderr.write(`[INFO] ${message}\n`);
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  error: (message) => {
    if (isStdioMode) {
      process.stderr.write(`[ERROR] ${message}\n`);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  debug: (message) => {
    if (options.debug) {
      if (isStdioMode) {
        process.stderr.write(`[DEBUG] ${message}\n`);
      } else {
        console.log(`[DEBUG] ${message}`);
      }
    }
  }
};

log.debug("Debug logging enabled");

// Determine the script directory (where this launcher is located)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Always install dependencies unless explicitly skipped
if (!options['skip-install']) {
  log.info("Installing dependencies...");
  try {
    // Run bun install - CRITICAL: In stdio mode, completely silence output to stdout
    // to prevent it from interfering with the JSON-RPC protocol
    execSync('bun install', {
      cwd: __dirname,
      stdio: isStdioMode ? ['ignore', 'ignore', 'pipe'] : ['ignore', 'inherit', 'inherit']
    });
    log.info("Dependencies installed successfully.");
  } catch (error) {
    log.error(`Failed to install dependencies: ${error.message}`);
    log.info("Attempting to continue anyway...");
    // Continue execution even if install fails - the dependencies might already be installed
  }
}

// Launch the MCP server
log.info("Starting MCP server...");
const serverProcess = spawn(
  process.execPath, // Current Bun executable
  ['run', join(__dirname, 'src', 'index.ts')],
  {
    cwd: __dirname,  // Set working directory to the script directory
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']  // stdin, stdout, stderr
  }
);

// Pipe process I/O to parent process
serverProcess.stdout.pipe(process.stdout);
serverProcess.stderr.pipe(process.stderr);
process.stdin.pipe(serverProcess.stdin);

// Log errors and exit codes
serverProcess.on('error', (error) => {
  log.error(`Failed to start server process: ${error.message}`);
});

// Handle process exit
serverProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    log.error(`Server process exited with code ${code} and signal ${signal}`);
  }
  process.exit(code);
});

// Handle parent process exit
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
}); 