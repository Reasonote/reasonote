import _ from "lodash";
import { Dictionary } from "lodash";
import * as fs from 'fs/promises';
import * as path from 'path';

// Determines if an item has some value, and tells typescript such.
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

export function isPromise(value: any): value is Promise<any> {
    return value && value.then && typeof value.then === 'function';
}


declare type IsAny<T, True, False = never> = true | false extends (T extends never ? true : false) ? True : False

export function dictValues<TValue>(dic: Dictionary<TValue>) {
    return _.values(dic).filter(notEmpty);
}

export function notEmptyMap<I, O>(m: I[], fn: (input: I) => O | undefined | null): O[] {
    return m.map(fn).filter(notEmpty);
}

export type Maybe<T> = { success: true, data: T } | { success: false, error: Error }

export function valueOrNull<T>(v: T | null | undefined): T | null {
    return v ? v : null;
}


export async function writeFileRecursiveCreate(filePath: string, data: string) {
    // Create things to the path.
    const mkdirResult = await fs.mkdir(path.dirname(filePath), { recursive: true });

    return fs.writeFile(filePath, data);
}

export const reasonote_ROOT_DIR_PATH = path.resolve(path.join(__dirname, ".."));


export function splitToLengths<T>(arr: T[], splitLengths: number[]): T[][] {
    const totalLengths = _.sum(splitLengths);
    if (totalLengths > arr.length) {
        throw new Error("splitToLengths: lengths provided, when summed, are longer than given array.");
    }

    if (splitLengths.length < 1) {
        return [arr];
    }

    let lastSplit = 0;
    const ret = splitLengths.map((length) => {
        const v = _.slice(arr, lastSplit, lastSplit + length)
        lastSplit += length;
        return v;
    })

    const checkTotalSums = _.sum(ret.map(r => r.length));

    if (arr.length !== checkTotalSums) {
        throw new Error("splitToLengths: Something went wrong. Total number returned does not match number provided.")
    }

    return ret;
}


export function isWhitespace(s: string) {
    return s.trim().length < 1;
}