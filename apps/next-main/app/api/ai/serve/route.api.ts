import _ from "lodash";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {AIServeRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 60 seconds.
export const maxDuration = 90;

export const {POST} = makeServerApiHandlerV3({
  route: AIServeRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, ai, logger } = ctx;

    ////////////////////////////////////////////
    // Send request
    const result = await ai.serve(parsedReq as any);

    ////////////////////////////////////////////
    // Return result
    return {
        ...result,
        // Client is not allowed to see rawResponse.
        rawResponse: undefined
    }
  },
})