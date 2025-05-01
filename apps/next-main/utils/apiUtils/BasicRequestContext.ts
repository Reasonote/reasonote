import {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {ApiRoute} from "@reasonote/lib-api-sdk";
import {
  createSimpleLogger,
  SimpleLogger,
} from "@reasonote/lib-utils";
import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

import {API_ENV} from "../../pages/api/_helpers/API_ENV";

export class BasicRequestContext<TApiRoute extends ApiRoute<any, any>> {
  nextApiRequest: NextApiRequest;
  nextApiResponse: NextApiResponse;
  apiRoute: TApiRoute;
  parsedReq: TApiRoute["requestSchema"]["_output"];
  supabase: SupabaseClient;
  logger: SimpleLogger;

  constructor({
    nextApiRequest,
    nextApiResponse,
    apiRoute,
    
    supabase,
    logger,
  }: {
    nextApiRequest: NextApiRequest;
    nextApiResponse: NextApiResponse;
    apiRoute: TApiRoute;
    supabase?: SupabaseClient;
    logger?: SimpleLogger;
  }) {
    this.logger = logger
      ? logger
      : createSimpleLogger(apiRoute.path, { prefixAllLines: true });
    this.nextApiRequest = nextApiRequest;
    this.nextApiResponse = nextApiResponse;
    this.apiRoute = apiRoute;
    try {
      this.parsedReq = apiRoute.requestSchema.parse(nextApiRequest.body);
    } catch (err: any) {
      this.logger.error("Failed to parse request body.");
      this.nextApiResponse.status(400).json({
        error: `Failed to parse request body., ${JSON.stringify(err)}`,
      });
      throw err;
    }

    this.supabase = supabase
      ? supabase
      : createClient(
          API_ENV.NEXT_PUBLIC_SUPABASE_URL,
          API_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
  }
}

export type RequestOfCtx<TCtx extends BasicRequestContext<any>> =
  TCtx["apiRoute"]["requestSchema"]["_output"];
export type ResponseOfCtx<TCtx extends BasicRequestContext<any>> =
  TCtx["apiRoute"]["responseSchema"]["_output"];
