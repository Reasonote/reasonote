# Chrome Extension Configuration System - PRD

## Overview
This document outlines the requirements and implementation details for the configuration system in the Reasonote Chrome extension, focusing on managing environment-specific settings across different contexts within the extension.

## Requirements
1. Support both production and development configurations
2. Ensure configs are accessible in all extension contexts (background service worker, content scripts, popup)
3. Keep sensitive credentials out of version control
4. Follow Chrome extension best practices for Manifest V3
5. Use environment variables only during build process, never at runtime
6. Maintain a simple developer experience
7. Handle asynchronous configuration loading gracefully
8. Provide configuration validation and integrity checks

## Technical Architecture

### Configuration Types
1. **Default (Production) Config**: Hard-coded in the source code for production use
2. **Development Config**: Generated during build process from environment variables
3. **Sensitive Config**: Credentials and keys with higher security requirements
4. **Non-Sensitive Config**: General settings with lower security requirements

### Access Points & Contexts
- **Background Service Worker**: Needs access to config for API calls and Supabase connections
- **Content Scripts**: Need config for determining API endpoints and connection details
- **Popup UI**: Needs config for user interface and API connections
- **Other Extension Pages**: Any additional extension pages also need config access

### Challenges
1. **Context Isolation**: Chrome extension contexts (background, content scripts, popup) are isolated
2. **Service Worker Lifecycle**: Background service workers have a different lifecycle in Manifest V3
3. **Content Script Injection**: Content scripts run in web page context, requiring special handling
4. **Security**: Need to avoid exposing sensitive credentials in insecure contexts
5. **Asynchronous Storage**: Chrome storage APIs are asynchronous while configuration is often needed synchronously
6. **Initialization Order**: Ensuring configuration is available when components need it

## Implementation Approach

### Core Components
1. **config.ts**: Single source of truth with default production values and getter functions
2. **build-config.ts**: Build script to generate dev configuration from .env variables
3. **update-manifest.ts**: Script to update manifest.json with necessary content script entries
4. **utils.ts**: Shared utility functions for environment configuration

### Configuration Flow
1. Development configuration is read from environment variables during build time
2. A `dev-config.js` script is generated with the configuration as a global variable
3. The manifest is updated to inject this script into all necessary contexts
4. At runtime, the initialization sequence:
   - In content scripts/popup: Sets window.__REASONOTE_DEV_CONFIG__ and immediately stores in chrome.storage.local
   - In background: Asynchronously loads from chrome.storage.local with fallback to default config
5. Components can access config through synchronous and asynchronous interfaces

### Chrome Storage Strategy
- Development config is stored in `chrome.storage.local` for service worker access
- This enables sharing configuration across contexts even when window objects are not shared
- Configuration is stored as soon as it's available in any context
- A message-based notification system alerts contexts when configuration is updated

### Asynchronous Configuration Handling
1. **Promise-Based Access**: Provide a `getConfigAsync()` method that returns a Promise
2. **Initialization Queue**: Background service worker maintains queue of operations waiting for config
3. **Event System**: Fire events when configuration is available/changes
4. **Startup Strategy**: Background service worker initializes with default config but upgrades when dev config is available

## Implementation Details

### Build Process
1. Read environment variables from .env file (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
2. Generate a `dev-config.js` file that sets `window.__REASONOTE_DEV_CONFIG__`
3. Update manifest.json to inject this script where needed
4. Store config in chrome.storage.local for background service worker access

### Runtime Configuration Access
1. Synchronous `getConfig()` function (returns default if async load not complete)
2. Asynchronous `getConfigAsync()` function that returns a Promise
3. Event-based subscription for configuration changes
4. Configuration validation with type checking and integrity verification

### Configuration Validation & Integrity
1. Type validation using TypeScript interfaces
2. Runtime validation to ensure required properties exist
3. Default values for missing non-critical configuration
4. Explicit error handling when critical configuration is missing

### Error Recovery Strategies
1. **Partial Configuration Failure**: Use valid parts, fallback to defaults for invalid parts
2. **Complete Configuration Failure**: Log detailed error, use default configuration
3. **Storage Access Failure**: Retry with exponential backoff, fallback to defaults
4. **Initialization Failure**: Log error, restart initialization sequence

### Performance Considerations
1. Minimize content script overhead by keeping configuration minimal
2. Cache configuration appropriately to reduce storage access
3. Consider lazy loading for non-essential configuration

### Security Considerations
- No sensitive values in manifest.json or any committed files
- Environment variables only used during build process
- Production values secured through proper deployment processes
- Sensitive configuration redacted in logs or debug output

## Developer Experience
1. Simple setup with .env file for local development
2. Build scripts to automate configuration generation
3. Clear logging to indicate which configuration is being used
4. Minimal steps required to switch between development and production
5. Simplified debugging with configuration validation errors
6. Consistent configuration access patterns across contexts

## Testing Approach
1. **Unit Tests**: Validate configuration loading, merging, and fallback
2. **Integration Tests**: Verify configuration across different contexts
3. **Mock Testing**: Simulate chrome.storage for testing async behavior
4. **Validation Tests**: Ensure configuration integrity checks work correctly
5. **Error Handling Tests**: Verify graceful degradation with missing/invalid config

## Implementation Tasks
1. Create ExtensionConfig interface with validation
2. Implement utility functions for environment variable handling
3. Create build scripts for generating development configuration
4. Update manifest handling to inject configuration scripts
5. Implement runtime configuration access across contexts with both sync and async patterns
6. Add configuration validation and integrity checks
7. Implement error recovery strategies
8. Add event system for configuration changes
9. Create testing utilities for configuration validation
10. Implement configuration validation and integrity checks 