import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import _, {
  isArray,
  isObject,
} from 'lodash';
import InfiniteScroll, {
  Props as InfiniteScrollProps,
} from 'react-infinite-scroll-component';

import {
  FetchMoreQueryOptions,
  OperationVariables,
  QueryOptions,
  QueryResult,
  useQuery,
} from '@apollo/client';
import { isNetworkRequestInFlight } from '@apollo/client/core/networkStatus';
import { createSimpleLogger } from '@reasonote/lib-utils';

export interface IApolloClientInfiniteScrollProps<TVariables extends OperationVariables, TData> {
    /**
     * The id of the root element for this infinite scroll component.
     */
    wrapperElId: string;

    /** Options passed to the inner `useQuery` statement.
     *
     * Apollo Client Documentation here: https://www.apollographql.com/docs/react/data/queries
     *
     */
    queryOpts: QueryOptions<TVariables, TData>;

    /** Options passed to the `QueryResult.fetchMore` function.
     * Information on properly setting this value can be found here:
     * - Basic API: https://www.apollographql.com/docs/react/pagination/core-api/#the-fetchmore-function
     * - With Cursor-Based pagination: https://www.apollographql.com/docs/react/pagination/cursor-based
     * - With Offset-Based pagination: https://www.apollographql.com/docs/react/pagination/offset-based
     *
     * In Reasonote, we usually use cursor-based, Relay-Style pagination, which is documented here:
     * - https://www.apollographql.com/docs/react/pagination/cursor-based#relay-style-cursor-pagination
     *
     */
    fetchMoreOptions: (latestQueryResult: QueryResult<TData, TVariables>) => FetchMoreQueryOptions<
        TVariables,
        TData
    > & {
        updateQuery?: (
            previousQueryResult: TData,
            options: {
                fetchMoreResult: TData;
                variables: TVariables;
            },
        ) => TData;
    };
    /**
     * If defined, forces component to perform its given fetchMoreOptions function
     * until the given function returns true.
     *
     * @param qResult
     * @returns
     */
    fetchMoreUntil?: (qResult: QueryResult<TData, TVariables>) => boolean;
    /** A function which will take a query result of the type specified, and return a list of valid JSX elements. */
    getChildren: (latestQueryResult: QueryResult<TData, TVariables>) => JSX.Element | ReactNode | null | (JSX.Element | ReactNode | null)[];

    /**
     * If defined, this is the component before the children.
     */
    getPreScrollComponent?: (latestQueryResult: QueryResult<TData, TVariables>) => JSX.Element | null;

    /**
     * If defined, this is the component after the children.
     */
    getPostScrollComponent?: (latestQueryResult: QueryResult<TData, TVariables>) => JSX.Element | null;

    /** Set of options for executing a callback when the children of the list have updated and rendered. */
    onChildrenUpdated?: {
        /** If defined, given onUpdate will only run if canRun returns true. */
        canRun?: () => boolean;
        /** If defined, component will only run onUpdate once. The flag for this resets when a new onChildrenUpdated prop is given. */
        runOnce?: boolean;
        /** Callback to run when children update. */
        onUpdate: () => void;
    };
    /** A function which reads the queryResult given, and determines if there are more elements to be fetched. */
    hasMore: (latestQueryResult: QueryResult<TData, TVariables>) => boolean;

    /**
     * If defined, change to this value will cause an update.
     */
    updateCount?: number;

    /** Props to apply to the wrapper div, which sits around the InfiniteScroll component.
     * The basic tsx structure in this component looks like:
     *
     * ```tsx
     * <div
     *  // the wrapper
     *  {...defaultWrapperElProps}
     *  {...overrideWrapperElProps}
     * >
     *    <InfiniteScroll
     *       // From 'react-infinite-scroll-component' package.
     *      {...defaultInfiniteScrollProps}
     *      {...overrideInfiniteScrollProps}
     *    >
     *         {getChildren(latestQueryResult)}
     *    </InfiniteScroll>
     * </div>
     * ```
     *
     */
    overrideWrapperElProps?: React.HTMLProps<HTMLDivElement>;

