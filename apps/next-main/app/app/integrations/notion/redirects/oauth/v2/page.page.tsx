"use client";
import React from "react";

import _ from "lodash";
import {useSearchParams} from "next/navigation";

import {useQuery} from "@apollo/client";
import {jwtBearerify} from "@lukebechtel/lab-ts-utils";
import {
  Check,
  Error,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {ResponseOf} from "@reasonote/lib-api-sdk";
import {getIntegrationFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {useRsnUser} from "../../../../../../../clientOnly/hooks/useRsnUser";
import {BaseCallout} from "../../../../../../../components/cards/BaseCallout";
import FullCenter from "../../../../../../../components/positioning/FullCenter";
import {
  useSupabase,
} from "../../../../../../../components/supabase/SupabaseProvider";
import {
  OauthV2CallbackRoute,
} from "../../../../../../api/integrations/notion/oauth/v2/callback/routeSchema";

const throttledEffect = _.throttle(
  async ({
    state,
    code,
    authorization,
    cb,
  }: {
    state: string;
    code: string;
    authorization: string;
    cb: (res: ResponseOf<typeof OauthV2CallbackRoute>) => void;
  }) => {
    const resp = await OauthV2CallbackRoute.call(
      {
        code,
        state,
      },
      {
        headers: {
          Authorization: jwtBearerify(authorization),
        },
      }
    );

    cb(resp);
  },
  1000
);

export default function OAuthReceiver({ query }: { query: any }) {
  const theme = useTheme();
  const [status, setStatus] = React.useState<"loading" | "success" | "error">(
    "loading"
  );
  /** Load the query parameters */
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const code = searchParams?.get("code");
  const state = searchParams?.get("state");
  const { rsnUserId, sbSession } = useRsnUser();

  const { data } = useQuery(getIntegrationFlatQueryDoc, {
    variables: {
      filter: {
        createdBy: { eq: rsnUserId ?? "<FAKE>" },
        type: { eq: "notion" },
      },
    },
  });

  // TODO: handle different states here,
  // - cancelled
  // - success
  // - ....
  // Particularly, we probably want to handle things here in a notion specific way.
  // For example, we probably want to show the user the databases / pages they picked.
  // And then give them the option to reconfigure if they want to.
  // If they're happy with it, we should probably ask them some questions
  // about their notion database, and what their data means.

  useAsyncEffect(async () => {
    console.log("these things", code, state, sbSession?.session?.access_token);
    if (
      !code ||
      state === undefined ||
      state === null ||
      !sbSession?.session?.access_token
    ) {
      return;
    }

    console.log("calling...");
    throttledEffect({
      code,
      state,
      authorization: sbSession?.session?.access_token,
      cb: (res) => {
        console.log("hmmm");
        if (res.data) {
          console.log(res.data);
          setStatus("success");
        } else {
          setStatus("error");
        }
      },
    });
  }, [code, state, sbSession]);

  return (
    <FullCenter>
      <Paper style={{ maxWidth: "66vw", padding: "10px" }}>
        <Typography variant={"h3"}>Notion Integration</Typography>

        <Typography variant={"h4"}>Status</Typography>

        <BaseCallout
          backgroundColor={
            status === "loading"
              ? theme.palette.info.dark
              : status === "success"
              ? theme.palette.success.light
              : theme.palette.error.main
          }
          overrides={{
            paper: {},
          }}
          sx={{
            paper: {
              width: "100%",
            },
          }}
          icon={
            status === "loading" ? (
              <CircularProgress sx={{ color: theme.palette.text.primary }} />
            ) : status === "success" ? (
              <Check color="success" />
            ) : (
              <Error />
            )
          }
          header={
            <Typography variant={"h5"}>
              {status === "loading"
                ? "Authenticating with Notion..."
                : status === "success"
                ? "Success!"
                : "Error"}
            </Typography>
          }
        >
          {status === "loading" && (
            <Typography variant={"body1"}>
              <CircularProgress sx={{ color: theme.palette.text.primary }} />
            </Typography>
          )}
          {status === "success" && (
            <Typography variant={"body1"}>
              Successfully connected to Notion!
            </Typography>
          )}
          {status === "error" && (
            <Stack>
              <Typography variant={"body1"}>
                Something went wrong when trying to connect to Notion.
              </Typography>
              <br />
              <Typography variant={"body1"}>Please try again.</Typography>
              <Button
                href={process.env.NEXT_PUBLIC_RSN_NOTION_AUTHORIZATION_URL}
                variant={"contained"}
              >
                Try Again
              </Button>
            </Stack>
          )}
        </BaseCallout>
      </Paper>
    </FullCenter>
  );
}
