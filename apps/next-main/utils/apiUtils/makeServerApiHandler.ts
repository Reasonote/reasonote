import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { ApiRoute } from "@reasonote/lib-api-sdk";

import { BasicRequestContext } from "./BasicRequestContext";

export function makeServerApiHandler<
  TReqZ extends z.ZodTypeAny,
  TResZ extends z.ZodTypeAny,
  TStreamResZ extends z.ZodTypeAny = never
>({
  route,
  handler,
  performAuthentication,
  performAuthorization,
}: {
  route: ApiRoute<TReqZ, TResZ>;
  handler: (
    ctx: BasicRequestContext<ApiRoute<TReqZ, TResZ>>
  ) => Promise<TResZ["_output"] | undefined>;
  performAuthentication?: (
    ctx: BasicRequestContext<ApiRoute<TReqZ, TResZ>>
  ) => Promise<{ authenticated: boolean; reason: string; metadata?: any }>;
  performAuthorization?: (
    ctx: BasicRequestContext<ApiRoute<TReqZ, TResZ>>
  ) => Promise<{ authorized: boolean; reason: string; metadata?: any }>;
}) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<TResZ["_output"]>
  ) => {
    // Initialize the request context.
    const ctx = new BasicRequestContext({
      nextApiRequest: req,
      nextApiResponse: res,
      apiRoute: route,
    });

    // Run the authenticator, if provided.
    if (performAuthentication) {
      const { authenticated, reason, metadata } = await performAuthentication(
        ctx
      );
      if (!authenticated) {
        // 401 means "unauthorized".
        res.status(401).json({
          error: {
            message: reason,
            metadata,
          },
        });
        return;
      }
    }

    // Run the authorizer, if provided.
    if (performAuthorization) {
      const { authorized, reason, metadata } = await performAuthorization(ctx);
      if (!authorized) {
        // 403 means "forbidden".
        res.status(403).json({
          error: {
            message: reason,
            metadata,
          },
        });
        return;
      }
    }

    // Use the handler to process the request.
    const result = await handler(ctx);

    // If the handler returned undefined, then it has already sent a response.
    if (result === undefined) {
      return;
    } else {
      // Send the response.
      res.status(200).json(result);
    }
  };
}
