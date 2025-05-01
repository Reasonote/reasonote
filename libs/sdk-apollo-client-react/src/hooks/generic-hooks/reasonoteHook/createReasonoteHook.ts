import { ApolloError } from '@apollo/client';

export interface ReasonoteHookResultLoading<T> {
    data: T | undefined;
    loading: true;
    error: any;
}

export interface ReasonoteHookResultError<T> {
    data: T | undefined;
    loading: false;
    error: Error | ApolloError;
}

export interface ReasonoteHookResultComplete<T> {
    data: T;
    loading: false;
    error: undefined;
}

export type ReasonoteHookResult<TData> =
    | ReasonoteHookResultLoading<TData>
    | ReasonoteHookResultError<TData>
    | ReasonoteHookResultComplete<TData>;

/**
 * Simply ensures that the hook conforms to the type ReasonoteHookResult.
 *
 * @param f
 * @returns
 */
export function createReasonoteHook<TParams extends any[], TData>(
    f: (...rest: TParams) => ReasonoteHookResult<TData>,
): (...rest: TParams) => ReasonoteHookResult<TData> {
    return f;
}
