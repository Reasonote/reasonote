import { BasicApiError } from "../../../../../helpers/errors";
import { makeServerApiHandlerV2 } from "../../../../../helpers/serverApiHandlerV2";
import { OauthV2CallbackRoute } from "./routeSchema";

export const POST = makeServerApiHandlerV2({
  route: OauthV2CallbackRoute,
  handler: async (ctx) => {
    const { supabase, SUPERUSER_supabase, apiEnv, user, logger } = ctx;

    const { state, code } = ctx.parsedReq;

    // Get our user from supabase.
    const rsnUserId = user?.rsnUserId;

    if (!rsnUserId) {
      throw new BasicApiError(
        "No user provided. This route requires authorization -- are you logged in?",
        400
      );
    }

    const ret = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            apiEnv.RSN_NOTION_CLIENT_ID + ":" + apiEnv.RSN_NOTION_CLIENT_SECRET
          ).toString("base64"),
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: apiEnv.NEXT_PUBLIC_RSN_NOTION_REDIRECT_URL,
        client_id: process.env.NOTION_CLIENT_ID,
      }),
    });

    if (ret.status !== 200) {
      let _failureJson: any;
      try {
        _failureJson = await ret.json();
      } catch (err: any) {
        throw new BasicApiError("Could not get access token.", 400, {
          notionResponse: {
            status: ret.status,
          },
        });
      }

      throw new BasicApiError("Could not get access token.", 400, {
        notionResponse: {
          status: ret.status,
          json: _failureJson,
        },
      });
    }

    const retJson = await ret.json();
    const authToken = retJson.access_token;

    // TODO: user: Check if there is an integration of type 'notion'
    // If there is no integration for this user, create one.
    // Get Existing integration.
    let integrationResp = await ctx.supabase
      .from("integration")
      .select("*")
      .eq("created_by", rsnUserId)
      .eq("_type", "notion");
    let integration =
      integrationResp.data && integrationResp.data.length > 0
        ? integrationResp.data[0]
        : undefined;

    if (!integration) {
      logger.debug("CREATING INTEGRATION");
      integrationResp = await ctx.supabase
        .from("integration")
        .insert({
          created_by: rsnUserId,
          _type: "notion",
          metadata: {
            ...retJson,
            // Unset access_token on integration... this is stored in integration_token.
            access_token: undefined,
          },
        })
        .select("*");

      if (!integrationResp.data || integrationResp.data.length === 0) {
        throw new Error("Could not create integration.");
      }

      integration =
        integrationResp.data && integrationResp.data.length > 0
          ? integrationResp.data[0]
          : undefined;
    } else {
      // Set the metadata again.
      logger.debug("FOUND INTEGRATION");
      integrationResp = await ctx.supabase
        .from("integration")
        .update({
          metadata: {
            ...retJson,
            // Unset access_token on integration... this is stored in integration_token.
            access_token: undefined,
          },
        })
        .eq("id", integration.id)
        .select("*");

      if (!integrationResp.data || integrationResp.data.length === 0) {
        throw new BasicApiError("Could not update integration.", 500, {
          integrationResp,
        });
      }

      integration =
        integrationResp.data && integrationResp.data.length > 0
          ? integrationResp.data[0]
          : undefined;
    }

    if (!integration) {
      throw new BasicApiError("Could not create integration.", 500, {
        integrationResp,
      });
    }

    // TODO: SUPERUSER: Check if there is an integration_token for this integration.
    let integrationTokenResp = await ctx.SUPERUSER_supabase.from(
      "integration_token"
    )
      .select("*")
      .eq("integration_id", integration.id);

    if (!integrationTokenResp.data || integrationTokenResp.data.length === 0) {
      logger.debug("CREATING INTEGRATION TOKEN");
      integrationTokenResp = await ctx.SUPERUSER_supabase.from(
        "integration_token"
      )
        .insert({
          integration_id: integration.id,
          token: authToken,
          metadata: retJson,
        })
        .select("*");
    } else {
      logger.debug("FOUND INTEGRATION TOKEN");
      integrationTokenResp = await ctx.SUPERUSER_supabase.from(
        "integration_token"
      )
        .update({
          token: authToken,
          metadata: retJson,
        })
        .eq("integration_id", integration.id)
        .limit(1)
        .select("*");
    }

    if (!integrationTokenResp.data || integrationTokenResp.data.length === 0) {
      throw new BasicApiError("Could not update integration.", 500, {
        integrationTokenResp,
      });
    }

    return {
      integration,
    };
  },
});
