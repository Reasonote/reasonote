import React, {useMemo} from "react";

import {RsnClient} from "sdk-new";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useApolloClient} from "@apollo/client";
import {ReasonoteApolloClient} from "@reasonote/lib-sdk-apollo-client";

const RsnClientReactContext = React.createContext<RsnClient | null>(null);

export const RsnClientProvider = ({children}) => {
    const ac = useApolloClient() as ReasonoteApolloClient;
    const {sb} = useSupabase();

    const clientInstance = useMemo(() => {
        return new RsnClient({ctxArgs: {
            ac,
            sb,
            // TODO: posthog on frontend is a different type interface...
            // we probably need to adjust that on RsnClient
            posthog: undefined
        }})
    }, [ac, sb]);

    return (
        <RsnClientReactContext.Provider value={clientInstance}>
            {children}
        </RsnClientReactContext.Provider>
    )
}

export const useRsnClient = () => {
    const context = React.useContext(RsnClientReactContext);

    if (context === null) {
        throw new Error('useRsnClient must be used within a RsnClientProvider');
    }

    return context;
}