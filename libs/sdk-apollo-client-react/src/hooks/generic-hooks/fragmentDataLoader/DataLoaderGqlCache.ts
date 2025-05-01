import DataLoader from 'dataloader';
import { DocumentNode } from 'graphql';

import {
  ApolloClient,
  OperationVariables,
} from '@apollo/client';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

import {
  QueryManyPages,
  QueryManyPagesExtendedOptions,
} from '../useQueryManyPages';

/** This is a singleton that will store many instances of dataloader. They will be individually keyed based on:
 * 1. The query being used
 * 2. The structure of the variables being used
 *
 *
 * WARNING: The `queryManyPagesOpts` will be ignored when creating the hash key.
 * This means that if you use the same query with queryManyPagesOpts, you will get the same dataloader.
 * Thus, when calling this function -- if you have any plan to paginate the query in the future,
 * you should pass in the appropriate queryManyPagesOpts.
 *
 * WARNING 2: The variables function will be stringified when creating the hash key.
 * This means that the same function with a different string representation will be
 * treated as a different function.
 *
 */
export class DataLoaderGqlCache {
    private static loaders: { [hashkey: string]: DataLoader<string, { id: string; status: "fetched" | "failed" }> } =
        {};
    static getDataLoader<TResult, TVars extends OperationVariables>(
        client: ApolloClient<any>,
        batchQuery: DocumentNode | TypedDocumentNode<TResult, TVars>,
        createBatchVarsForKeys: (keys: readonly string[]) => any,
        queryManyPagesOpts?: QueryManyPagesExtendedOptions<TResult, TVars>,
    ) {
        // TODO: Use the variable path to also create a hash key.
        const hashKey = JSON.stringify({ q: batchQuery, vf: createBatchVarsForKeys.toString() });

        if (!this.loaders[hashKey]) {
            this.loaders[hashKey] = new DataLoader<string, { id: string; status: "fetched" | "failed" }>(
                async (ids) => {
                    const result = await (queryManyPagesOpts
                        ? // If we have queryManyOpts, query many pages.
                          QueryManyPages(client, {
                              query: batchQuery,
                              variables: createBatchVarsForKeys(ids),
                              // TODO this is an arbitrary number...
                              maxPages: 30,
                              ...queryManyPagesOpts,
                              // Network only here because this is not supposed to consider the cache.
                              fetchPolicy: "network-only",
                          })
                        : // If we don't have queryManyOpts, just query once.
                          client.query({
                              query: batchQuery,
                              variables: createBatchVarsForKeys(ids),
                              // Network only here because this is not supposed to consider the cache.
                              fetchPolicy: "network-only",
                          }));

                    if (result.errors) {
                        throw result.errors;
                    } else {
                        // We intentionally do not return the value of the query here,
                        // because we want the user to use the Apollo Client cache to get the data.
                        // This improves memory footprint, because we are not double-storing data
                        // in both the Apollo Client cache and in this dataloader.
                        return ids.map((thisId) => ({ id: thisId, status: "fetched" }));
                    }
                },
                {
                    batchScheduleFn: (cb) => setTimeout(cb, 100),
                },
            );
        }

        return this.loaders[hashKey];
    }
}
