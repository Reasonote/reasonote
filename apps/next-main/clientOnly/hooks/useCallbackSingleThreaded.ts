import {
  useCallback,
  useEffect,
  useRef,
} from "react";

// Global state to coordinate across component tree
const globalState = new Map<string, {
  isRunning: boolean;
  isQueued: boolean;
  lastRunTime: number | null;
}>();

export function useRefreshCallback(
  cbid: string,
  callback: () => Promise<void>,
  options: {
    throttleMs?: number;
  } = {}
) {
  // Initialize global state if needed
  useEffect(() => {
    if (!globalState.has(cbid)) {
      globalState.set(cbid, {
        isRunning: false,
        isQueued: false,
        lastRunTime: null,
      });
    }
  }, [cbid]);

  // Store the latest callback in a ref
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup if this was the last instance using this cbid
  useEffect(() => {
    return () => {
      // Optional: Could add a reference counter to know when to clean up
      // For now, we'll keep the state around as it's minimal
    };
  }, [cbid]);

  const execute = useCallback(async () => {
    const state = globalState.get(cbid);
    if (!state) return;
    
    // If already running, queue for later
    if (state.isRunning) {
      state.isQueued = true;
      return;
    }

    try {
      state.isRunning = true;

      // Handle throttling
      if (options.throttleMs && state.lastRunTime) {
        const timeSinceLastRun = Date.now() - state.lastRunTime;
        const timeToWait = Math.max(0, options.throttleMs - timeSinceLastRun);
        if (timeToWait > 0) {
          await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
      }

      state.lastRunTime = Date.now();
      await callbackRef.current();
    } finally {
      state.isRunning = false;

      // If queued, execute again
      if (state.isQueued) {
        state.isQueued = false;
        // Use setTimeout to avoid potential stack overflow with synchronous callbacks
        setTimeout(() => execute(), 0);
      }
    }
  }, [cbid, options.throttleMs]);

  return execute;
}