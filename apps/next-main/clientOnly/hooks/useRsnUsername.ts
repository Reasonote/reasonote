"use client";

import {
  useEffect,
  useState,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";

import {useRsnUser} from "./useRsnUser";

export function useRsnUsername() {
  const { rsnUserId } = useRsnUser();
  const { supabase } = useSupabase();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsername() {
      if (!rsnUserId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profile')
        .select('username')
        .eq('rsn_user_id', rsnUserId)
        .single();

      if (!error && data) {
        setUsername(data.username);
      }
      setLoading(false);
    }

    fetchUsername();
  }, [rsnUserId, supabase]);

  return { username, loading };
} 