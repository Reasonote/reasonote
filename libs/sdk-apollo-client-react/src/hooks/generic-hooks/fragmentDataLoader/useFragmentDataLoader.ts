import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DocumentNode,
  OperationDefinitionNode,
} from 'graphql';
import _ from 'lodash';

import {
  ApolloError,
  getApolloContext,
  NetworkStatus,
  OperationVariables,
  UseFragmentOptions,
} from '@apollo/client';
import { MissingTree } from '@apollo/client/cache';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { createSimpleLogger } from '@reasonote/lib-utils';
import { useAsyncEffect } from '@reasonote/lib-utils-frontend';

import { useFragmentSafe } from '../useFragmentSafe';
import { QueryManyPagesExtendedOptions } from '../useQueryManyPages';
import { DataLoaderGqlCache } from './DataLoaderGqlCache';
import { isOperationDefinitionNode } from './models';

export interface UseFragmentDataLoaderOptions<TFragData, TFragVars, TBatchData, TBatchVars> {
    /** These are options passed to the `useFragment` call underneath. */
    useFragOptions: UseFragmentOptions<TFragData, TFragVars> & {
        from: { __typename: string; id: string | undefined | null };
        fragmentName: string;
    };
    /** This is a graphql query. This query MUST, when executed, populate the apollo client cache with the fragment specified in the useFragOptions. */
    batchQuery: DocumentNode | TypedDocumentNode<TBatchData, TBatchVars>;
    /** This is a function which will take a list of ids, and convert them into a single variable object which will be fed into the batchQuery.
     * For example, if the batchQuery is:
     * ```
     * query SpacesFiltered($filter: SpaceFilterInput!) {
     *    spacesFiltered(filter: $filter) {
     *       edges {
     *         node {
     *         ...SpaceFlatFrag
     *        }
     *     }
     * }
     * ```
     *
     * Then the createBatchVarsForKeys function would be:
     * ```
     * (ids) => {
     *   return {
     *    filter: {
     *     id: {in: ids},
     *   },
     * };
     * ```
     */
    createBatchVarsForKeys: (ids: readonly string[]) => TBatchVars;
    /**
     * If this is a paginated query (most are) then you should set the options
     * that will be used to iteratively fetch more pages for this query.
     */
    queryManyPagesOpts?: QueryManyPagesExtendedOptions<TBatchData, TBatchVars>;

    /** Provide configuration for retrying if this load didn't work. */
    retryStrategy?: {
        type: "poll-simple";
        /** The number of milliseconds to wait before retrying. */
        retryDelayMs: number;
        /** The maximum number of retries. */
        maxRetries: number;
    };
}

export interface UseFragmentDataLoaderResult<TData> {
    data: TData | undefined;
    error: ApolloError | undefined;
    loading: boolean;
    networkStatus: NetworkStatus;
    complete: boolean;
    missing: MissingTree | undefined;
    refetch: () => Promise<void>;
}

