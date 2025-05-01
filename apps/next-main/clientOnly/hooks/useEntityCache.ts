import {
  useEffect,
  useRef,
} from "react";

import {
  makeVar,
  useReactiveVar,
} from "@apollo/client";

/**
 * This hook provides a caching mechanism for entity data with these key features:
 * 
 * 1. Global Cache: Uses Apollo's reactive variables to store entity data globally
 * 2. Reference Counting: Tracks how many components are using each cached entity
 * 3. Automatic Cleanup: Removes cached data when no components are using it
 * 4. Data Transform: Allows transforming raw data before caching
 * 
 * The cache is structured as:
 * globalVarMap = {
 *   queryName1: {
 *     entityId1: ReactiveVar<EntityCacheItem>,
 *     entityId2: ReactiveVar<EntityCacheItem>,
 *   },
 *   queryName2: {...}
 * }
 */

/**
 * @template TData
 * @typedef {Object} EntityCacheItem
 * @property {TData} [data] - The cached entity data
 * @property {Error} [error] - Error from failed fetch attempt
 * @property {boolean} loading - Current loading state
 * @property {number} refCount - Number of active subscribers
 * @property {number} [lastUnmountTime] - Timestamp of last refCount zero
 * @property {Promise<void>} [fetchPromise] - Promise for the current fetch operation
 */
interface EntityCacheItem<TData> {
  /** The transformed entity data */
  data?: TData;
  /** Any error that occurred during fetch */
  error?: Error;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Number of components using this entity */
  refCount: number;
  /** When the last component stopped using this entity */
  lastUnmountTime?: number;
  /** 
   * Promise for the current fetch operation
   * Used to coordinate concurrent fetch requests
   */
  fetchPromise?: Promise<void>;
}

/**
 * Maps query types to their entity caches
 * Each query type (e.g., 'getUser', 'getPost') has its own map of entity IDs to their cache
 */
type EntityVarMap = Record<string, ReturnType<typeof makeVar<EntityCacheItem<any>>>>;
const globalVarMap: Record<string, EntityVarMap> = {};

// Cleanup configuration
export const DEFAULT_ENTITY_CACHE_CLEANUP_DELAY = 1000; // 1 second
export const DEFAULT_ENTITY_CACHE_CLEANUP_INTERVAL = 1000; // 1 second
let globalCleanupInterval: NodeJS.Timeout | undefined;

// Add these constants
export const MAX_CLEANUP_RETRIES = 3;
export const CLEANUP_RETRY_DELAY = 5000; // 5 seconds
let cleanupFailureCount = 0;
let cleanupRetryTimeout: NodeJS.Timeout | undefined;

/**
 * Configuration parameters for the useEntityCache hook
 * @template TRawData - The raw data type returned by the fetch function
 * @template TData - The transformed data type to be cached
 */
interface UseEntityCacheParams<TRawData, TData> {
  /** Unique identifier for the query type (e.g., 'getUser', 'getPost') */
  queryName: string;
  /** Entity identifier within the query type */
  id: string;
  /** Function to fetch the raw entity data */
  fetchFn: (id: string) => Promise<TRawData>;
  /** Function to transform raw data into the cached format */
  transformFn: (params: { id: string; rawData: TRawData }) => TData;
  /** 
   * Time to wait after last component unmounts before cleaning up cache
   * Helps prevent unnecessary refetches when components remount quickly
   */
  cleanupDelay?: number;
}

/**
 * Gets or creates a reactive variable for a specific entity
 * Ensures the cache structure exists and initializes new entries
 */
function getOrCreateVar<TData>(queryName: string, id: string) {
  if (!globalVarMap[queryName]) {
    globalVarMap[queryName] = {};
  }
  const queryVarMap = globalVarMap[queryName];

  if (!queryVarMap[id]) {
    queryVarMap[id] = makeVar<EntityCacheItem<TData>>({ 
      loading: true, 
      refCount: 0 
    });
  }
  return queryVarMap[id];
}

