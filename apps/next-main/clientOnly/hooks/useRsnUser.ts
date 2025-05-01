"use client";
import {useState} from "react";

import _ from "lodash";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useReactiveVar} from "@apollo/client";
import {
  useRsnUserFlatFragLoader,
  useRsnUserSysdataFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";
import {uuidv4} from "@reasonote/lib-utils";
import {useEffectDeepEqual} from "@reasonote/lib-utils-frontend";

import {useSupabaseSession} from "../../components/supabase/useSupabaseSession";
import {useSupabaseUser} from "../../components/supabase/useSupabaseUser";
import {rsnUserIdVar} from "../state/userVars";
import {useEntityCache} from "./useEntityCache";

interface LoginJwtResult {
  id: string;
  has_password: boolean;
}

export function useRsnUserId() {
  const rsnUserId = useReactiveVar(rsnUserIdVar);
  return rsnUserId;
}

/**
 * Convenience hook to get the user.
 * - If the user is logged in, it will *always* return the supabase user.
 * - Usually, it will also return the rsnUserId
 * - Finally, once the rsnUser has been loaded, it will return the rsnUser
 * @returns
 */
export function useRsnUser() {
  const { supabase } = useSupabase();
  const session = useSupabaseSession();
  const { user: sbUser, loading: sbUserLoading } = useSupabaseUser();
  const currentRsnUserId = useRsnUserId();

  const [instanceId, setInstanceId] = useState<string | undefined>(uuidv4().slice(0, 8));

  const loginJwtResult = useEntityCache<LoginJwtResult | undefined, LoginJwtResult | undefined>({
    queryName: 'login_jwt',
    id: session?.session?.user.id ?? 'anonymous',
    /**
     * This function handles the user login / anonymous login loop.
     * It's a little tricky, so be careful.
     */
    async fetchFn(id) {
      try {
        console.debug('login_jwt fetchFn');
        var innerJwtResult = await supabase.rpc('login_jwt', {
          browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        if (innerJwtResult.error) {
          throw innerJwtResult.error;
        }

        const newRsnUserId = innerJwtResult.data?.id;

        if (!newRsnUserId) {
          console.debug("No rsnUserId found, signing in anonymously");
          await supabase.auth.signInAnonymously();
          // Refetch the jwt with the new anonymous user
          innerJwtResult = await supabase.rpc('login_jwt', {
            browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        }
        else {
          console.debug("Found current_rsn_user_id: ", newRsnUserId);
        }

        if (!innerJwtResult.data) {
          throw new Error("No rsnUserId found");
        }

        console.debug(`${instanceId}: login_jwt useRsnUser: setting rsnUserIdVar to `, newRsnUserId ? `"${newRsnUserId?.slice(0, 10)}..."` : newRsnUserId);

        rsnUserIdVar(newRsnUserId);

        return innerJwtResult.data;
      }
      catch (error) {
        console.error("Error getting loginJwt: ", error);
        return undefined;
      }
    },
    transformFn: ({rawData}) => rawData,
    cleanupDelay: 2000,
  });

  const rsnUser = useRsnUserFlatFragLoader(currentRsnUserId);
  const rsnUserSysdata = useRsnUserSysdataFlatFragLoader(
    currentRsnUserId ? `rsnusrsys_${currentRsnUserId?.split("_")[1]}` : undefined
  );

  useEffectDeepEqual(() => {
    // console.debug("useRsnUser: rsnUserSysdata", rsnUserSysdata);
  }, [rsnUserSysdata.data]);

  useEffectDeepEqual(() => {
    // console.debug("useRsnUser: rsnUser", rsnUser);
  }, [rsnUser.data]);

  useEffectDeepEqual(() => {
    // console.debug(`${instanceId}: login_jwt useRsnUser: rsnUserId`, currentRsnUserId);
  }, [currentRsnUserId]);

  return {
    refresh: loginJwtResult.refetch,
    sbSession: session,
    sbUser,
    rsnUserId: currentRsnUserId ?? undefined,
    loading: sbUserLoading || rsnUser.loading || rsnUserSysdata.loading || loginJwtResult.loading,
    rsnUser,
    hasLoggedIn: sbUser && !sbUserLoading && !sbUser.is_anonymous,
    userStatus: !sbUserLoading ?
      (
        sbUser ?
          (
            sbUser.is_anonymous ?
              'anonymous' as const :
              'logged_in' as const
          )
          :
          'logged_out' as const
      )
      :
      'unknown' as const,
    rsnUserSysdata,
    hasPassword: loginJwtResult.data?.has_password ?? null,
  };
}
