import _ from "lodash";

interface DrainSuccess<TParams, TResult> {
    params: TParams;
    success: true;
    result: TResult;
}

interface DrainFailure<TParams> {
    params: TParams;
    success: false;
    error: Error;
}

type DrainResult<TParams, TResult> =
    | DrainSuccess<TParams, TResult>
    | DrainFailure<TParams>;

interface QueuedFunctionConfig<TParams, TResult> {
    /** The minimum number of time between each call to `isReady`. Defaults to 0. */
    readyThrottleMs?: number;
    /** The number of milliseconds to wait between polling the `isReady` function */
    pollReadyIntervalMs?: number;
    /** A function to be called when the queue is drained. */
    beforeDrainCallback?: (p: { itemsToDrain: TParams[] }) => void;
    /** A function to be called after the queue has been drained. */
    afterDrainCallback?: (p: {
        drainResult: Array<DrainResult<TParams, TResult>>;
    }) => void;
}

/**
 * Wraps a function with a "Ready Queue".
 *
 * Whenever the function is called with parameters, those parameters will be added to the queue.
 *
 * Every time a new element is queued, the "isReady" function will be called.
 *
 * When the `isReady` function returns true, the queue will be flushed.
 * @param f The function to be wrapped in a "ready queue"
 * @param isReady A function that returns true when the queue is ready to be flushed.
 * @param config (optional) Configuration for the Ready Queue queue.
 */
export function queuedFunction<TParams, TResult>(
    f: (params: TParams) => TResult,
    isReady: () => boolean,
    config?: QueuedFunctionConfig<TParams, TResult>,
): (params: TParams) => Promise<TResult> {
    const _config = _.defaultsDeep(config, {
        readyThrottleMs: 0,
        pollReadyIntervalMs: undefined,
    });

    const queue: Array<{ params: TParams; resolve: any; reject: any }> = [];

    const flushIfReady = _.throttle(() => {
        // If the queue is ready, flush it.
        if (isReady()) {
            if (queue.length === 0) {
            } else {
                // Remove elements from the queue.
                const _queueToFlush = queue.splice(0, queue.length);

                // Report to our callback, if provided.
                _config.beforeDrainCallback?.({
                    itemsToDrain: _queueToFlush.map((q) => q.params),
                });

                // Run the params through each function in the queue
                // And a set of resolve / reject pairs that must be called when the function is done.
                const drainResult = _queueToFlush.map(
                    ({ params, resolve, reject }) => {
                        try {
                            const result = f(params);

                            // Resolve this promise with the result.
                            resolve(result);

                            // Return the result, for logging purposes.
                            return { params, success: true, result };
                        } catch (error: any) {
                            // Reject this promise, because we hit an exception.
                            reject(error);

                            // Return the result for logging purposes.
                            return { params, success: false, error };
                        }
                    },
                );

                // If we got an after drain callback, go ahead and call it.
                _config.afterDrainCallback?.({ drainResult });
            }
        }
    }, _config.readyThrottleMs);

    if (_config.pollReadyIntervalMs) {
        setInterval(() => {
            flushIfReady();
        }, _config.pollReadyIntervalMs);
    }

    return async (params: TParams) =>
        await new Promise((resolve, reject) => {
            // Add the new params to the queue.
            queue.push({ params, resolve, reject });

            flushIfReady();
        });
}