/**
 * Cleans up cached data when no components are using it
 * Called after cleanupDelay milliseconds from when refCount hits 0
 */
function cleanup(queryName: string, id: string) {
  const queryVarMap = globalVarMap[queryName];
  if (!queryVarMap?.[id]) return;

  const entityVar = queryVarMap[id];
  const currentState = entityVar();
  
  if (currentState.refCount === 0) {
    delete queryVarMap[id];
    // Clean up the query map if empty
    if (Object.keys(queryVarMap).length === 0) {
      delete globalVarMap[queryName];
    }
  }
}

function cleanupAllUnused() {
  try {
    Object.entries(globalVarMap).forEach(([queryName, queryVarMap]) => {
      Object.entries(queryVarMap).forEach(([id, entityVar]) => {
        const state = entityVar();
        const now = Date.now();
        
        if (state.refCount <= 0) {
          if (!state.lastUnmountTime) {
            entityVar({
              ...state,
              lastUnmountTime: now
            });
          } else if (now - state.lastUnmountTime >= DEFAULT_ENTITY_CACHE_CLEANUP_DELAY) {
            console.debug(`cleanupAllUnused: cleaning up ${queryName} ${id} (unused for ${now - state.lastUnmountTime}ms)`);
            cleanup(queryName, id);
          }
        }
      });

      if (Object.keys(queryVarMap).length === 0) {
        delete globalVarMap[queryName];
      }
    });

    // Reset failure count on successful cleanup
    if (cleanupFailureCount > 0) {
      console.debug('Cleanup recovered after previous failures');
      cleanupFailureCount = 0;
    }
  } catch (error) {
    cleanupFailureCount++;
    console.error(`Error in cleanup (attempt ${cleanupFailureCount}):`, error);

    // Clear existing interval
    if (globalCleanupInterval) {
      clearInterval(globalCleanupInterval);
      globalCleanupInterval = undefined;
    }

    // Try to recover if we haven't exceeded max retries
    if (cleanupFailureCount <= MAX_CLEANUP_RETRIES) {
      console.debug(`Scheduling cleanup retry in ${CLEANUP_RETRY_DELAY}ms`);
      if (cleanupRetryTimeout) {
        clearTimeout(cleanupRetryTimeout);
      }
      cleanupRetryTimeout = setTimeout(() => {
        console.debug('Attempting to restart cleanup interval');
        ensureGlobalCleanupInterval();
      }, CLEANUP_RETRY_DELAY);
    } else {
      console.error(`Cleanup failed ${cleanupFailureCount} times, stopping retries`);
    }
  }
}

function ensureGlobalCleanupInterval() {
  try {
    if (!globalCleanupInterval) {
      globalCleanupInterval = setInterval(cleanupAllUnused, DEFAULT_ENTITY_CACHE_CLEANUP_INTERVAL);
      
      if (typeof window !== 'undefined') {
        window.addEventListener('unload', () => {
          clearAllCleanupTimers();
        });
      }
    }
  } catch (error) {
    console.error('Error setting up cleanup interval:', error);
    // Don't throw - we want the hook to continue working even if cleanup fails
  }
}

// Add this function to clean up all timers
function clearAllCleanupTimers() {
  if (globalCleanupInterval) {
    clearInterval(globalCleanupInterval);
    globalCleanupInterval = undefined;
  }
  if (cleanupRetryTimeout) {
    clearTimeout(cleanupRetryTimeout);
    cleanupRetryTimeout = undefined;
  }
}

/**
 * Hook for caching and sharing entity data across components with automatic cleanup
 * @template TRawData - Type of the raw data returned by fetchFn
 * @template TData - Type of the transformed data stored in cache
 * @param {UseEntityCacheParams<TRawData, TData>} params - Hook configuration
 * @returns {{ data?: TData; error?: Error; loading: boolean; refetch: () => Promise<void> }}
 */
