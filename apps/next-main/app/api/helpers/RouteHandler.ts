import { ApiRoute } from "@reasonote/lib-api-sdk";
import { ApiRouteContextFull } from "./ApiRouteContext";
import { z } from "zod";

export type RouteHandler<
    TRoute extends ApiRoute<TReqZ, TResZ>,
    TReqZ extends z.ZodTypeAny = z.ZodTypeAny,
    TResZ extends z.ZodTypeAny = z.ZodTypeAny
> = (
    ctx: ApiRouteContextFull<TRoute>
) => Promise<Response | TResZ["_output"]>;