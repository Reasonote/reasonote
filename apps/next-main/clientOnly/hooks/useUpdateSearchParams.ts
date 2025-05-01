import {useCallback} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

export function useUpdateSearchParams(){
    // Get the current searchParams
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get a new searchParams string by merging the current
    // searchParams with a provided key/value pair
    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '')
            
            if (value === null) {
                params.delete(name)
            }
            else {
                params.set(name, value)
            }
        
            return params.toString()
        },
        [searchParams]
    )

    const updateSearchParams = useCallback(
        (name: string, value: string | null) => { 
            const newSearch = createQueryString(name, value)
            router.push(`${pathname}?${newSearch}`)
        },
        [createQueryString, pathname, router]
    )

    return updateSearchParams
}