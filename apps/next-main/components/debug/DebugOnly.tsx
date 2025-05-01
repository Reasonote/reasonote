import {useIsDebugMode} from "@/clientOnly/hooks/useIsDebugMode";

export function DebugOnly({children}: {children: React.ReactNode}) {
    const isDebug = useIsDebugMode();

    return isDebug ? 
        <>
            {children}
        </>
        : 
        null;
}