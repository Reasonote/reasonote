import _ from 'lodash';

import {
  ApolloClient,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
  UseFragmentOptions,
} from '@apollo/client';

import { QueryManyPagesExtendedOptions } from '../useQueryManyPages';
import {
  readFragmentDataLoader,
  ReadFragmentDataLoaderResult,
} from './readFragmentDataLoader';
import {
  useFragmentDataLoader,
  UseFragmentDataLoaderOptions,
} from './useFragmentDataLoader';

export interface CreateFragmentDataLoadersOptions<TFragData, TFragVars, TBatchData, TBatchVars extends OperationVariables> {
    /** Constructs an apollo client cache key from the id. If looking at the Apollo Client cache, and seeing `EntityTypename:Id`, this is the `EntityTypename` portion. */
    entityCachePrefix: string;
    /** The shape of the graphql fragment document to fetch from the cache. */
    fragmentDoc: DocumentNode | TypedDocumentNode<TFragData, TFragVars>;
    /** The name of the fragment to use. */
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
}

/**
 * Creates Fragment Data loaders -- hook, and promise-based -- for a fragment with the correct options.
 * @param opts
 * @returns {FragLoader: }
 */
export function createFragmentDataLoaders<TFragData, TFragVars, TBatchData, TBatchVars extends OperationVariables>(
    opts: CreateFragmentDataLoadersOptions<TFragData, TFragVars, TBatchData, TBatchVars>,
) {
    const FragLoader = <TKeys extends string | string[]>(
        apolloClient: ApolloClient<any>,
        keys: TKeys,
        { forceRefetch } = { forceRefetch: false },
    ) => {
        return readFragmentDataLoader({
            apolloClient,
            entityCachePrefix: opts.entityCachePrefix,
            ids: keys,
            fragmentDoc: opts.fragmentDoc,
            fragmentName: opts.fragmentName,
            batchQuery: opts.batchQuery,
            createBatchVarsForKeys: opts.createBatchVarsForKeys,
            queryManyPagesOpts: opts.queryManyPagesOpts,
            forceRefetch,
        }) as Promise<
            TKeys extends string[] ? ReadFragmentDataLoaderResult<TFragData>[] : ReadFragmentDataLoaderResult<TFragData>
        >;
    };
    const useFragLoader = (
        key: string | undefined | null,
        useFragOpts?: Partial<UseFragmentOptions<TFragData, TFragVars>>,
        useFragLoaderOpts?: Partial<UseFragmentDataLoaderOptions<TFragData, TFragVars, TBatchData, TBatchVars>>,
    ) => {
        return useFragmentDataLoader({
            ...useFragLoaderOpts,
            useFragOptions: {
                ...useFragOpts,
                fragment: opts.fragmentDoc,
                fragmentName: opts.fragmentName,
                from: {
                    __typename: opts.entityCachePrefix,
                    id: key,
                },
            },
            batchQuery: opts.batchQuery as any,
            createBatchVarsForKeys: opts.createBatchVarsForKeys,
            queryManyPagesOpts: opts.queryManyPagesOpts,
        });
    };

    return {
        FragLoader,
        useFragLoader,
    };
}
