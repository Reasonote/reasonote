import {
  useEffect,
  useState,
} from "react";

import {Session} from "@supabase/supabase-js";

import {useSupabase} from "./SupabaseProvider";

export const useSupabaseSession = () => {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | undefined | null>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  return { 
    session,
    loading,
  };
};
