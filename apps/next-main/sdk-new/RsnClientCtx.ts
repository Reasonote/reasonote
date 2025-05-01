import {PostHog} from "posthog-node";

import {Database} from "@reasonote/lib-sdk";
import {ReasonoteApolloClient} from "@reasonote/lib-sdk-apollo-client";
import {SupabaseClient} from "@supabase/supabase-js";

export interface RsnClientCtxConstructorArgs {
    ac: ReasonoteApolloClient;
    sb: SupabaseClient<Database>;
    posthog: PostHog | null | undefined;
}

export class RsnClientCtx {
    constructor(readonly args: RsnClientCtxConstructorArgs){}

    get ac(){
        return this.args.ac;
    }

    get sb(){
        return this.args.sb;
    }

    get posthog(){
        return this.args.posthog;
    }
}
