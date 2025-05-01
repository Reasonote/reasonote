import _ from "lodash";

const existingTimers: string[] = [];

export async function logTime<RetT>(name: string, f: () => Promise<RetT>): Promise<RetT>{
    const extra = existingTimers.includes(name) ? ` (${_.random(100000, 999999)})` : ""

    const logTag = `${name}${extra}`
    console.time(logTag);
    const ret = await f();
    console.timeEnd(logTag);
    return ret;
}