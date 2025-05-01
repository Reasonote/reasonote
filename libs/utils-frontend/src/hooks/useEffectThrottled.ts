import {
    useEffect,
    useRef,
} from 'react';

import _ from 'lodash';

export function useEffectThrottled(
    effect: () => any,
    deps: React.DependencyList | undefined,
    throttleMaxFPS: number,
): any {
    const throttledFunc = useRef(_.throttle(effect, throttleMaxFPS));

    return useEffect(() => {
        throttledFunc.current();
    }, deps);
}