const deepDebug = false;
const uniqueFragmentDataLoaderNames = true;
export function useFragmentDataLoader<TFragData, TFragVars, TBatchData, TBatchVars extends OperationVariables>(
    opts: UseFragmentDataLoaderOptions<TFragData, TFragVars, TBatchData, TBatchVars>,
): UseFragmentDataLoaderResult<TFragData> {
    // Unload ops into variables.
    const { batchQuery, createBatchVarsForKeys, queryManyPagesOpts, useFragOptions, retryStrategy } = opts;
    const entityCachePrefix = opts.useFragOptions.from.__typename;
    const theId = opts.useFragOptions.from.id;
    const { fragmentName } = useFragOptions;

    // This is just setting up objects we'll use later.
    const logger = useMemo(() => {
        const logTag = `useFragmentDataLoader:${entityCachePrefix}(Frag:${fragmentName},Id:${theId})`;
        return createSimpleLogger(uniqueFragmentDataLoaderNames ? logTag : "useFragmentDataLoader");
    }, [theId, entityCachePrefix, fragmentName]);

    const batchQueryNames = useMemo(() => {
        const queryDefinitions: OperationDefinitionNode[] = batchQuery.definitions.filter(isOperationDefinitionNode);

        return queryDefinitions?.map((qd) => qd.name?.value);
    }, [batchQuery?.definitions]);

    const { client: apolloClient } = useContext(getApolloContext());
    const [
        /** Whether or not we have already tried to fetch this item with our batch data loader. */
        hasAddedToBatch,
        /** Sets whether or not we have already tried to fetch this item with our batch data loader. */
        setHasAddedToBatch,
    ] = useState(false);

    /** Are we currently refetching after a failed attempt? */
    const [failureRefetchState, setFailureRefetchState] = useState<{
        isFailureRefetching: boolean;
        failureRefetchTries: number;
    }>({ isFailureRefetching: false, failureRefetchTries: 0 });

    const [batchHasFetched, setBatchHasFetched] = useState(false);

    const [networkStatus, setNetworkStatus] = useState(NetworkStatus.loading);

    const [_error, _setError] = useState<ApolloError | undefined>(undefined);

    // If the ID changes, we need to reset everything.
    useEffect(() => {
        deepDebug ?? logger.debug(`${theId} changed, resetting everything.`);
        setNetworkStatus(NetworkStatus.loading);
        _setError(undefined);
        setBatchHasFetched(false);
        setHasAddedToBatch(false);
    }, [batchQueryNames, logger, theId]);

    // First we, try to get the fragment from the local cache.
    // If another query has already returned this entity, then we will get it from the cache.
    const { data, complete, missing } = useFragmentSafe({
        ...opts.useFragOptions,
        canonizeResults: true,
    });

    // Define the fetchBatch function. It is async, so we must define it, and *then* call it.
    const fetchBatch = useCallback(
        async ({ clearCacheBeforeLoad }: { clearCacheBeforeLoad: boolean } = { clearCacheBeforeLoad: false }) => {
            if (apolloClient && theId) {
                // Add this id to the batch.
                try {
                    const queryDefinitions: OperationDefinitionNode[] =
                        batchQuery.definitions.filter(isOperationDefinitionNode);

                    // We get the dataloader for this type of query from our dataloader cache.
                    // This is a special cache of dataloaders, one for each type of query.
                    const dl = DataLoaderGqlCache.getDataLoader(
                        apolloClient,
                        batchQuery,
                        createBatchVarsForKeys,
                        queryManyPagesOpts,
                    );

                    logger.debug(
                        `Missing Local Fragment: '${useFragOptions.fragmentName}' on '${entityCachePrefix}:${theId}'. Asking DataLoader for Batched query: '${queryDefinitions[0].name?.value}' to populate it.`,
                    );

                    if (clearCacheBeforeLoad) {
                        await dl.clear(theId);
                    }

                    // Finally, we actually fetch this item from the batch.
                    const result = await dl.load(theId);

                    if (result.status === "failed") {
                        logger.debug(
                            `Error fetching: '${useFragOptions.fragmentName}' on '${entityCachePrefix}:${theId}' using Dataloader-Batched query: '${queryDefinitions[0].name?.value}'.`,
                        );
                    } else {
                        logger.debug(
                            `Successfully fetched: '${useFragOptions.fragmentName}' on '${entityCachePrefix}:${theId}' using Dataloader-Batched query: '${queryDefinitions[0].name?.value}'.`,
                        );
                    }

                    setBatchHasFetched(true);
                } catch (err: any) {
                    // TODO if something goes wrong, set the error.
                    logger.error(`Issue in fetchBatch for id: ${theId}`, err);
                    _setError(new ApolloError({ networkError: err }));
                }
            }
        },
        [
            apolloClient,
            batchQuery,
            createBatchVarsForKeys,
            entityCachePrefix,
            logger,
            queryManyPagesOpts,
            theId,
            useFragOptions.fragmentName,
        ],
    );

    useEffect(() => {
        // If we haven't already tried to fetch this item with our batch data loader,
        // and we haven't already fetched the item,
        // and we have an apollo client, then add this item to the dataloader batch.
        if (theId && !hasAddedToBatch && !complete && apolloClient) {
            // We mark this item as having been added to the batch.
            setHasAddedToBatch(true);
            // Call the batch function.
            fetchBatch();
        }
    }, [
        complete,
        apolloClient,
        hasAddedToBatch,
        batchQuery,
        createBatchVarsForKeys,
        theId,
        logger,
        queryManyPagesOpts,
        useFragOptions,
        data,
        entityCachePrefix,
        fetchBatch,
    ]);

    useEffect(() => {
        if (complete) {
            setNetworkStatus(NetworkStatus.ready);
        }
    }, [complete]);

    // If
    const error = useMemo(() => {
        // If we already have an error, go with that.
        if (_error) return _error;
        
        // If we have fetched the batch, but the complete is false, then we have an error.
        // This is probably because the user's query did not correctly
        // populate the Apollo Client cache with the fragment.
        if (batchHasFetched && !complete) {
            return new ApolloError({
                networkError: new Error(
                    `Batch has fetched, but complete is false. This implies that (1) the batch query is not populating the apollo client cache correctly, or (2) (very unlikely) another process is deleting from cache very quickly. To fix this, make sure that the batch query is populating the cache with the fragment specified in the useFragmentDataLoader call. Missing: ${JSON.stringify(missing, null, 2)}, Data: ${JSON.stringify(data, null, 2)}`,
                ),
            });
        }

        return undefined;
    }, [_error, batchHasFetched, complete, missing]);

    useEffect(() => {
        const queriesStr = batchQueryNames.join(",");

        deepDebug ??
            logger.debug(
                `${useFragOptions.fragmentName
                }' on '${entityCachePrefix}:${theId}' (queries: ${queriesStr}) has data: ${JSON.stringify(
                    data,
                ).substring(0, 20)}..., status: '${networkStatus}' and error: '${error?.message}.`,
            );
    }, [
        batchQueryNames,
        data,
        entityCachePrefix,
        error?.message,
        logger,
        networkStatus,
        theId,
        useFragOptions.fragmentName,
    ]);

    // Handle retries.
    useAsyncEffect(async () => {
        if (
            batchHasFetched &&
            !complete &&
            retryStrategy &&
            retryStrategy.type === "poll-simple" &&
            !failureRefetchState.isFailureRefetching &&
            failureRefetchState.failureRefetchTries < 5
        ) {
            logger.debug(
                `Refetching due to failure (Attempt ${failureRefetchState.failureRefetchTries + 1} / ${retryStrategy.maxRetries
                })...`,
            );

            setFailureRefetchState({
                isFailureRefetching: true,
                failureRefetchTries: failureRefetchState.failureRefetchTries + 1,
            });

            try {
                await fetchBatch({ clearCacheBeforeLoad: true });
            } catch (err: any) {
                console.error("Error refetching annotation", err);
            } finally {
                setFailureRefetchState({
                    ...failureRefetchState,
                    isFailureRefetching: false,
                });
            }
        }
    }, [complete, failureRefetchState, fetchBatch, batchHasFetched]);

    const completeRet = theId ? complete : true;

    return {
        data,
        loading: (!completeRet && !error),
        error,
        networkStatus,
        complete: completeRet,
        missing,
        refetch: () => fetchBatch({ clearCacheBeforeLoad: true }),
    };
}