    /** Overrides for the infinite scroll component.
     *
     * Docs: https://github.com/ankeetmaini/react-infinite-scroll-component
     *
     * The basic tsx structure in this component looks like:
     *
     * ```tsx
     * <div
     *  // the wrapper
     *  {...defaultWrapperElProps}
     *  {...overrideWrapperElProps}
     * >
     *    <InfiniteScroll
     *       // From 'react-infinite-scroll-component' package.
     *      {...defaultInfiniteScrollProps}
     *      {...overrideInfiniteScrollProps}
     *    >
     *         {getChildren(latestQueryResult)}
     *    </InfiniteScroll>
     * </div>
     * ```
     *
     */
    overrideInfiniteScrollProps: Partial<InfiniteScrollProps>;
    /** Indicates if infinite scroll should be at the top. */
    inverse?: boolean;
    onLoadScrollBegin?: (
        fetchMoreOptions: FetchMoreQueryOptions<TVariables, TData> & {
            updateQuery?: (
                previousQueryResult: TData,
                options: {
                    fetchMoreResult: TData;
                    variables: TVariables;
                },
            ) => TData;
        },
    ) => void;
    onLoadScrollEnd?: (
        fetchMoreOptions: FetchMoreQueryOptions<TVariables, TData> & {
            updateQuery?: (
                previousQueryResult: TData,
                options: {
                    fetchMoreResult: TData;
                    variables: TVariables;
                },
            ) => TData;
        },
    ) => void;

    /**
     * This function will be called whenever the query result changes.
     * @param latestQueryResult 
     * @returns 
     */
    onQueryResultDataChanged?: (latestQueryResult: QueryResult<TData, TVariables>) => void;