export function useEntityCache<TRawData, TData>(params: UseEntityCacheParams<TRawData, TData>) {
  const { 
    queryName, 
    id, 
    fetchFn, 
    transformFn, 
    cleanupDelay = DEFAULT_ENTITY_CACHE_CLEANUP_DELAY 
  } = params;
  
  const entityVar = getOrCreateVar<TData>(queryName, id);
  const entityState = useReactiveVar<EntityCacheItem<TData>>(entityVar);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  const previousIdRef = useRef(id);

  async function doFetch(isRefetch = false) {
    const currentState = entityVar();

    // If there's an ongoing fetch, wait for it
    if (currentState.fetchPromise) {
      await currentState.fetchPromise;
      
      // For initial fetches, we're done after waiting
      if (!isRefetch) {
        return;
      }
      
      // For refetches, only continue if there's no other fetch in progress
      if (entityVar().fetchPromise) {
        return;
      }
    }

    // Create a new fetch promise
    const fetchPromise = (async () => {
      try { 
        // For refetches, only update loading state, preserve data
        if (isRefetch) {
          entityVar({
            ...entityVar(),
            loading: true,
            error: undefined
          });
        }

        const rawData = await fetchFn(id);
        const transformed = transformFn({ id, rawData });

        // Get latest state to ensure we don't override newer updates
        entityVar({ 
          ...entityVar(), 
          data: transformed, 
          error: undefined, 
          loading: false,
          fetchPromise: undefined
        });
        
        console.debug('fetch complete', queryName, id, transformed);
      } catch (e: any) {
        console.error('fetch error', queryName, id, e);
        entityVar({ 
          ...entityVar(), 
          data: undefined, 
          error: e, 
          loading: false,
          fetchPromise: undefined
        });
      }
    })();

    // Store the promise in the cache
    entityVar({
      ...entityVar(),
      loading: true,
      fetchPromise
    });

    // Wait for fetch to complete
    await fetchPromise;
  }

  useEffect(() => {
    // Ensure the global cleanup interval is running
    ensureGlobalCleanupInterval();
    
    // Handle cleanup of previous id if it changed
    if (previousIdRef.current !== id) {
      const prevEntityVar = getOrCreateVar<TData>(queryName, previousIdRef.current);
      const currentState = prevEntityVar();
      const newRefCount = Math.max(0, currentState.refCount - 1);
      
      prevEntityVar({
        ...currentState,
        refCount: newRefCount,
        lastUnmountTime: newRefCount === 0 ? Date.now() : undefined
      });
    }
    previousIdRef.current = id;

    // console.debug(`useEntityCache: ${queryName} ${id} MOUNTING`);
    try {
      // Increment refCount on mount
      entityVar({ 
        ...entityVar(), 
        refCount: entityVar().refCount + 1,
        lastUnmountTime: undefined 
      });

      const curState = entityVar();

      // console.debug(`useEntityCache ${queryName} ${id} MOUNTING: curState`, curState);

      // Start fetch if needed
      if (curState.data === undefined && !curState.error && curState.loading) {
        doFetch();
      }

      // Cleanup on unmount
      return () => {
        try {
          if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = undefined;
          }

          // Only clean up if we're not just changing ids
          if (previousIdRef.current === id) {
            const currentState = entityVar();
            const newRefCount = Math.max(0, currentState.refCount - 1);
            
            entityVar({
              ...currentState,
              refCount: newRefCount,
              lastUnmountTime: newRefCount === 0 ? Date.now() : undefined
            });
          }
        } catch (e) {
          console.error('Error in cleanup:', e);
        }
      };
    } catch (e) {
      console.error('Error in mount effect:', e);
    }
  }, [id, queryName, cleanupDelay]);

  const refetch = async () => {
    await doFetch(true);
  };

  return {
    data: entityState.data,
    error: entityState.error,
    loading: entityState.loading,
    refetch,
  };
}

// Add export for testing
export {cleanupAllUnused, globalCleanupInterval, globalVarMap};

// Update the existing clearGlobalCleanupInterval function
export function clearGlobalCleanupInterval() {
  clearAllCleanupTimers();
  cleanupFailureCount = 0;
}
