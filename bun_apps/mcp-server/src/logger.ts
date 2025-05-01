/**
 * Simple logger utility for the MCP server
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Get current log level from environment
const getCurrentLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel === 'debug') return LogLevel.DEBUG;
  if (envLevel === 'info') return LogLevel.INFO;
  if (envLevel === 'warn') return LogLevel.WARN;
  if (envLevel === 'error') return LogLevel.ERROR;
  return LogLevel.INFO; // Default log level
};

// Check if we should log based on level
const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getCurrentLogLevel();
  
  if (currentLevel === LogLevel.DEBUG) return true;
  if (currentLevel === LogLevel.INFO) return level !== LogLevel.DEBUG;
  if (currentLevel === LogLevel.WARN) return level !== LogLevel.DEBUG && level !== LogLevel.INFO;
  if (currentLevel === LogLevel.ERROR) return level === LogLevel.ERROR;
  
  return true;
};

// Get transport type for determining output method
export const getTransportType = (): string => {
  return (process.env.TRANSPORT || 'stdio').toLowerCase();
};

// Check if we're using stdio transport
export const isStdioTransport = (): boolean => {
  const transport = getTransportType();
  return transport === 'stdio' || transport === 'both';
};

// Base log function
const log = (level: LogLevel, ...args: any[]): void => {
  if (!shouldLog(level)) return;

  // Format as timestamp + level + message
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  // If we're using stdio transport, log to stderr to avoid interfering with JSON-RPC
  // Otherwise, we can use console methods directly
  if (isStdioTransport()) {
    process.stderr.write(`${prefix} ${args.join(' ')}\n`);
  } else {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, ...args);
        break;
    }
  }
};

// Exposed logging functions
export const debug = (...args: any[]): void => log(LogLevel.DEBUG, ...args);
export const info = (...args: any[]): void => log(LogLevel.INFO, ...args);
export const warn = (...args: any[]): void => log(LogLevel.WARN, ...args);
export const error = (...args: any[]): void => log(LogLevel.ERROR, ...args); 