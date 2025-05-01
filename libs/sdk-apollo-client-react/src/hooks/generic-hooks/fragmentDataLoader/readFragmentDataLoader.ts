import _ from 'lodash';

import {
  ApolloClient,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
// import dataloader from the 'dataloader' package
import { ApolloError } from '@apollo/client/errors';
import { createSimpleLogger } from '@reasonote/lib-utils';

import { QueryManyPagesExtendedOptions } from '../useQueryManyPages';
import { DataLoaderGqlCache } from './DataLoaderGqlCache';

type ItemOrArray<T> = T | T[];

export interface ReadFragmentDataLoaderOptions<
    TFragData,
    TFragVars,
    TBatchData,
    TBatchVars extends OperationVariables,
    TIds extends ItemOrArray<string>,
> {
    /** The apollo client to use to fetch either from the local cache, or from remotely if necessary.*/
    apolloClient: ApolloClient<any>;
    /** The prefix of the entity in the apollo client cache. */
    entityCachePrefix: string;
    /** A single ID OR a list of ids to fetch, trying the following sources in order:
     *
     * 1. from the Apollo Client cache (via `apolloClient.readFragment({id: `${entityCachePrefix}:${id}`, fragment: fragmentDoc})`
     *
     * 2.  from remotely (via `batchQuery`) if necessary.  */
    ids: TIds;
    /** The shape of the graphql fragment document to fetch from the cache. */
    fragmentDoc: DocumentNode | TypedDocumentNode<TFragData, TFragVars>;
    /** The name of the fragment. */
    fragmentName: string;
    /** The batched graphql query to run if the fragment is not found locally. This MUST return data in the shape of `fragmentDoc` specified above. */
    batchQuery: DocumentNode | TypedDocumentNode<TBatchData, TBatchVars>;
    /** A function which will, given a list of ids, create a variables object to be passed to `batchQuery` provided above. */
    createBatchVarsForKeys: (ids: readonly string[]) => TBatchVars;
    /**
     * If this is a paginated query (most are) then you should set the options
     * that will be used to iteratively fetch more pages for this query.
     */
    queryManyPagesOpts?: QueryManyPagesExtendedOptions<TBatchData, TBatchVars>;

    /**
     * If true, then the cache will be bypassed and the data will be fetched from the server.
     */
    forceRefetch?: boolean;
}

export interface ReadFragmentDataLoaderResultSuccess<TData> {
    id: string;
    data: TData;
    error: undefined;
}

export interface ReadFragmentDataLoaderResultFailure {
    id: string;
    data: undefined;
    error: ApolloError;
}

export type ReadFragmentDataLoaderResult<TData> =
    | ReadFragmentDataLoaderResultSuccess<TData>
    | ReadFragmentDataLoaderResultFailure;

const deepDebug = false;

/**
 * A function which will read a fragment from the local cache, or from remotely if necessary, using the options provided.
 * @export
 * @template TData The type of the data returned by the fragment.
 * @template TVars The type of the variables used by the fragment.
 * @template TBatchVars The type of the variables used by the batch query.
 * @param {ReadFragmentDataLoaderOptions<TData, TVars, TBatchVars>} {apolloClient, cacheId, batchQuery, fragmentDoc, createBatchVarsForKeys}
 * @return {*}  {(Promise<TData | null>)}
 */
export async function readFragmentDataLoader<
    TFragData,
    TFragVars,
    TBatchData,
    TBatchVars extends OperationVariables,
    TCacheIds extends string | string[],
>({
    apolloClient,
    entityCachePrefix,
    ids,
    batchQuery,
    fragmentDoc,
    fragmentName,
    createBatchVarsForKeys,
    queryManyPagesOpts,
    forceRefetch,
}: ReadFragmentDataLoaderOptions<TFragData, TFragVars, TBatchData, TBatchVars, TCacheIds>): Promise<
    TCacheIds extends string[] ? ReadFragmentDataLoaderResult<TFragData>[] : ReadFragmentDataLoaderResult<TFragData>
> {
    const logger = createSimpleLogger("readFragmentDataLoader");
    const deepDebug = false;
    const arrIds: string[] = _.isArray(ids) ? ids : [ids];
    if (_.some(arrIds, (id) => id === undefined || id === null)) {
        throw new Error("All cacheIds must have a valid, non-null, id.");
    }

    try {
        // Get dataloader.
        const dl = DataLoaderGqlCache.getDataLoader(
            apolloClient,
            batchQuery,
            createBatchVarsForKeys,
            queryManyPagesOpts,
        );

        logger.debug(`Asking DataloaderGqlCache for ${arrIds.length} ids for: ${entityCachePrefix}.`);

        // First, we get all fragResults.
        const fragResults = await Promise.all(
            arrIds.map(async (id) => {
                if (!id) {
                    throw new Error(`Invalid cacheId passed: ${id}`);
                }

                // First, we check if we already have this in our fragments.
                // If we do, then we return it immediately.
                const resultReadFragment = apolloClient.readFragment({
                    id: `${entityCachePrefix}:${id}`,
                    fragment: fragmentDoc,
                    fragmentName,
                });

                if (resultReadFragment) {
                    return {
                        id,
                        data: resultReadFragment,
                        error: undefined,
                    };
                } else {
                    return {
                        id,
                        error: new ApolloError({ networkError: new Error("No data found in cache for this id.") }),
                    };
                }
            }),
        );

        const afterDataLoad = await Promise.all(
            fragResults.map(async (fr) => {
                // Return anything that already has data, as is.
                if (fr.data) {
                    return fr;
                }

                // If we're supposed to clear the dataloader out, then do so.
                if (forceRefetch) {
                    dl.clear(fr.id);
                }

                // We didn't have data, so we need to load this one.
                // Dataloader batches, so this is still performant.
                const result = await dl.load(fr.id);

                logger.debug(`dataloader result for ${entityCachePrefix}|${fr.id} was: `, result);

                // Try to load one more time from readfragment. This is local-only, so it should be very fast.
                const afterLoadReadFragment = apolloClient.readFragment({
                    id: `${entityCachePrefix}:${fr.id}`,
                    fragment: fragmentDoc,
                    fragmentName,
                });

                if (afterLoadReadFragment) {
                    return {
                        id: fr.id,
                        data: afterLoadReadFragment,
                        error: undefined,
                    };
                } else {
                    const errMsg = `ISSUE: Batch load succeeded but readFragment failed (${fragmentName} on ${entityCachePrefix}:${fr.id}). This implies that the batch query is not populating the apollo client cache correctly. To fix this, (1) make sure that the batch query is populating the cache with the fragment specified in the readFragmentDataLoader call, (2) make sure that the entity you're requesting exists in the database.`;
                    logger.debug(errMsg);
                    return {
                        id: fr.id,
                        data: undefined,
                        error: new ApolloError({ networkError: new Error(errMsg) }),
                    };
                }
            }),
        );

        //If the original input was not an array, we return the first element.
        if (!_.isArray(ids)) {
            const v = afterDataLoad[0];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            return v;
        }
        // Else, we return the whole array.
        else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            return afterDataLoad;
        }
    } catch (err: any) {
        logger.error(`error fetching ${arrIds.length} ids for: ${entityCachePrefix}.`, err);
        console.error(err);
        if (_.isArray(ids)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            return ids.map((id) => ({
                id,
                data: undefined,
                error: new ApolloError({ networkError: err }),
            }));
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            return {
                id: ids[0],
                data: undefined,
                error: new ApolloError({ networkError: err }),
            };
        }
    }
}
