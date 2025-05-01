import _ from "lodash";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {ExampleRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 60 seconds.
export const maxDuration = 60;

export const {POST} = makeServerApiHandlerV3({
  route: ExampleRoute,
  handler: async (ctx) => {
    const { req, parsedReq,  supabase, logger } = ctx;

    // Parsed request
    const {exampleString, exampleObject} = parsedReq;

    // Process the request
    const {processedString, processedObject} = {
      processedString: exampleString + 'yo!',
      processedObject: {...exampleObject, newKey: 'newValue'}
    };

    ////////////////////////////////////////////
    // Return result
    return {
      exampleProcessedString: processedString,
      exampleProcessedObject: processedObject,
    };
  },
});
