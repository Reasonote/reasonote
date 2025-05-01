/**
 * Configuration system for Chrome extension
 * Provides access to configuration in different extension contexts
 */
// Production values (default configuration)
import configValues from './configValues';

export interface ExtensionConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    baseUrl: string;
  };
}

const currentConfig: ExtensionConfig = configValues as any;


// Add TypeScript declaration for configuration
declare global {
  interface Window {
    __REASONOTE_CONFIG__?: ExtensionConfig;
  }
}

// Configuration state management
let configLoadPromise: Promise<ExtensionConfig> | null = null;
let isConfigLoaded = false;

// Event listeners for config updates
const configListeners: Array<(config: ExtensionConfig) => void> = [];

/**
 * Validate that a config object meets the required structure
 */
function validateConfig(config: any): config is ExtensionConfig {
  if (!config) return false;
  
  const hasSupabase = config.supabase && 
    typeof config.supabase.url === 'string' && 
    typeof config.supabase.anonKey === 'string';
    
  const hasApi = config.api && 
    typeof config.api.baseUrl === 'string';
    
  return hasSupabase && hasApi;
}

/**
 * Initialize configuration asynchronously (if not already initialized)
 */
export function initConfig(): Promise<ExtensionConfig> {
  // Return existing promise if already loading
  if (configLoadPromise) {
    return configLoadPromise;
  }
  
  configLoadPromise = new Promise<ExtensionConfig>(async (resolve) => {
    try {
      let loadedConfig: ExtensionConfig | null = null; 
      
      // 1. Check chrome.storage.local (for background service worker)
      if (!loadedConfig && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          const storageResult = await new Promise<{__REASONOTE_CONFIG__?: ExtensionConfig}>(
            storageResolve => chrome.storage.local.get('__REASONOTE_CONFIG__', storageResolve)
          );
          
          if (storageResult && storageResult.__REASONOTE_CONFIG__) {
            const storageConfig = storageResult.__REASONOTE_CONFIG__;
            
            if (validateConfig(storageConfig)) {
              console.log('[RSN_CONFIG] Using configuration from chrome.storage');
              loadedConfig = storageConfig;
            } else {
              console.warn('[RSN_CONFIG] Found config in storage but it failed validation');
            }
          }
        } catch (storageError) {
          console.error('[RSN_CONFIG] Error accessing chrome.storage:', storageError);
        }
      }
      
      // 2. If we've found a valid config from any source, use it
      if (loadedConfig) { 
        // Store in chrome.storage for other contexts if available
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ 
            __REASONOTE_CONFIG__: currentConfig 
          }).catch((err: Error) => {
            console.warn('[RSN_CONFIG] Failed to store config in chrome.storage:', err);
          });
        }
      } else {
        // No valid config found, use default
        console.log('[RSN_CONFIG] Using default configuration');
      }
      
      isConfigLoaded = true;
      notifyConfigListeners(currentConfig);
      resolve(currentConfig);
    } catch (error) {
      console.error('[RSN_CONFIG] Error initializing config:', error);
      isConfigLoaded = true;
      notifyConfigListeners(currentConfig);
      resolve(currentConfig);
    }
  });
  
  return configLoadPromise;
}

/**
 * Notify all config listeners of an update
 */
function notifyConfigListeners(config: ExtensionConfig) {
  configListeners.forEach(listener => {
    try {
      listener(config);
    } catch (error) {
      console.error('[RSN_CONFIG] Error in config listener:', error);
    }
  });
}

/**
 * Register a listener for configuration changes
 */
export function onConfigChange(listener: (config: ExtensionConfig) => void): () => void {
  configListeners.push(listener);
  
  // If config is already loaded, notify immediately
  if (isConfigLoaded) {
    try {
      listener(currentConfig);
    } catch (error) {
      console.error('[RSN_CONFIG] Error in config listener:', error);
    }
  }
  
  // Return unsubscribe function
  return () => {
    const index = configListeners.indexOf(listener);
    if (index >= 0) {
      configListeners.splice(index, 1);
    }
  };
}

/**
 * Synchronous function to get configuration
 * This will return the current config (which might be default until async loading completes)
 */
export function getConfig(): ExtensionConfig {
  if (!configLoadPromise) {
    // Start the initialization process if not already started
    initConfig();
  }
  
  return currentConfig;
}

/**
 * Asynchronous function to get configuration
 * Ensures the configuration is fully loaded before returning
 */
export function getConfigAsync(): Promise<ExtensionConfig> {
  if (!configLoadPromise) {
    return initConfig();
  }
  return configLoadPromise;
}

// Initialize config immediately
initConfig();

// Export default config for backwards compatibility
export default getConfig(); 