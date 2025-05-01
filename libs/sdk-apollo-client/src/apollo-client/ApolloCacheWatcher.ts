import _ from 'lodash';

import { ApolloClient } from '@apollo/client';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createSimpleLogger } from '@reasonote/lib-utils';

export interface ApolloCacheWatcherConstructorProps<TCacheShape> {
    getClient: () => ApolloClient<TCacheShape>;

    /**
     * The number of milliseconds to wait before polling the cache for changes.
     */
    cachePollIntervalMs?: number;
}

interface ApolloCacheWatcherCacheItemChangeObject<TFragment> {
    key: string;
    value: TFragment;
}

export interface ApolloCacheWatcherCacheItemChangeDelete<TFragment> {
    change: "DELETE";
    old: ApolloCacheWatcherCacheItemChangeObject<TFragment>;
}

export interface ApolloCacheWatcherCacheItemChangeInsert<TFragment> {
    change: "INSERT";
    new: ApolloCacheWatcherCacheItemChangeObject<TFragment>;
}

export interface ApolloCacheWatcherCacheItemChangeUpdate<TFragment> {
    change: "UPDATE";
    old: ApolloCacheWatcherCacheItemChangeObject<TFragment>;
    new: ApolloCacheWatcherCacheItemChangeObject<TFragment>;
}

export type ApolloCacheWatcherCacheItemChange<TFragment> =
    | ApolloCacheWatcherCacheItemChangeDelete<TFragment>
    | ApolloCacheWatcherCacheItemChangeInsert<TFragment>
    | ApolloCacheWatcherCacheItemChangeUpdate<TFragment>;

// TODO in the future, we should have another kind of listener,
// That can run a `readQuery` or `readFragment` to get its data.
// Ideally, this would be made possible by having a `watchFragment`
// alongside the existing `watchQuery`, but this does not currently exist.

export interface IApolloCacheWatcherListener<TFragment> {
    /**
     * Whether or not a cache item should be tracked.
     * This function should run very quickly.
     * @param cacheKey The key of the item in the cache.
     * @param cacheValue The value of the item in the cache.
     * @returns Whether or not this cache item should be tracked.
     */
    shouldTrackCacheItem: (cacheKey: string, cacheValue: any) => boolean;

    /**
     * This function determines if a cache item was locally updated, based on the previous and current values.
     * @param prev The last key / value of the cache item.
     * @param current The current key / value of the cache item.
     * @returns true if the cache Item should be considered changed, false otherwise.
     */
    cacheItemDiffer: (
        prev: ApolloCacheWatcherCacheItemChangeObject<TFragment>,
        current: ApolloCacheWatcherCacheItemChangeObject<TFragment>,
    ) => boolean;

    /**
     * The function that will be called when cache items have changed.
     * @param newItems
     * @param next
     * @returns
     */
    onCacheItemsChanged: (changedItems: ApolloCacheWatcherCacheItemChange<TFragment>[]) => Promise<any>;
}

/**
 * Takes the synchronizers applied to it and synchronizes that entity by
 * modifying the cache when the change listener provides an update.
 */
export class ApolloCacheWatcher {
    config: ApolloCacheWatcherConstructorProps<Record<string, any>>;
    constructor(readonly constructorConfig: ApolloCacheWatcherConstructorProps<Record<string, any>>) {
        this.config = _.merge({}, constructorConfig, { cachePollIntervalMs: 100 });
    }

    private get _apolloClient() {
        return this.config.getClient();
    }

    private _logger = createSimpleLogger("ApolloEntitySynchV2");

    /**
     * The id of the interval timer that watches the cache.
     *
     * @private
     *
     * @property {ReturnType<typeof setInterval>|undefined}
     */
    private _intervalTimerId: ReturnType<typeof setInterval> | undefined;

    /**
     * The cacheItemListeners that are active.
     *
     * @private
     *
     * @property {<{ [key: string]: U }>}
     */
    private _cacheItemListeners: {
        listener: IApolloCacheWatcherListener<any>;
        listenedCacheItems: { [key: string]: { prev: any } };
    }[] = [];

    /**
     * Starts the interval timer that watches the Apollo Client cache for the
     * ids of the provided entities and passes them to the change listener.
     *
     * We could start it automatically in the constructor but we'll keep it
     * in a separate method for now to have more control.
     */
    start() {
        this._intervalTimerId = setInterval(() => {
            // An array of all of the keys of the items in the Apollo client cache.
            // Note: This also contains ids that are not useful to us but are useful
            // to the cache so make sure to extract just what you need.
            const cacheItems: Record<string, any> = this._apolloClient.cache.extract();

            ////////////////////////////////////////////////////////////////
            // Handle CREATE and UPDATE
            Object.entries(cacheItems).forEach(([cacheKey, cacheValue]) => {
                this._cacheItemListeners.forEach((l) => {
                    const { listener, listenedCacheItems } = l;

                    // First, we have to see if we even care about this item.
                    if (listener.shouldTrackCacheItem(cacheKey, cacheValue)) {
                        // If we do care about this item, we need to check to see if it is new.
                        if (!listenedCacheItems[cacheKey]) {
                            // Handle CREATE
                            // If it is new, we need to add it to the list of items we are listening to.
                            listenedCacheItems[cacheKey] = {
                                prev: cacheValue,
                            };

                            listener.onCacheItemsChanged([
                                { change: "INSERT", new: { key: cacheKey, value: cacheValue } },
                            ]);
                        } else {
                            // It's not new. Perform a diff.
                            const prev = listenedCacheItems[cacheKey].prev;
                            const current = cacheValue;
                            if (listener.cacheItemDiffer(prev, current)) {
                                // Handle UPDATE
                                // Send the update to the listener.
                                listener.onCacheItemsChanged([
                                    {
                                        change: "UPDATE",
                                        new: { key: cacheKey, value: current },
                                        old: { key: cacheKey, value: prev },
                                    },
                                ]);
                                // Update prev value.
                                listenedCacheItems[cacheKey].prev = current;
                            }
                        }
                    }
                });
            });

            //////////////////////////////////////////////////////////////////
            // Handle DELETE
            // Now, for each listener, we need to check to see if any of the
            // subscribed ids either:
            // (1) No longer exist in the cache, or
            // (2) Are no longer matching our query.
            this._cacheItemListeners.forEach((l) => {
                const { listener, listenedCacheItems } = l;

                // For each of the items we are listening to, we need to check to see if it still exists.
                Object.entries(listenedCacheItems).forEach(([cacheKey, cacheItem]) => {
                    // If it doesn't exist OR we no longer think we should track it,
                    // we need to remove it from the list of items we are listening to,
                    // and send a DELETE.
                    if (!cacheItems[cacheKey] || !listener.shouldTrackCacheItem(cacheKey, cacheItems[cacheKey])) {
                        // Handle DELETE
                        // Send the delete to the listener.
                        listener.onCacheItemsChanged([
                            { change: "DELETE", old: { key: cacheKey, value: cacheItem.prev } },
                        ]);
                        // Remove it from the list of listened items.
                        delete listenedCacheItems[cacheKey];
                    }
                });
            });
        }, this.config.cachePollIntervalMs || 100);
    }

    /**
     * Stops the interval timer that watches the Apollo Client cache.
     */
    stop() {
        if (this._intervalTimerId) {
            clearInterval(this._intervalTimerId);
            this._intervalTimerId = undefined;
        }
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
    addListener(listener: IApolloCacheWatcherListener<any>) {
        this._cacheItemListeners.push({
            listener,
            listenedCacheItems: {},
        });
    }
}
