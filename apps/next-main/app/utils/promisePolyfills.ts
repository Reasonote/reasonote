/**
 * Polyfill for Promise.withResolvers
 * This function is part of the newer JavaScript specifications and might not be available in all environments.
 */

// If Promise.withResolvers is not defined, add it
if (typeof Promise !== 'undefined' && !('withResolvers' in Promise)) {
  // @ts-ignore - Add withResolvers to the Promise object
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {
      resolve,
      reject,
      promise,
    };
  };
}

export {};
