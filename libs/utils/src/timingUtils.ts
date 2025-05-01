/**
 * Essentially the setInterval function, but the next timer
 * will not start until the previous call has completed.
 */
export function singleThreadSetInterval(
    f: () => Promise<any>,
    timeoutMs: number,
): void {
    const interv = async (): Promise<void> => {
        await f();

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(interv, timeoutMs);
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(interv, 0);
}

/**
 * Returns a promise which will resolve when the provided time has elapsed.
 * @param milliseconds The milliseconds which will pass before the returned promise is resolved.
 */
export async function asyncSleep(milliseconds: any): Promise<any> {
    return await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Polls a function's return value until it becomes true
 *
 * @param condition a function that returns a boolean
 * @param timeout the amount of time to wait until the function times out (in ms)
 * @param pollingFreq the frequency at which to poll the function's return value (in ms)
 */
export async function waitUntilTrue(
    condition: (() => boolean) | (() => Promise<boolean>),
    config?: {
        timeoutMs?: number;
        pollingIntervalMs?: number;
        customErrorMessage?: string;
        intervalCallback?: (
            timeElapsed: number,
            timeUntilTimeout: number,
            totalTime: number,
        ) => any;
    },
): Promise<void> {
    const _config = {
        timeoutMs: 60000,
        pollingIntervalMs: 100,
        customErrorMessage: "",
        intervalCallback: () => null,
        ...config,
    };

    let msElapsed = 0;

    // The Promise.resolve here is just how you can
    // Ensure that even if it's a promise, it gets converted correctly into a boolean.
    // Reference: https://stackoverflow.com/a/27746324
    while (!(await Promise.resolve(condition()))) {
        _config.intervalCallback(
            msElapsed,
            _config.timeoutMs - msElapsed,
            _config.timeoutMs,
        );
        if (msElapsed > _config.timeoutMs) {
            throw new Error(
                `Condition function exceeded timeout while waiting to return true (${_config.timeoutMs} ms). ${_config.customErrorMessage}`,
            );
        }
        await asyncSleep(_config.pollingIntervalMs);
        msElapsed += _config.pollingIntervalMs;
    }
}
