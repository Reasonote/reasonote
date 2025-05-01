// import {
//   DependencyList,
//   useCallback,
//   useMemo,
//   useRef,
// } from 'react';

// import { throttle } from 'lodash';

// export function useThrottledCallback<T extends (...args: any[]) => any>(
//     callback: T,
//     delay: number,
//     deps: DependencyList,
//     options?: { leading?: boolean; trailing?: boolean }
// ): T {
//     const throttledCallbackRef = useRef<T | null>(throttle(callback, delay, options) as unknown as T);

//     const realCb = useCallback(callback, deps);

//     const thrott = useMemo(() => {
//         return throttle(realCb, delay, options);
//     }, [realCb, delay, options]);

//     // @ts-ignore
//     return thrott;
//     // useEffect(() => {
//     //     throttledCallbackRef.current = throttle(realCb, delay, options) as unknown as T
//     // }, [callback, delay, options]);

//     // return useCallback((...args: Parameters<T>) => {
//     //     const cur = throttledCallbackRef.current;
//     //     if (cur) {
//     //         return cur(...args);
//     //     }
//     // }, deps) as any;
// }