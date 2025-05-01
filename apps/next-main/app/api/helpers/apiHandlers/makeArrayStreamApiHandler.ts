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
} from "../ApiRouteContext";
import {ERROR_SYMBOL} from "../common";
import {
  ApiRouteRequestZodParseError,
  BasicApiError,
} from "../errors";
import {
  createInternals,
  initializeRequest,
  parseRequest,
} from "../initializeRequest";

export function makeArrayStreamApiRoute<
    TReqZ extends z.ZodTypeAny,
    TArrayItemZ extends z.ZodTypeAny
>({
    route,
    handler,
}: {
    route: ApiRoute<TReqZ, TArrayItemZ>;
    handler: (
        ctx: ApiRouteContextFull<ApiRoute<TReqZ, TArrayItemZ>>
    ) => AsyncGenerator<z.infer<TArrayItemZ>, void, unknown>;
}) {
    const POST = async (req: NextRequest) => {
        ////////////////////////////////////////////////////////////////////////
        // INITIALIZE REQUEST
        let basicCtx: ApiRouteContextBasic<ApiRoute<TReqZ, TArrayItemZ>>;
        try {
            //@ts-ignore
            basicCtx = await initializeRequest({
                req,
                //@ts-ignore
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
        async function getResponse(): Promise<Response> {
            try {
                const ctxWithInternals = await createInternals({
                    ctx: basicCtx,
                });

                const ctx = await parseRequest({
                    ctx: ctxWithInternals,
                });

                // Get the generator from the handler
                const itemGenerator = await handler(ctx);

                // Create a stream for the response
                const stream = new ReadableStream({
                    async start(controller) {
                        try {
                            // Iterate through the generator and send each item
                            for await (const item of itemGenerator) {
                                // Validate each item against the schema
                                const validatedItem = route.responseSchema.parse(item);
                                controller.enqueue(
                                    `item: ${JSON.stringify(validatedItem)}\n\n`
                                );
                            }
                            controller.close();
                        } catch (error) {
                            controller.error(error);
                        }
                    },
                });

                // Return streaming response
                return new Response(stream, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                });
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
    }

    return {
        POST,
        handler
    }
}
