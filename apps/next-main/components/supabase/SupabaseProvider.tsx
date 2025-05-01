"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {useSupabaseUrl} from "@/clientOnly/hooks/useSupabaseUrl";
import type {Database} from "@reasonote/lib-sdk";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";
import {
  createBrowserSupabaseClient,
  type SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

import SupabaseListener from "./SupabaseListener";

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  sb: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

// TODO: The reason we're having issues is because ReasonoteSDK is using a different supabase client.
// We can either:
// 1. Use the same client for both ReasonoteSDK and this app -- this suggests a <ReasonoteSDKProvider> component, analogous to this one, which may supercede it?
// 2. Use a different client for ReasonoteSDK and this app, and keep them synched.

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {data: supabaseUrl} = useSupabaseUrl();

  const [supabase, setSupabase] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    if (supabaseUrl){
      setSupabase(createBrowserSupabaseClient({supabaseUrl}));
    }
  }, [supabaseUrl]);

  const session = useAsyncMemo(async () => {
    const ret = await supabase.auth.getSession();

    return ret?.data.session;
  }, []);

  return (
    <Context.Provider value={{ supabase, sb: supabase }}>
      <>
        <SupabaseListener serverAccessToken={session?.access_token} />
        {children}
      </>
    </Context.Provider>
  );
}

export const useSupabase = () => {
  let context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  } else {
    return context;
  }
};
