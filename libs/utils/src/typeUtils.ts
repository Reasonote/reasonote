import _, { type Dictionary } from "lodash";

/**
 * Null or undefined.
 */
export type Nullish = null | undefined;

/**
 * Determines if an item has some value, and tells TypeScript such.
 */
export function notEmpty<TValue>(
    value: TValue | Nullish,
): value is TValue {
    return value !== null && value !== undefined;
}

/**
 * Checks if a value is a promise
 */
export function isPromise(value: any): value is Promise<any> {
    return typeof value?.then === "function";
}

/**
 * Determines if the passed generic T is of any type.
 */
export type IsAny<T, True, False = never> = true | false extends (
    T extends never ? true : false
)
    ? True
    : False;

/**
 * Returns an array of non-empty values in the given dictionary.
 */
export function dictValues<TValue>(dic: Dictionary<TValue>): TValue[] {
    return _.values(dic).filter(notEmpty);
}

/**
 * Maps and filters out empty values for the given input array.
 */
export function notEmptyMap<I, O>(
    m: I[],
    fn: (input: I) => O | undefined | null,
): O[] {
    return m.map(fn).filter(notEmpty);
}

/**
 * Represents a success or error result wrapper with optional data.
 */
export type Maybe<T> =
    | { success: true; data: T; error?: undefined | null }
    | { success: false; error: Error; data?: undefined | null };

/**
 * Wraps a function and produces a maybe-ified version of the function.
 * If an exception is thrown, an object with an error will be returned.
 * If no exception is thrown, a data object will be returned.
 */
export function catchToMaybeAsync<InT, OutT>(
    f: (input?: InT) => Promise<OutT>,
): (input?: InT) => Promise<Maybe<OutT>> {
    return async (input?: InT) => {
        try {
            const data = await Promise.resolve(f(input));
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error };
        }
    };
}

/**
 * Wraps a promise in a maybe-ified object.
 */
export async function maybify<T>(promise: Promise<T>): Promise<Maybe<T>> {
    try {
      const data = await promise;
      return { data, error: null, success: true };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)), success: false };
    }
  }

export async function runMaybify<T>(func: () => Promise<T>): Promise<Maybe<T>> {
    try {
        const data = await func();
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error };
    }
}



/**
 * Returns either the given value or null if the value is undefined.
 */
export function valueOrNull<T>(v: T | null | undefined): T | null {
    return v ?? null;
}

/**
 * Ensures the given argument is an array. If not, wraps it in an array.
 */
export function arrayify<T>(arg: T | T[]): T[] {
    return Array.isArray(arg) ? arg : [arg];
}

/**
 * Extracts the type of the elements inside an array type.
 */
export type Unarray<T> = T extends Array<infer U> ? U : T;

/**
 * Returns the type of the constructor parameters of a class.
 */
export type ConstructorParameters<T> = T extends new (...args: infer U) => any
    ? U
    : never;

/**
 * Returns the type of the constructor return type of a class.
 */
export type ConstructorReturnType<T> = T extends new (...args: any[]) => infer R
    ? R
    : never;

/**
 * Gets a non-nullable property type from a the first constructor parameter of a class.
 * Helpful for not defining types more than once.
 *
 * This is useful in situations where you want to create a class that requires a config object
 * with optional properties that are defaulted in the constructor if not provided.
 * and you want to use that config object as the source of types for internal parameters.
 *
 * You can use this like:
 *
 * ```typescript
 * type MyConfig = {
 *  myProp?: { key: string }
 * }
 *
 * class MyClass {
 *    private _myProp: RequiredConstructorConfigType<typeof MyClass, 'myProp'>;
 *
 *   constructor({myProp}: MyConfig) {
 *    this._myProp = myProp ?? {key: 'defaultKey'};
 *   }
 * ```
 *
 *
 */
export type RequiredConstructorConfigType<
    T,
    Prop extends keyof ConstructorParameters<T>[0],
> = NonNullable<ConstructorParameters<T>[0][Prop]>;
