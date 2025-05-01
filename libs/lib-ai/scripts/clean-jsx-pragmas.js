#!/usr/bin/env node

/**
 * This script removes JSX pragma comments from compiled JavaScript files
 * so they don't cause issues with frameworks that use automatic JSX runtime.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

// Recursively process all files in a directory
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      cleanFileJsxPragmas(fullPath);
    }
  }
}

// Clean JSX pragma comments from a file
function cleanFileJsxPragmas(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove /** @jsx ... */ and /** @jsxFrag ... */ comments
    const cleanedContent = content
      .replace(/\/\*\* @jsx[^\n]*\*\//g, '')
      .replace(/\/\*\* @jsxFrag[^\n]*\*\//g, '');
    
    // Only write back if changes were made
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`Cleaned JSX pragmas from: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
  }
}

// Check if dist directory exists before processing
if (fs.existsSync(distDir)) {
  processDirectory(distDir);
  console.log('JSX pragma cleanup complete');
} else {
  console.warn('Dist directory does not exist, nothing to clean');
} 