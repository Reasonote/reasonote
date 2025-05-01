import _ from "lodash";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {PostgrestError} from "@supabase/supabase-js";

import {ChatV4UpsertContextRoute} from "./routeSchema";

//env.useBrowserCache = false;
//env.allowLocalModels = false;

class PostgrestErrorWrapper extends Error {
  constructor(public readonly pgError: PostgrestError) {
    super("PostgrestErrorWrapper");
  }
}

// Tells next.js to set the maximum duration of the request to 60 seconds.
export const maxDuration = 90;

export const {POST} = makeServerApiHandlerV3({
  route: ChatV4UpsertContextRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, ai, logger } = ctx;

    ////////////////////////////////////////////
    // Send request
    const result = await ai.chat.upsertContext(parsedReq);

    ////////////////////////////////////////////
    // Return result
    return {
        ids: result.map((r) => r.id)
    };
  },
});
