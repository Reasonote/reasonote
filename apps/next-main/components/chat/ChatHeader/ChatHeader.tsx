"use client";
import _ from "lodash";

import {useApolloClient} from "@apollo/client";
import {
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {useChatFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

export function ChatHeader({ chatId }: { chatId?: string }) {
  const ac = useApolloClient();
  const { data, error, loading } = useChatFlatFragLoader(chatId);

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <div>Error loading chat header.</div>;
  }

  if (!data) {
    return <div>Chat not found.</div>;
  }

  const manualTitle =
    data.manualTitle && data.manualTitle.trim().length > 0
      ? data.manualTitle.trim()
      : undefined;
  const autoTitle =
    data.autoTitle && data.autoTitle.trim().length > 0
      ? data.autoTitle.trim()
      : undefined;
  const chatTitle = manualTitle ?? autoTitle ?? undefined;

  return (
    <Stack width="100%" style={{ paddingTop: "10px" }}>
      <Stack
        gap={1}
        direction="row"
        alignItems="center"
        justifyItems="center"
        alignContent="center"
        justifyContent={"center"}
      >
        {chatTitle && (
          <Typography fontStyle={"italic"} color={"gray"}>
            {chatTitle}
          </Typography>
        )} 
      </Stack>
    </Stack>
  );
}
