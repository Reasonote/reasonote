import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { isEqual } from 'lodash';

import { createSimpleLogger } from '@reasonote/lib-utils';

export type UseAsyncMemoFancyOptions<T> = {
  wait?: number;
  leading?: boolean;
  allowMultiple?: boolean;
  initial?: T;
  equals?: (prevDeps: DependencyList, nextDeps: DependencyList) => boolean;
};

const logger = createSimpleLogger('useAsyncMemoFancy');

export function useAsyncMemoFancy<T>(
  factory: () => Promise<T> | undefined | null,
  deps: React.DependencyList,
  options: UseAsyncMemoFancyOptions<T> = {}
): [T | undefined, boolean, any] {
  const [result, setResult] = useState<T | undefined>(options.initial);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const lastInvocationTime = useRef<number>(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const lastDeps = useRef<DependencyList>(deps);

  const { wait = 1000, leading = false, allowMultiple = false, equals = isEqual } = options;

  const execute = useCallback(async () => {
    setLoading(true);
    timer.current = null; // Ensure the timer is cleared when execute starts
    try {
      // logger.log('RUNNING FACTORY')
      const res = await factory();
      setResult(res as any);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [factory]);

  // logger.log('DEPS', deps)

  useEffect(() => {
    if (equals(lastDeps.current, deps)) {
        // logger.log('DEPS EQUAL, SKIPPING')
        return;
    }
    lastDeps.current = deps;

    const now = Date.now();
    const elapsedTime = now - lastInvocationTime.current;
    const isThrottling = elapsedTime < wait;

    // TODO: something is a little weird about leading here.
    // If leading is true, we should execute immediately, but we should also set a timer right?
    if (leading && !isThrottling && !timer.current) {
      // If leading is true and we're not currently throttling, execute immediately
      lastInvocationTime.current = now; // Update the last invocation time
      execute();
    } else {
      // Clear existing timer and reset it to ensure the latest call is queued
      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        execute();
        lastInvocationTime.current = Date.now(); // Update the last invocation time upon execution
      }, isThrottling ? wait - elapsedTime : wait);
    }

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [deps, execute, leading, wait]);

  return [result, loading, error];
}