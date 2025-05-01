import _ from 'lodash';

import {
  ApolloCache,
  ApolloClient,
  RefetchQueriesInclude,
  RefetchQueriesOptions,
  TypedDocumentNode,
} from '@apollo/client';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  createSimpleLogger,
  Unarray,
} from '@reasonote/lib-utils';

import { ApolloCacheWatcher } from './ApolloCacheWatcher';

export interface ApolloEntitySynchConstructorProps<TCacheShape> {
    getClient: () => ApolloClient<TCacheShape>;
}

export interface IEntityChangeUserData {
    entityName: string;
    entityId: string;
}

export interface EntityChangeCreate<T, TUserData extends IEntityChangeUserData> {
    id: string;
    type: "CREATE";
    entity: T;
    userData?: TUserData;
}

export interface EntityChangeUpdate<T, TUserData extends IEntityChangeUserData> {
    id: string;
    type: "UPDATE";
    entity: T;
    userData?: TUserData;
}

export interface EntityChangeDelete<T, TUserData extends IEntityChangeUserData> {
    id: string;
    type: "DELETE";
    userData?: TUserData;
}

export type EntityChange<T, TUserData extends IEntityChangeUserData> =
    | EntityChangeCreate<T, TUserData>
    | EntityChangeDelete<T, TUserData>
    | EntityChangeUpdate<T, TUserData>;

export interface RefetchQueryWithVariablesConfig<
    TRefetchResult,
    TRefetchVars,
    TUserData extends IEntityChangeUserData,
> {
    refetchQuery: TypedDocumentNode<TRefetchResult, TRefetchVars>;
    refetchVarsFromSubResult: (result: EntityChange<TRefetchResult, TUserData>) => TRefetchVars;
}

export function isRefetchQueryWithVariablesConfig<
    TRefetchResult,
    TRefetchVars,
    TUserData extends IEntityChangeUserData,
>(config: any): config is RefetchQueryWithVariablesConfig<TRefetchResult, TRefetchVars, TUserData> {
    return (
        (config as RefetchQueryWithVariablesConfig<TRefetchResult, TRefetchVars, TUserData>).refetchQuery !== undefined
    );
}

export interface RefetchQueriesOptionsWithInclude<TRefetchResult extends ApolloCache<any>, TRefetchVars>
    extends RefetchQueriesOptions<TRefetchResult, TRefetchVars> {
    include: RefetchQueriesInclude;
}

export type RefetchQueryConfig<
    TRefetchResult extends ApolloCache<any>,
    TRefetchVars,
    TUserData extends IEntityChangeUserData,
> =
    | RefetchQueryWithVariablesConfig<TRefetchResult, TRefetchVars, TUserData>
    | Unarray<RefetchQueriesInclude>
    | RefetchQueriesOptionsWithInclude<TRefetchResult, TRefetchVars>;

export function isRefetchQueriesOptionsWithInclude<TRefetchResult extends ApolloCache<any>, TRefetchVars>(
    config: any,
): config is RefetchQueriesOptionsWithInclude<TRefetchResult, TRefetchVars> {
    return (config as RefetchQueriesOptions<TRefetchResult, TRefetchVars>).include !== undefined;
}

export interface IApolloEntitySynchListener<
    TSubResult,
    TRefetchResult,
    TRefetchVars,
    TUserData extends IEntityChangeUserData,
> {
    /**
     * The function that will be called when an entity we're tracking is changed in the local cache.
     * @param ids
     * @param next
     * @returns
     */
    onLocalCacheItemsChanged: (
        ids: string[],
        next: (result: EntityChange<TSubResult, TUserData>) => any,
    ) => Promise<any>;

    // TODO ensure that refetch query
    changeStrategy: {
        type: "refetch-strategy";

        /**
         * Whether or not the refetch query should be executed.
         * @param result The
         * @returns
         */
        shouldRefetch: (result: EntityChange<TSubResult, TUserData>) => boolean;

        /**
         * This is a graphql query. This query MUST, when executed, populate the apollo client cache with the fragment specified in the useFragOptions.
         *
         * TODO: ensure that refechquery will always populate the correct cache area.
         * */
        refetchQueries: RefetchQueryConfig<any, any, any>[];
    };
}

/**
 * Takes the synchronizers applied to it and synchronizes that entity by
 * modifying the cache when the change listener provides an update.
 */
export class ApolloEntitySynch<TListenResult, TRefetchResult, TRefetchVars, TUserData extends IEntityChangeUserData> {
    _cacheWatcher: ApolloCacheWatcher = new ApolloCacheWatcher({ getClient: () => this._apolloClient });

