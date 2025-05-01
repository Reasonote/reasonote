/**
 * Custom loader for .priompt.tsx files
 * This loader ensures Priompt is imported and completely removes React references
 */
module.exports = function (source) {
    const LOG_LEVEL = 'error';
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldLog = (level) => {
        if (LOG_LEVEL === 'error') {
            return level === 'error';
        }
        else if (LOG_LEVEL === 'warn') {
            return level === 'warn' || level === 'error';
        }
        else if (LOG_LEVEL === 'log') {
            return level === 'log' || level === 'warn' || level === 'error';
        }
        else if (LOG_LEVEL === 'debug') {
            return level === 'debug' || level === 'log' || level === 'warn' || level === 'error';
        }
        return true;
    }
    const logger = {
        log: (...args) => {
            if (shouldLog('log')) {
                console.log('\x1b[35m%s\x1b[0m', `[Priompt Loader]`, ...args);
            }
        },
        warn: (...args) => {
            if (shouldLog('warn')) {
                console.warn('\x1b[33m%s\x1b[0m', `[Priompt Loader]`, ...args);
            }
        },
        error: (...args) => {
            if (shouldLog('error')) {
                console.error('\x1b[31m%s\x1b[0m', `[Priompt Loader]`, ...args);
            }
        },
        debug: (...args) => {
            if (shouldLog('debug')) {
                console.debug('\x1b[32m%s\x1b[0m', `[Priompt Loader]`, ...args);
            }
        },
    }
    const filename = this.resourcePath.split('/').pop();

    // Log the file being processed
    logger.log(`[Priompt Loader] Processing: ${this.resourcePath}`);

    // Print the file content before processing (limited to prevent console flooding)
    logger.log(`[Priompt Loader] BEFORE processing ${filename}:`);
    const sourceLines = source.split('\n');
    const firstLines = sourceLines.slice(0, 20).join('\n'); // First 20 lines only
    logger.log(firstLines);
    if (sourceLines.length > 20) {
        logger.log(`... (${sourceLines.length - 20} more lines)`);
    }

    // Forced transformation to use Priompt.createElement instead of React.createElement
    let modifiedSource = source;

    // Add @ts-nocheck in production mode to disable TypeScript checking for this file
    if (isProduction) {
        // Check if file already has a @ts-nocheck comment
        const hasNoCheck = modifiedSource.includes('// @ts-nocheck') || modifiedSource.includes('/* @ts-nocheck */');
        if (!hasNoCheck) {
            modifiedSource = '// @ts-nocheck\n' + modifiedSource;
            logger.log(`[Priompt Loader] Added @ts-nocheck to disable TypeScript checking in production`);
        }
    }

    // Add JSX pragma comments at the top of the file (before any imports)
    // This forcefully tells the JSX transformer to use Priompt instead of React
    const hasJsxPragma = modifiedSource.includes('@jsxImportSource @anysphere/priompt');
    if (!hasJsxPragma) {
        modifiedSource =
            '/** @jsxImportSource @anysphere/priompt */\n' +
            modifiedSource;
        logger.log(`[Priompt Loader] Added JSX pragma comments`);
    }

    // 1. Remove all React imports
    modifiedSource = modifiedSource.replace(/import\s+React\s+from\s+['"]react['"];?/g, '');
    modifiedSource = modifiedSource.replace(/import\s+\*\s+as\s+React\s+from\s+['"]react['"];?/g, '');
    modifiedSource = modifiedSource.replace(/import\s+{\s*.*?\s*}\s+from\s+['"]react['"];?/g, '');

    // 2. Remove React.createElement variables
    modifiedSource = modifiedSource.replace(/var\s+__jsx\s*=\s*React\.createElement;?/g, '');

    // 3. Ensure Priompt is imported as a namespace
    const hasPriomptNamespaceImport = modifiedSource.includes('import * as Priompt from');
    if (!hasPriomptNamespaceImport) {
        modifiedSource = `import * as Priompt from '@anysphere/priompt';\n${modifiedSource}`;
        logger.log(`[Priompt Loader] Added Priompt namespace import`);
    }

    // Print the file content after processing (limited to prevent console flooding)
    logger.log(`[Priompt Loader] AFTER processing ${filename}:`);
    const modifiedLines = modifiedSource.split('\n');
    const firstModifiedLines = modifiedLines.slice(0, 20).join('\n'); // First 20 lines only
    logger.log(firstModifiedLines);
    if (modifiedLines.length > 20) {
        logger.log(`... (${modifiedLines.length - 20} more lines)`);
    }

    // Log a summary of changes
    if (source !== modifiedSource) {
        logger.log(`[Priompt Loader] File was modified: ${filename}`);
    } else {
        logger.log(`[Priompt Loader] No changes needed: ${filename}`);
    }

    return modifiedSource;
}; 