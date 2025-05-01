import _ from "lodash";

import {notEmpty} from "@reasonote/lib-utils";

import {ResponseOfCtx} from "../../../utils/apiUtils/BasicRequestContext";
import {
  makeServerApiHandler,
} from "../../../utils/apiUtils/makeServerApiHandler";
import {AnalysisRoute} from "./_route";
import {PerformAnalysis} from "./performAnalysis";

const DOMParser = require("dom-parser");

export default makeServerApiHandler({
  route: AnalysisRoute,
  handler: async (ctx) => {
    const {
      nextApiRequest: req,
      nextApiResponse: res,
      parsedReq,
      
      supabase,
      logger,
    } = ctx;

    if (req.method !== "POST") {
      res.status(405).json({
        error: {
          message: "Only POST requests are accepted.",
        },
      });
      return;
    }

    const { analyzers, documents } = parsedReq;

    try {
      var numComplete = 0;
      var numTotal = analyzers.length;

      const results = await Promise.all(
        analyzers.map(async (analyzer) => {
          try {
            const res = await PerformAnalysis(ctx, analyzer.id);

            numComplete += 1;
            logger.log(`Completed ${numComplete} of ${numTotal} analyses.`);
            return res;
          } catch (err: any) {
            logger.error(`Error with OpenAI API request: ${err.message}`);
            return null;
          }
        })
      );

      //////////////////////////////////////////////////////////
      // CONSTRUCT THE RESPONSE
      const ret: ResponseOfCtx<typeof ctx> = {
        analyses: results.filter(notEmpty),
      };

      //////////////////////////////////////////////////////////
      // RETURN THE RESPONSE
      return ret;
    } catch (error: any) {
      // Consider adjusting the error handling logic for your use case
      if (error.response) {
        logger.error(`Error without response. Error:`, error);
        logger.error(error.response.status, error.response.data);
        res.status(error.response.status).json(error.response.data);
      } else {
        logger.error(`Error with OpenAI API request: ${error.message}`);
        res.status(500).json({
          error: {
            message: "An error occurred during your request.",
          },
        });
      }
    }
  },
});
