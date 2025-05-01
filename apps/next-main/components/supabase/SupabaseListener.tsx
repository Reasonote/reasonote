"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useSupabase } from "./SupabaseProvider";

export default function SupabaseListener({
  serverAccessToken,
}: {
  serverAccessToken?: string;
}) {
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // If both tokens are defined...
      if (session?.access_token && serverAccessToken) {
        // If they're different...
        if (session?.access_token !== serverAccessToken) {
          console.log(
            `Refreshing because session access token changed from: ${serverAccessToken} to ${session?.access_token}`
          );
          router.refresh();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [serverAccessToken, router, supabase]);

  return null;
}
