/**
 * Takes an object with promise values and returns a promise that resolves to an object
 * with the same keys but resolved values.
 * 
 * @param obj - An object where values can be promises or regular values
 * @param options - Configuration options
 * @returns A promise that resolves to an object with the same keys and resolved values
 * 
 * @example
 * const result = await resolveObjectPromises({
 *   user: fetchUser(),
 *   posts: fetchPosts(),
 *   staticValue: 'hello'
 * });
 * // result: { user: User, posts: Post[], staticValue: 'hello' }
 */
export async function resolveObjectPromises<T extends Record<string, any>>(
  obj: T,
  options?: { 
    failSilently?: boolean;  // When true, failed promises resolve to undefined instead of rejecting
    timeout?: number;        // Optional timeout in milliseconds
    onError?: (key: string, error: unknown) => any; // Custom error handler
  }
): Promise<{ [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K] }> {
  const entries = await Promise.all(
    Object.entries(obj).map(async ([key, value]) => {
      // For each entry, determine if it's a promise
      const isPromise = value instanceof Promise;
      
      // If not a promise, return as is
      if (!isPromise) return [key, value];
      
      // Handle potential timeout
      if (options?.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Promise for '${key}' timed out after ${options.timeout}ms`)), options.timeout)
        );
        try {
          value = await Promise.race([value, timeoutPromise]);
        } catch (error) {
          if (options?.onError) return [key, options.onError(key, error)];
          if (options?.failSilently) return [key, undefined];
          throw error;
        }
      }
      
      try {
        return [key, await value];
      } catch (error) {
        if (options?.onError) return [key, options.onError(key, error)];
        if (options?.failSilently) return [key, undefined];
        throw error;
      }
    })
  );
  
  return Object.fromEntries(entries) as any;
}