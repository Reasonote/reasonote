'use client'

import _ from "lodash";
import {useParams} from "next/navigation";

export function useRouteParams(params: {[key: string]: any}, name: string) {
    if (!params) {
        return null;
    }
    
    const item = decodeURIComponent(params[name]);

    return item;
}

export function useRouteParamsV2<T extends string[]>(expectedParams: T): {[key in T[number]]: string | string[] | null} {
    const params = useParams();

    //Always return an object with the keys of the expectedParams, make null if not found
    return expectedParams.reduce((acc, param) => {
        acc[param] = params?.[param] ?? null;
        return acc;
    }, {} as {[key in T[number]]: string | string[] | null});
}

/**
 * Same as useRouteParamsV2, but if there are multiple results found for any param, only returns first one.
 * @param expectedParams 
 * @returns 
 */
export function useRouteParamsSingle<T extends string[]>(expectedParams: T): {[key in T[number]]: string | null} {
    const params = useRouteParamsV2(expectedParams);

    return expectedParams.reduce((acc, param) => {
        acc[param] = _.isArray(params?.[param]) ? params?.[param]?.[0] ?? null : params?.[param] ?? null;
        return acc;
    }, {} as {[key in T[number]]: string | null});
}