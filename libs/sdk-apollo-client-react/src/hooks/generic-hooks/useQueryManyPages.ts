import {
  useEffect,
  useState,
} from 'react';

import _ from 'lodash';

import {
  ApolloClient,
  ApolloQueryResult,
  DocumentNode,
  OperationVariables,
  QueryHookOptions,
  QueryOptions,
  TypedDocumentNode,
  useQuery,
} from '@apollo/client';

export interface RelayPageInfo {
    hasNextPage?: boolean;
    endCursor?: string | null;
    startCursor?: string | null;
    hasPreviousPage?: boolean;
}

export interface RelayPaginatedQueryData {
    pageInfo: RelayPageInfo;
}

export interface RelayPaginatedQueryResult<TData extends RelayPaginatedQueryData> {
    [key: string]: {
        edges: TData[];
    };
}

export interface RelayQueryManyPagesExtendedOptions<TData> {
    queryManyType: "relay";
    getRelayPageInfo: (data: TData) => RelayPageInfo | undefined;
}

export interface GenericQueryManyPagesExtendedOptions<TData, TVars> {
    queryManyType: "generic";
    shouldFetchMore: (data: TData) => boolean;
    getFetchMoreVariables: (data: TData) => TVars;
}

export type QueryManyPagesExtendedOptions<TData, TVars> =
    | RelayQueryManyPagesExtendedOptions<TData>
    | GenericQueryManyPagesExtendedOptions<TData, TVars>;

const thing: QueryManyPagesExtendedOptions<any, any> = {} as QueryManyPagesExtendedOptions<any, any>;

if (thing.queryManyType === "relay") {
    thing.getRelayPageInfo;
} else {
    thing.shouldFetchMore;
    thing.getFetchMoreVariables;
}

export type QueryManyPagesOptions<TResult, TVariables> = QueryOptions<TVariables, TResult> &
    QueryManyPagesExtendedOptions<TResult, TVariables> & {
        /** The maximum number of pages to fetch. */
        maxPages: number;
    };

export type GenericQueryManyPagesOptions<TResult, TVariables> = QueryOptions<TVariables, TResult> &
    GenericQueryManyPagesExtendedOptions<TResult, TVariables> & {
        /** The maximum number of pages to fetch. */
        maxPages: number;
    };

function generifyQueryManyPagesExtendedOptions<TData, TVars>(
    opts: QueryManyPagesExtendedOptions<TData, TVars>,
): GenericQueryManyPagesExtendedOptions<TData, TVars> {
    if (opts.queryManyType === "generic") {
        return opts;
    } else {
        return {
            ...opts,
            queryManyType: "generic",
            shouldFetchMore: (data: TData) => !!opts.getRelayPageInfo(data)?.hasNextPage,
            getFetchMoreVariables: (data: TData) => ({ after: opts.getRelayPageInfo(data)?.endCursor } as TVars),
        };
    }
}

/**
 * This is a function which will query a GraphQL endpoint multiple times to get several pages of data.
 *
 * The promise will only resolve once all the data has been fetched.
 *
 * @param ac The apollo client to use.
 * @param {QueryManyPagesOptions} opts  The options to use.
 * @returns
 */
export async function QueryManyPages<TResult, TVariables extends OperationVariables>(
    ac: ApolloClient<any>,
    opts: QueryManyPagesOptions<TResult, TVariables>,
) {
    const ret = new Promise<ApolloQueryResult<TResult>>((resolve, reject) => {
        const obsQuery = ac.watchQuery({
            ...opts,
        });

        let numPagesFetched = 1;

        // If it's a generic fetch more options, we will use that.
        const { shouldFetchMore, getFetchMoreVariables } = generifyQueryManyPagesExtendedOptions(opts);

        obsQuery.subscribe({
            next: (result) => {
                // If we have more data, we need to fetch it up to our limit.
                if (shouldFetchMore(result.data) && numPagesFetched < opts.maxPages) {
                    numPagesFetched++;
                    obsQuery.fetchMore({
                        variables: getFetchMoreVariables(result.data),
                    });
                } else {
                    resolve(obsQuery.getCurrentResult());
                }
            },
            error: (error) => {
                // If we ran into an error, we need to stop fetching more data.
                resolve(obsQuery.getCurrentResult());
            },
        });
    });

    return ret;
}

type QueryManyPagesHookOptions<TResult, TVariables extends OperationVariables> = QueryHookOptions<TResult, TVariables> &
    QueryManyPagesExtendedOptions<TResult, TVariables> & {
        /** The maximum number of pages to fetch. */
        maxPages: number;
        /** Whether we should wait for all results to arrive before returning. */
        waitForAllResults?: boolean;
    };

/**
 *
 * This is a not-very-performant hook which will query all pages on a paginated query.
 * @export
 * @template TResult The type of the query result.
 * @template TVariables The type of the query variables.
 * @param {(DocumentNode | TypedDocumentNode<TResult, TVariables>)} query The query to run.
 * @param {QueryManyPagesHookOptions<TResult, TVariables>} opts The options to use.
 * @return {*}
 */
export function useQueryManyPages<TResult, TVariables extends OperationVariables>(
    query: DocumentNode | TypedDocumentNode<TResult, TVariables>,
    opts: QueryManyPagesHookOptions<TResult, TVariables>,
) {
    // Use the query hook to fetch the first page of results
    const { data, loading, error, fetchMore, refetch } = useQuery<TResult, TVariables>(query, opts);

    const [pagesFetched, setPagesFetched] = useState(0);
    const [lastData, setLastData] = useState(data);

    const { shouldFetchMore, getFetchMoreVariables } = generifyQueryManyPagesExtendedOptions(opts);

    // If our data is different from last time, it means we have a new page. Update our count.
    useEffect(() => {
        if (!_.isEqual(data, lastData)) {
            setPagesFetched(pagesFetched + 1);
            setLastData(data);
        }
    }, [data, lastData, pagesFetched]);

    useEffect(() => {
        // If there is more data, fetch the next page
        if (data) {
            if (shouldFetchMore(data) && opts.maxPages > pagesFetched) {
                fetchMore({ variables: getFetchMoreVariables(data) });
            }
        }
    }, [data, fetchMore, getFetchMoreVariables, opts, pagesFetched, shouldFetchMore]);

    // We're loading if either:
    // 1. We are waiting for all results and we have more to fetch, or the underlying query is loading.
    // 2. We are not waiting for all results and the underlying query is loading.
    const retLoading = loading || !!(opts.waitForAllResults && data && shouldFetchMore(data));

    // We return data if either:
    // 1. We are NOT waiting for all results
    // 2. We are waiting for all results and we are not loading.
    const retData = opts.waitForAllResults ? (retLoading ? undefined : data) : data;

    // TODO: This should be done, but it's not working right now.
    // // We need to keep track of the last data we had, so we can return it if we're loading.
    // // Whenever we're not loading, we update the last returned data.
    // const [lastRetData, setLastRetData] = useState<TResult | undefined>(retData);
    // useEffect(() => {
    //     if (!retLoading && _.isEqual(retData, lastRetData)) {
    //         setLastRetData(retData);
    //     }
    // }, [retData, retLoading, lastRetData]);

    // If there is no data, return the loading and error states
    return {
        // data: loading ? lastRetData : retData,
        data: retData,
        loading: retLoading,
        error,
        refetch,
    };
}
