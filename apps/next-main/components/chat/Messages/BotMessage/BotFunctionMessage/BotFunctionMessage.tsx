import React from "react";

import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";

import {
  Card,
  Grid,
  Stack,
  useTheme,
} from "@mui/material";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {
  BotMessageProps,
  EmojiReactionsList,
} from "../BotMessage";
import {
  BotSuggestionMessage,
} from "./BotSuggestionMessage/BotSuggestionMessage";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export const SuggestionFunctionCalls = ["suggestLearningTopics"];

export function BotFunctionMessage({ msg, reactions, i }: BotMessageProps) {
  if (!msg.functionCall) {
    return null;
  } else {
    const parsedData = JSONSafeParse(msg.functionCall).data;
    if (!parsedData) {
      return null;
    }

    if (SuggestionFunctionCalls.includes(parsedData.name)) {
      return <BotSuggestionMessage i={i} msg={msg} data={parsedData} />;
    }
  }

  const authorId = msg.author?.id;

  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();
  return (
    <Stack key={`msg-${i}`} gap={0.5}>
      <Grid
        key={"msg-message"}
        container
        justifyContent="flex-start"
        flexDirection={"column"}
      >
        <Grid width={"100%"}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.default,
              borderRadius: "8px",
              padding: isSmallDevice ? "9px" : "13px",
              maxWidth: "80%",
              height: "min-content",
              width: "max-content",
            }}
            elevation={4}
          >
            <MuiMarkdownDefault>{msg.content}</MuiMarkdownDefault>
            {reactions && <EmojiReactionsList reactions={reactions} />}
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
