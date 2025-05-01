////////////////////////////////////////////////////////////////////////
// REQUEST
////////////////////////////////////////////////////////////////////////
import { z } from "zod";

import { ApiRoute } from "@reasonote/lib-api-sdk";

const OauthV2CallbackRouteRequestSchema = z.object({
  code: z.string(),
  state: z.string(),
});
export type OauthV2CallbackRouteRequestIn = z.input<
  typeof OauthV2CallbackRouteRequestSchema
>;
export type OauthV2CallbackRouteRequestOut = z.infer<
  typeof OauthV2CallbackRouteRequestSchema
>;

////////////////////////////////////////////////////////////////////////
// RESPONSE
////////////////////////////////////////////////////////////////////////
const OauthV2CallbackRouteResponseSchema = z.object({
  integration: z
    .object({
      id: z.string(),
      _type: z.string(),
    })
    .passthrough(),
});
export type OauthV2CallbackRouteResponse = z.infer<
  typeof OauthV2CallbackRouteResponseSchema
>;

////////////////////////////////////////////////////////////////////////
// ROUTE
////////////////////////////////////////////////////////////////////////
export const OauthV2CallbackRoute = new ApiRoute({
  path: "/api/integrations/notion/oauth/v2/callback",
  method: "post",
  requestSchema: OauthV2CallbackRouteRequestSchema,
  responseSchema: OauthV2CallbackRouteResponseSchema,
});