    /** Reference variable if needed */
    innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

const logger = createSimpleLogger("ApolloClientInfiniteScroll");
export function ApolloClientInfiniteScroll<TVariables extends OperationVariables, TData>({
    wrapperElId,
    getChildren,
    getPreScrollComponent,
    getPostScrollComponent,
    queryOpts,
    fetchMoreOptions,
    fetchMoreUntil,
    hasMore,
    overrideInfiniteScrollProps,
    overrideWrapperElProps,
    inverse,
    onLoadScrollBegin,
    onLoadScrollEnd,
    onQueryResultDataChanged,
    innerRef,
    onChildrenUpdated,
    updateCount
}: IApolloClientInfiniteScrollProps<TVariables, TData>) {
    const queryResult = useQuery(queryOpts.query, queryOpts);

    const compId = useMemo(() => {
        return Math.random().toString();
    }, []);


    const endSentinelRef = useRef<HTMLDivElement>(null);
    /*
    We use this ref to compare against the queryResult value. This lets us
    setup hooks with multiple dependencies, but gives us a way to check
    if the queryResult value has changed, in case that's the only change
    we want to trigger logic.
    */
    const queryResultRef = useRef(queryResult);

    /** Whether or not there are more children to be fetched. */
    const _hasMore = useMemo(() => {
        return hasMore(queryResult);
    }, [queryResult, hasMore]);

    /** Increase the number of items rendered. Displayed to the user. Used by infinite scroll. */
    const loadScroll = useCallback(() => {
        const f = async () => {
            try {
                // Don't double fetch -- check network status before asking for more.
                if (!isNetworkRequestInFlight(queryResult.networkStatus) && _hasMore) {
                    
                    const opts = fetchMoreOptions(queryResult);
                    onLoadScrollBegin && onLoadScrollBegin(opts);
                    // logger.debug(`Fetching more with options:`, opts);

                    const resss = await queryResult.fetchMore(opts);
                    // logger.debug(`Fetch more result:`, resss);

                    onLoadScrollEnd && onLoadScrollEnd(opts);
                }
            } catch (err: any) {
                logger.error(`Error fetching more messages:`, err);
            }
        };
        f();
    }, [fetchMoreOptions, queryResult, _hasMore]);

    useEffect(() => {
        if (updateCount) {
            queryResultRef.current = queryResult;
            loadScroll();
        }
    }, [updateCount]);
    

    /** When queryResult changes, if fetchMoreUntil is defined, continue loading items until fetchMoreUntil returns true. */
    useEffect(() => {
        /*
        We need multiple dependencies for our logic to run correctly here, but we only want to run
        this callback if the query result has updated, so we compare the ref here to ensure that.
        */
        if (queryResult === queryResultRef.current) return;
        if (!fetchMoreUntil || queryResult.loading) return;
        if (fetchMoreUntil(queryResult)) return;
        queryResultRef.current = queryResult;
        loadScroll();
    }, [fetchMoreOptions, fetchMoreUntil, loadScroll, queryResult, updateCount]);

    useEffect(() => {
        if (onQueryResultDataChanged) {
            onQueryResultDataChanged(queryResult);
        }
    }, [JSON.stringify(queryResult.data), onQueryResultDataChanged]);

    /** The children we fetched using the queryResult we've most recently been returned. */
    const children = useMemo(() => {
        const childrenz = getChildren(queryResult);
        return childrenz;
    }, [queryResult, getChildren]);

    /*
    Similar to the queryResultRef, we have hooks with multiple dependencies that
    we only want to update when the children have updated. We use a ref to handle
    that. However since the children object updates even when the deep data has
    not changed, we use a hashed value instead.
    */
    const currentChildrenHash = useMemo(() => {
        if (!children) return "";
        if (isArray(children)) {
            return children
                .map((e, i) => (e && isObject(e) && 'key' in e && e.key ? e.key.toString() : i.toString()))
                .reduce((prev, curr) => prev + curr, "");
        }
        return _.get(children, 'key') ?? "";
    }, [children]);

    const childrenHashRef = useRef(currentChildrenHash);

    /** Keep track of whether given onChildrenUpdated function has run. */
    const onChildrenUpdateHasRun = useRef(false);

    /** Reset onChildrenUpdated "has run" flag when value of onChildrenUpdated prop changes. */
    useEffect(() => {
        if (onChildrenUpdated) onChildrenUpdateHasRun.current = false;
    }, [onChildrenUpdated]);

    useEffect(() => {
        if (!onChildrenUpdated) return;
        if (currentChildrenHash === childrenHashRef.current) return;
        if (onChildrenUpdated.canRun && !onChildrenUpdated.canRun()) return;
        if (onChildrenUpdated.runOnce && onChildrenUpdateHasRun.current) return;
        onChildrenUpdated.onUpdate();
        onChildrenUpdateHasRun.current = true;
        childrenHashRef.current = currentChildrenHash;
    }, [currentChildrenHash, onChildrenUpdated]);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastOnVisibleCheck = useRef<number>(0);

    useEffect(() => {
        const target = endSentinelRef.current;
    
        // Function to call when element is visible -- debounced to prevent excessive calls
        const onVisible = () => {
            if (Date.now() - lastOnVisibleCheck.current > 500) {
                console.debug('ApolloClientInfiniteScroll: IntersectionObserver: onVisible')
                lastOnVisibleCheck.current = Date.now();
                loadScroll();
            }
        };
    
        // Create an Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    onVisible();
                }
            });
        }, { threshold: 1.0 });
    
        // Observe the target if it exists
        if (target) {
            observer.observe(target);
        }
    
        // Set up an interval to periodically check visibility
        const checkVisibility = () => {
            if (target) {
                const rect = target.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom >= 0 
                                && rect.left < window.innerWidth && rect.right >= 0;
                // Additional check to see if the element is not hidden by other elements
                if (isVisible && document.elementFromPoint(rect.left + 1, rect.top + 1) === target) {
                    onVisible();
                }
            }
        };

        // Clear any existing interval before setting a new one
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(checkVisibility, 500); // Check every second
    
        // Clean up
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (target) {
                observer.unobserve(target);
            }
        };
    }, [compId, loadScroll]); // Dependency array

    return (
        <>
            {getPreScrollComponent && getPreScrollComponent(queryResult)}
            <div
                ref={innerRef}
                id={wrapperElId}
                className={(overrideWrapperElProps?.className || "") + "flex firefox-scroll scroll"}
                style={{
                    flexBasis: "inherit",
                }}
                {...overrideWrapperElProps}
            >
                {/* @ts-ignore */}
                <InfiniteScroll
                    dataLength={children ? (_.isArray(children) ? children.length : 1) : 0}
                    next={loadScroll}
                    hasMore={_hasMore}
                    loader={<></>}
                    scrollableTarget={wrapperElId}
                    inverse={inverse}
                    style={{
                        overflow: "visible",
                    }}
                    {...overrideInfiniteScrollProps}
                >
                    {children}
                    <div ref={endSentinelRef}/>
                </InfiniteScroll>
            </div>
            {getPostScrollComponent && getPostScrollComponent(queryResult)}
        </>
    );
}