import {useEffect} from "react";

import {useSearchParams} from "next/navigation";

import {useUpdateSearchParams} from "./useUpdateSearchParams";

export function useSearchParamHelper(name: string, defaultValue?: string){
    const updateSearchParams = useUpdateSearchParams();
    const searchParams = useSearchParams()
    const value = searchParams?.get(name);
    
    useEffect(() => {
        if (!value && defaultValue) {
            updateSearchParams(name, defaultValue)
        }
    }, [value, defaultValue]);

    return {
        update: (value: string | null) => {
            updateSearchParams(name, value)
        },
        value
    }
}