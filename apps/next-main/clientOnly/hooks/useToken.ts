import {
  useEffect,
  useRef,
} from "react";

import {useSupabaseSession} from "@/components/supabase/useSupabaseSession";

export function useToken(){
    const { session } = useSupabaseSession();
    const token = session?.access_token;
    const tokenRef = useRef(token);

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    return {
        token,
        tokenRef,
    }
}