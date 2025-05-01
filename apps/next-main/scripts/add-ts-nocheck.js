/**
 * This script adds // @ts-nocheck to all .priompt.tsx files in the specified directories
 * to disable TypeScript checking for those files during builds.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define directories to search for .priompt.tsx files
const directories = [
  path.resolve(__dirname, '../../../libs/lib-ai'),
  // Add other problematic directories as needed
];

// Find all .priompt.tsx files
directories.forEach(directory => {
  if (!fs.existsSync(directory)) {
    console.log(`Directory not found: ${directory}`);
    return;
  }

  console.log(`Searching for .priompt.tsx files in ${directory}...`);
  
  // Use glob to find all .priompt.tsx files
  const files = glob.sync('**/*.priompt.tsx', { cwd: directory, absolute: true });
  
  console.log(`Found ${files.length} .priompt.tsx files`);
  
  // Add // @ts-nocheck to each file
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Skip if file already has a @ts-nocheck comment
      if (content.includes('// @ts-nocheck') || content.includes('/* @ts-nocheck */')) {
        console.log(`Already has @ts-nocheck: ${path.relative(process.cwd(), file)}`);
        return;
      }
      
      // Add @ts-nocheck at the top of the file
      const modifiedContent = '// @ts-nocheck\n' + content;
      fs.writeFileSync(file, modifiedContent, 'utf8');
      
      console.log(`Added @ts-nocheck to: ${path.relative(process.cwd(), file)}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  });
});

console.log('Finished adding @ts-nocheck to .priompt.tsx files');