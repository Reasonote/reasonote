#!/usr/bin/env node

/**
 * This script watches for changes in the dist directory and runs the clean-jsx-pragmas script
 * whenever a JavaScript file is added or changed.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const distDir = path.resolve(__dirname, '../dist');
const cleanupScript = path.resolve(__dirname, './clean-jsx-pragmas.js');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  console.log(`Creating dist directory at ${distDir}...`);
  fs.mkdirSync(distDir, { recursive: true });
}

// Run tsc in watch mode
const tscProcess = spawn('tsc', ['-p', './tsconfig.json', '--preserveWatchOutput', '--watch'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: ['inherit', 'inherit', 'inherit']
});

console.log('TypeScript compiler started in watch mode...');

// Function to run the cleanup script
function runCleanup() {
  exec(`node ${cleanupScript}`, (error, stdout, stderr) => {
    if (stdout.trim()) {
      console.log(stdout);
    }
    if (stderr.trim()) {
      console.error(stderr);
    }
  });
}

// Watch for changes in the dist directory
let debounceTimeout;
fs.watch(distDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.js')) {
    // Debounce to avoid running the cleanup script multiple times for batch changes
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log(`File ${filename} changed, cleaning JSX pragmas...`);
      runCleanup();
    }, 100);
  }
});

// Clean up process on exit
process.on('SIGINT', () => {
  console.log('Stopping watch process...');
  tscProcess.kill();
  process.exit(0);
});

console.log(`Watching for changes in ${distDir}...`);

// Run initial cleanup
if (fs.existsSync(distDir)) {
  console.log('Running initial cleanup...');
  runCleanup();
} 