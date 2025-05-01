/**
 * Checks if the current file is being run directly (not imported as a module)
 * @param importMetaUrl The import.meta.url of the calling file
 * @returns boolean indicating if the file is being run directly
 */
export function isMainFileBeingRun(importMetaUrl: string): boolean {
    return process.argv[1] === importMetaUrl.substring(7);
} 