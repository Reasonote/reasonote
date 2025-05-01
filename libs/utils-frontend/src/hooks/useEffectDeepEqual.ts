import {
  useEffect,
  useRef,
} from 'react';

import _ from 'lodash';

// export function useEffectDeepEqual<TDeps extends any[]>(effect: () => any, deps: TDeps) {
//     const [prevState, setPrevState] = useState<TDeps | null>(null);

//     // Changed is a boolean, we will only update the state if the deps have changed.
//     const changed = !_.isEqual(prevState, deps);
//     if (changed) {
//         setPrevState(deps);
//     }

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     useEffect(effect, [changed]);
// }

function useDeepCompareMemoize(value: any) {
    const ref = useRef()
    // it can be done by using useMemo as well
    // but useRef is rather cleaner and easier

    if (!_.isEqual(value, ref.current)) {
        ref.current = value
    }

    return ref.current
}

export function useEffectDeepEqual(callback: () => any, dependencies: any[]) {
    useEffect(
        callback,
        dependencies.map(useDeepCompareMemoize)
    )
}
