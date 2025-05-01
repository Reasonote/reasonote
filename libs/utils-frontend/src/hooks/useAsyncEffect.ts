import {
    DependencyList,
    useEffect,
} from 'react';

export function useAsyncEffect(factory: () => Promise<any>, deps: DependencyList) {
    useEffect(() => {
        factory();
    }, deps);
}
