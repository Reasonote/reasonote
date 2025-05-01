import React, {
  DependencyList,
  useEffect,
  useState,
} from "react";

import _, {
  throttle,
  ThrottleSettings,
} from "lodash";

import {
  OperationVariables,
  QueryOptions,
  useQuery,
} from "@apollo/client";

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
  const throttledFn = React.useMemo(
    () =>
      throttle((val) => {
        fn(val);
      }, wait),
    [fn, wait, options]
  );

  return throttledFn;
};

type QueryDict = {
  query: any;
  variables?: any;
};

export function useAcUpdateHelper<TQueryVars extends OperationVariables, TQueryData, TValue>(params: {
  /**
   * A function which should perform the update.
   * @param params
   */
  updateFn(params: TValue, obj: TQueryData): Promise<void>;

  /**
   * Dependencies for updateFn.
   */
  updateFnDeps?: any[];

  /**
   * Dependencies for reseting the state.
   */
  resetDeps?: any[];

  /**
   * The Query
   */
  queryOpts: QueryOptions<TQueryVars, TQueryData>;

  /**
   * The initial value for the state, or a getter for it.
   */
  statePopulator: (obj: TQueryData) => TValue;

  /**
   * How long to wait between updates.
   */
  throttleWait: number;

  /**
   * Params for throttle.
   */
  throttleParams?: ThrottleSettings;
}) {
  // Get the data from apollo client.
  const queryResult = useQuery(params.queryOpts.query, params.queryOpts);

  /**
   * The current value.
   */
  const [_val, _setVal] = useState<TValue | undefined>(undefined);

  /**
   * The last reset deps.
   */
  const [_lastResetDeps, _setLastResetDeps] = useState<any[] | undefined>(
    undefined
  );

  /**
   * This will update only as frequently as throttleWait.
   */
  const throttledUpdater = useThrottledCallback2(
    (val: TValue) => {
      //@ts-ignore
      return params.updateFn(val, queryResult.data);
    },
    [
      JSON.stringify(params.updateFn),
      queryResult.data,
      ...(params.updateFnDeps ? params.updateFnDeps : []),
      ...(params.resetDeps ? params.resetDeps : []),
    ],
    params.throttleWait
  );

  /**
   * Set the value immediately and perform a throttled update.
   * @param val The value to set.
   */
  const updater = async (valOrSetter: TValue | ((old: TValue | undefined) => TValue)) => {
    if (_.isFunction(valOrSetter)) {
      const val = valOrSetter(_val);
      _setVal(val);
      await throttledUpdater(val);
      return;
    }
    else {
      _setVal(valOrSetter);
      await throttledUpdater(valOrSetter);
    }
  };

  // If we don't have a value yet, but we have data which isn't empty
  useEffect(() => {
    if (
      _val === undefined &&
      !!queryResult.data &&
      !_.isEmpty(queryResult.data)
    ) {
      const val = params.statePopulator(queryResult.data);
      _setVal(val);
      _setLastResetDeps(params.resetDeps);
    }
  }, [
    queryResult.data,
    _val,
    params.statePopulator,
    JSON.stringify(params.resetDeps),
  ]);

  // If we have previous reset deps, and they're different from the current ones,
  // and we have data, then reset the value.
  useEffect(() => {
    if (!!_lastResetDeps && !_.isEqual(_lastResetDeps, params.resetDeps)) {
      if (queryResult.data) {
        const val = params.statePopulator(queryResult.data);
        _setVal(val);
        _setLastResetDeps(params.resetDeps);
      }
    }
  }, [
    queryResult.data,
    _val,
    params.statePopulator,
    JSON.stringify(params.resetDeps),
  ]);

  return {
    data: _val,
    updater,
    queryResult,
  };
}
