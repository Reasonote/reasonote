import {NextRequest} from "next/server";
import {RsnClient} from "sdk-new";

import {AI} from "@reasonote/lib-ai";
import {ApiRoute} from "@reasonote/lib-api-sdk";
import {Database} from "@reasonote/lib-sdk";
import {ReasonoteApolloClient} from "@reasonote/lib-sdk-apollo-client";
import {SimpleLogger} from "@reasonote/lib-utils";
import {SupabaseClient} from "@supabase/supabase-js";

import {getApiEnv} from "./apiEnv";

/**
 * This should be things that we can create with high reliability only.
 */
export interface ApiRouteContextBasic<TApiRoute extends ApiRoute<any, any>> {
  req: NextRequest;
  route: TApiRoute;
  rsnReqId: string;
  logger: SimpleLogger;
  pathHelpers: {
    /** The base url for next.js, based on this request. */
    baseUrl: string;
  };
  apiEnv: ReturnType<typeof getApiEnv>;
  requestStartTime: Date;
}

/**
 * This context includes internal helpers we may make use of.
 * It's the second step in request chain.
 */
export interface ApiRouteContextWithInternals<
  TApiRoute extends ApiRoute<any, any>
> extends ApiRouteContextBasic<TApiRoute> {
  SUPERUSER_supabase: SupabaseClient<Database>;
}

/**
 * This context includes anything that would be Second-Order derivative of the request sent.
 */
export interface ApiRouteContextFull<TApiRoute extends ApiRoute<any, any>>
  extends ApiRouteContextWithInternals<TApiRoute> {
  supabase: SupabaseClient<Database>;
  ac: ReasonoteApolloClient;
  ai: AI;
  rsn: RsnClient;
  parsedReq: TApiRoute["requestSchema"]["_output"];
  formData?: FormData | undefined | null;
  userAuthType: "authenticated" | "service" | "anon";
  user:
    | undefined
    | {
        rsnUserId: string;
        supabaseUser: Awaited<
          ReturnType<SupabaseClient["auth"]["getUser"]>
        >["data"]["user"];
      };
}
