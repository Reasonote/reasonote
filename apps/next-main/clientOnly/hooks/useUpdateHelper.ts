import React, {
  DependencyList,
  useEffect,
  useState,
} from "react";

import _, {
  throttle,
  ThrottleSettings,
} from "lodash";

/**
 * Represent a generic function.
 * Used internally to improve code readability
 */
export type GenericFunction = (...args: any[]) => any;

const defaultOptions: ThrottleSettings = {
  leading: false,
  trailing: true,
};

const useThrottledCallback2 = <TCallback extends GenericFunction>(
  fn: TCallback,
  dependencies?: DependencyList,
  wait: number = 600,
  options: ThrottleSettings = defaultOptions
) => {
  //     const throttled = useRef(throttle<TCallback>(fn, wait, options))

  //     useEffect(() => {
  //         throttled.current = throttle(fn, wait, options)
  //     }, [fn, wait, options, ...(dependencies ?? [])])

  // //   useWillUnmount(() => {
  // //     throttled.current?.cancel()
  // //   })

  //     return useCallback(throttled.current, dependencies ?? [])

  // return useCallback(fn, dependencies ?? [])

  const throttledFn = React.useMemo(
    () =>
      throttle((val) => {
        fn(val);
      }, wait),
    [fn, wait, options]
  );

  return throttledFn;
};


// TODO: THROTTLE HERE ISNT WORKING, FIX LATER.
export function useUpdateHelper<TResult, TValue, TObj>(params: {
  /**
   * A function which should perform the update.
   * @param params
   */
  updateFn(params: TValue, obj: TResult): Promise<void>;

  /**
   * Dependencies for updateFn.
   */
  updateFnDeps?: any[];

  /**
   * Dependencies for reseting the state.
   */
  resetDeps?: any[];

  /**
   * The object returned from useFragmentDataLoader.
   */
  obj: any;

  /**
   * The initial value for the state, or a getter for it.
   */
  statePopulator: (obj: TResult) => TValue;

  /**
   * How long to wait between updates.
   */
  throttleWait: number;

  /**
   * Params for throttle.
   */
  throttleParams?: ThrottleSettings;
}) {
  const [_val, _setVal] = useState<TValue | undefined>(undefined);
  const [_lastResetDeps, _setLastResetDeps] = useState<any[] | undefined>(
    undefined
  );

  useEffect(() => {
    //@ts-ignore
  }, [params.obj.data]);

  const throttledUpdater = useThrottledCallback2(
    (val: TValue) => {
      //@ts-ignore
      return params.updateFn(val, params.obj.data as TResult);
    },
    [
      JSON.stringify(params.updateFn),
      params.obj.data,
      ...(params.updateFnDeps ? params.updateFnDeps : []),
      ...(params.resetDeps ? params.resetDeps : []),
    ],
    params.throttleWait
  );

  // const nonThrottleCb = useCallback((val: TValue) => {
  //     return params.updateFn(val, params.obj.data as TResult);
  // }, [
  //     JSON.stringify(params.updateFn),
  //     params.obj.data,
  //     ...(params.updateFnDeps ? params.updateFnDeps : []),
  //     ...(params.resetDeps ? params.resetDeps : [])
  // ])

  const updater = async (val: TValue) => {
    _setVal(val);
    await throttledUpdater(val);
  };

  useEffect(() => {
    if (
      _val === undefined &&
      !!params.obj.data &&
      !_.isEmpty(params.obj.data)
    ) {
      const val = params.statePopulator(params.obj.data as TResult);
      _setVal(val);
      _setLastResetDeps(params.resetDeps);
    }
  }, [
    params.obj.data,
    _val,
    params.statePopulator,
    JSON.stringify(params.resetDeps),
  ]);

  useEffect(() => {
    if (!!_lastResetDeps && !_.isEqual(_lastResetDeps, params.resetDeps)) {
      const val = params.statePopulator(params.obj.data as TResult);
      _setVal(val);
      _setLastResetDeps(params.resetDeps);
    }
  }, [
    params.obj.data,
    _val,
    params.statePopulator,
    JSON.stringify(params.resetDeps),
  ]);

  return [_val, updater] as const;
}
