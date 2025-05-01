import {useSearchParams} from "next/navigation";

export function useIsDebugMode(){
    const searchParams = useSearchParams();
    // Check if the query params contain debug = true
    return !!searchParams?.has('debug');
}