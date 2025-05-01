"use client";
import {useRouter} from "next/navigation";

import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {useSupabase} from "../../../components/supabase/SupabaseProvider";
import {
  TransitionCentered,
} from "../../../components/transitions/TransitionCentered";

export default function Logout() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const {hasLoggedIn, loading, refresh} = useRsnUser();
  const {refetch: refetchSubscription} = useReasonoteLicense();

  useAsyncEffect(async () => {
    if (!loading){
      if (hasLoggedIn) {
        const {error} = await supabase.auth.signOut();

        refresh();
  
        if (error) {
          console.error('error logging out', error);
        }
      }

      await refetchSubscription();
      router.push("/app/login");
    }
  }, [hasLoggedIn, loading, refetchSubscription]);

  return <TransitionCentered transitionName={"Logging You Out..."} />;
}
