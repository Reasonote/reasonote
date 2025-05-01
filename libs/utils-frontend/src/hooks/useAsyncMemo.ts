import {
    DependencyList,
    useEffect,
    useState,
} from 'react';

import _ from 'lodash';

export function useAsyncMemo<T>(factory: () => Promise<T> | undefined | null, deps: DependencyList): T | undefined;
export function useAsyncMemo<T>(
    factory: () => Promise<T> | undefined | null,
    deps: DependencyList,
    opts: { initial: T | undefined; equals: (a: DependencyList, b: DependencyList) => boolean } = {
        initial: undefined,
        equals: _.isEqual,
    },
): T | undefined {
    const [val, setVal] = useState<T | undefined>(opts.initial);

    const [lastDeps, setLastDeps] = useState<DependencyList | undefined>(undefined);

    useEffect(() => {
        // If our dependencies have changed, run the effect.
        if (lastDeps === undefined || !opts.equals(deps, lastDeps)) {
            // Mark that our last deps are now the current deps.
            setLastDeps(deps);

            // Run the effect.
            let cancel = false;
            const promise = factory();
            if (promise === undefined || promise === null) return;

            promise.then((val) => {
                if (!cancel) {
                    setVal(val);
                }
            });
            //TODO: cancellation in useAsyncMemo not working correctly.
            // return () => {
            //     cancel = true;
            // };
        }
    }, deps);

    return val;
}