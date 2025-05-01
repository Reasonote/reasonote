import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

import {ApiRouteContextFull} from "./ApiRouteContext";
import {makeServerApiHandlerV2} from "./serverApiHandlerV2";

export function makeServerApiHandlerV3<
  TReqZ extends z.ZodTypeAny,
  TResZ extends z.ZodTypeAny,
  TStreamResZ extends z.ZodTypeAny = never
>({
  route,
  handler,
}: {
  route: ApiRoute<TReqZ, TResZ>;
  handler: (
    ctx: ApiRouteContextFull<ApiRoute<TReqZ, TResZ>>
  ) => Promise<Response | TResZ["_output"]>;
}) {
    return {
        POST: makeServerApiHandlerV2({
            route,
            handler
        }),
        handler
    }
}