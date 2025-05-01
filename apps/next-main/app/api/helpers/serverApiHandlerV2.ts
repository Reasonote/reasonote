import {
  NextRequest,
  NextResponse,
} from "next/server";
import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {
  ApiRouteContextBasic,
  ApiRouteContextFull,
} from "./ApiRouteContext";
import {
  ERROR_SYMBOL,
  OK_SYMBOL,
} from "./common";
import {
  ApiRouteRequestZodParseError,
  BasicApiError,
} from "./errors";
import {
  createInternals,
  initializeRequest,
  parseRequest,
} from "./initializeRequest";
import {isNextResponseV4} from "./isNextResponse";

export function makeServerApiHandlerV2<
  TReqZ extends z.ZodTypeAny,
  TResZ extends z.ZodTypeAny,
  TReqFormData extends z.ZodTypeAny = any
>({
  route,
  handler,
}: {
  route: ApiRoute<TReqZ, TResZ>;
  handler: (
    ctx: ApiRouteContextFull<ApiRoute<TReqZ, TResZ>>
  ) => Promise<Response | TResZ["_output"]>;
}) {
  return async (req: NextRequest) => {
    ////////////////////////////////////////////////////////////////////////
    // INITIALIZE REQUEST
    let basicCtx: ApiRouteContextBasic<ApiRoute<TReqZ, TResZ>>;
    try {
      basicCtx = await initializeRequest({
        req,
        route,
      });
    } catch (err: any) {
      console.debug(
        `--== DONE request ${ERROR_SYMBOL}(500, CRITICAL -- Failure creating basic context) ==--`
      );
      return NextResponse.json(
        {
          error: err.message,
        },
        {
          status: 500,
        }
      );
    }

    ////////////////////////////////////////////////////////////////////////
    // CREATE HELPERS FOR THIS REQUEST
    const { logger, requestStartTime } = basicCtx;
    const getElapsedStr = () => {
      const elapsed = Date.now() - requestStartTime.getTime();

      // Split every three characters from the right with an underscore
      return `${elapsed}ms`.replace(/\B(?=(\d{3})+(?!\d))/g, "_");
    };

    /**
     * Takes the basic context and produces the remainder of the context,
     * along with a final response.
     * @returns
     */
    async function getResponse(): Promise<NextResponse | Response> {
      try {
        ////////////////////////////////////////////////////////////////////////
        // CREATE INTERNALS
        const ctxWithInternals = await createInternals({
          ctx: basicCtx,
        });

        ////////////////////////////////////////////////////////////////////////
        // PARSE REQUEST
        const ctx = await parseRequest({
          ctx: ctxWithInternals,
        });

        ////////////////////////////////////////////////////////////////////////
        // RUN HANDLER
        // Use the handler to process the request.
        const result = await handler(ctx);

        ////////////////////////////////////////////////////////////////////////
        // SEND RESPONSE

        const timeElapsedStr = getElapsedStr(); 
        if (
          // //@ts-ignore
          // (result.constructor && result.constructor.name === "Response") ||
          // //@ts-ignore
          // (result.constructor && result.constructor.name === "NextResponse")
          isNextResponseV4(result)
        ) {
          const typedResult = result as Response | NextResponse;

          logger.debug(
            `--== DONE request ${typedResult.ok ? OK_SYMBOL : ERROR_SYMBOL}(${
              typedResult.status
            }, direct) (${timeElapsedStr}) ==--`
          );

          return result;
        } else {
          
          logger.debug(
            `--== DONE request ✅(200, implicit) (${timeElapsedStr}) ==--`
          );
          return NextResponse.json(result, { status: 200 });
        }
        ////////////////////////////////////////////////////////////////////////
        // HANDLE ERRORS
      } catch (err: any) {
        const timeElapsedStr = getElapsedStr();
        if (err instanceof BasicApiError) {
          logger.debug(
            `--== DONE request ${ERROR_SYMBOL}(${err.httpStatusCode}, BasicApiError) (${timeElapsedStr}) ==--`
          );

          const { data: parsedData, error: parsingError } = JSONSafeParse(
            JSON.stringify(err.data)
          );

          return NextResponse.json(
            {
              errMessage: err.message,
              errData: parsedData ? parsedData : err.data,
            },
            {
              status: err.httpStatusCode,
              headers: {},
            }
          );
        } else if (err instanceof ApiRouteRequestZodParseError) {
          logger.debug(
            `--== DONE request ${ERROR_SYMBOL}(400, ZodParseError) (${timeElapsedStr}) ==--`
          );
          return NextResponse.json(
            {
              errMessage: err.message,
              errData: err.zodError.format(),
            },
            {
              status: 400,
            }
          );
        } else {
          logger.error('UNCAUGHT 500 ERROR:', err);
          logger.debug(
            `--== DONE request ${ERROR_SYMBOL}(500, Error) (${timeElapsedStr}) ==--`
          );
          return NextResponse.json(
            {
              error: err.message,
              trace: err.stack,
            },
            {
              status: 500,
            }
          );
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////
    // RETURN WRAPPED RESPONSE
    function wrapResponse(res: Response | NextResponse) {
      // Set final headers.
      res.headers.set("X-Rsn-Request-Time", getElapsedStr());
      res.headers.set("X-Rsn-Req-Id", basicCtx.rsnReqId);

      return res;
    }

    ////////////////////////////////////////////////////////////////////////
    // RETURN RESPONSE
    return await getResponse().then(wrapResponse);
  };
}
