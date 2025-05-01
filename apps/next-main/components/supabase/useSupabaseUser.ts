import {useMemo} from "react";

import {User} from "@supabase/supabase-js";

import {useSupabaseSession} from "./useSupabaseSession";

// TODO: this is happening for EVERY instance of useSupabaseUser. We should memoize this such that it only happens *once* and gets shared across all instances of useSupabaseUser.
// This implies that we should probably be using a context provider for this.
export const useSupabaseUser = () => {
  const { session, loading } = useSupabaseSession();

  const user = useMemo<User | null>(() => {
    return session?.user || null;
  }, [session]);

  return { user, loading };
};
