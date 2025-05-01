export interface SimpleLogger {
    log: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    info: (...args: any[]) => void;
}

export function createSimpleLogger(
    logTag: string | (() => string),
    opts?: { prefixAllLines?: boolean },
): SimpleLogger {
    const basicHandler =
        (fn: (...args: any[]) => void) =>
        (...args: any[]) => {
            const thisLogTag = typeof logTag === "string" ? logTag : logTag();

            if (opts?.prefixAllLines) {
                args.forEach((arg: any) => {
                    if (typeof arg === "string") {
                        arg.split("\n")
                            .map((line) => `[${thisLogTag}]: ${line}`)
                            .forEach((line) => {
                                fn(line);
                            });
                    } else {
                        fn(`[${thisLogTag}]:`, arg);
                    }
                });
            } else {
                fn(`[${thisLogTag}]:`, ...args);
            }
        };

    return {
        log: basicHandler(console.log),
        debug: basicHandler(console.debug),
        warn: basicHandler(console.warn),
        error: basicHandler(console.error),
        info: basicHandler(console.info),
    };
}