    constructor(readonly constructorProps: ApolloEntitySynchConstructorProps<Record<string, any>>) { }

    private get _apolloClient() {
        return this.constructorProps.getClient();
    }

    private _logger = createSimpleLogger("ApolloEntitySynch");

    /**
     * The entity listeners that are active.
     *
     * @private
     *
     * @property {<{ [key: string]: U }}
     */
    private _entityChangeListeners: {
        [entityName: string]: {
            listeners: {
                listener: IApolloEntitySynchListener<TListenResult, TRefetchResult, TRefetchVars, TUserData>;
            }[];
        };
    } = {};

    /**
     * Starts the interval timer that watches the Apollo Client cache for the
     * ids of the provided entities and passes them to the change listener.
     *
     * We could start it automatically in the constructor but we'll keep it
     * in a separate method for now to have more control.
     */
    start() {
        this._cacheWatcher.start();
    }

    /**
     * Stops the interval timer that watches the Apollo Client cache.
     */
    stop() {
        this._cacheWatcher.stop();
    }

    /**
     * Adds an entity to be synched to the Apollo client cache.
     *
     * @param {string} entityName The name of the entity to synch. This is case sensitive so make sure it matches the name of the entity exactly.
     * @param {{ new(signalrURL: string): U } & U} entityChangeListener The change listener to use to listen for changes for the entity.
     *
     * @example
     * instance.addEntityToSynch("Organization", OrganizationChangeListener);
     */
    addEntityToSynch(
        entityName: string,
        listener: IApolloEntitySynchListener<TListenResult, TRefetchResult, TRefetchVars, TUserData>,
    ) {
        if (!this._entityChangeListeners[entityName]) {
            this._entityChangeListeners[entityName] = {
                listeners: [
                    {
                        listener,
                    },
                ],
            };
        } else {
            this._entityChangeListeners[entityName].listeners.push({
                listener,
            });
        }

        this._cacheWatcher.addListener({
            shouldTrackCacheItem: (cacheKey, cacheItem) => {
                return cacheKey.split(":")[0] === entityName;
            },
            cacheItemDiffer: (prev, cur) => {
                return prev !== cur;
            },
            onCacheItemsChanged: async (changes) => {
                const ids = changes.map((c) =>
                    c.change === "INSERT" || c.change === "UPDATE" ? c.new.key.split(":")[1] : c.old.key.split(":")[1],
                );

                listener.onLocalCacheItemsChanged(ids, async (change) => {
                    this._logger.debug(`[${entityName}]: Got change:`, change);
                    // TODO: Handle delete.
                    if (change.type === "CREATE" || change.type === "UPDATE") {
                        const allRefetchQueries = listener.changeStrategy.refetchQueries;

                        allRefetchQueries.map(async (rq) => {
                            // If it's a refetch query with variables config, then we need to get the variables from the sub result.
                            if (isRefetchQueryWithVariablesConfig(rq)) {
                                const q = {
                                    query: rq.refetchQuery,
                                    variables: rq.refetchVarsFromSubResult(change),
                                    fetchPolicy: "network-only" as const,
                                    nextFetchPolicy: "network-only" as const,
                                };
                                this._logger.debug(`[${entityName}]: Sending refetch query:`, q);
                                try {
                                    await this._apolloClient.query(q);
                                } catch (e: any) {
                                    this._logger.error("Error Encountered sending apollo query:", e);
                                }
                            }
                            // If it's just a normal refetch queries object, we can run Apollo Client's refetchQueries method directly.
                            else if (isRefetchQueriesOptionsWithInclude(rq)) {
                                await this._apolloClient.refetchQueries(rq);
                            }
                            // If it's anything else, we just pass it through to the refetchQueries method as an array of include statements.
                            else {
                                await this._apolloClient.refetchQueries({
                                    include: [rq],
                                });
                            }
                        });
                    } else if (change.type === "DELETE") {
                        /**
                         * if a change object doesn't have an
                         * id there isn't much we can do so we do nothing.
                         */
                        if (change.id) {
                            /**
                             * if the change object has userData then
                             * we handle updating based on the userData
                             * since that is a custom condition. Otherwise,
                             * on a standard update/delete the userData prop
                             * will be undefined which means we should update the
                             * to level object.
                             */
                            const needsGarbageCollection = change.userData
                                ? this._apolloClient.cache.evict({
                                    id: `${change.userData.entityName}:${change?.userData?.entityId}`,
                                })
                                : this._apolloClient.cache.evict({ id: `${entityName}:${change.id}` });

                            /** run cache garbage collection */
                            if (needsGarbageCollection) this._apolloClient.cache.gc();
                        }
                    }
                });
            },
        });
    }
}
