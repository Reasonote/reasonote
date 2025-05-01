import {useRef} from "react";

import {Mutex} from "async-mutex";

export function useMutex(){
    const ref = useRef(new Mutex());
    ref.current.acquire
    ref.current.cancel
    ref.current.release
    ref.current.runExclusive
    ref.current.waitForUnlock

    return {
        mutex: ref.current,
        isLocked: () => ref.current.isLocked(),
        acquire: (...args: Parameters<typeof ref.current.acquire>) => ref.current.acquire(...args),
        cancel: (...args: Parameters<typeof ref.current.cancel>) => ref.current.cancel(...args),
        release: (...args: Parameters<typeof ref.current.release>) => ref.current.release(...args),
        runExclusive: (...args: Parameters<typeof ref.current.runExclusive>) => ref.current.runExclusive(...args),
        waitForUnlock: (...args: Parameters<typeof ref.current.waitForUnlock>) => ref.current.waitForUnlock(...args),
    }
}