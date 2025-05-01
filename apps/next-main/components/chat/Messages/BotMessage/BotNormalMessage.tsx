import React from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  Card,
  Grid,
  Stack,
  useTheme,
} from "@mui/material";
import {useBotFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {
  BotMessageProps,
  EmojiReactionsList,
} from "./BotMessage";
import {BotMessageHeader} from "./BotMessageName";

export function BotNormalMessage({
  msg,
  reactions,
  i,
  isAuthorStillInChat,
  isEditingAuthor,
  setEditingAuthorId,
  disableEditing,
  overrideIcon,
  overrideName,
  overrideToolbar,
  isThinking,
  thinkingIcon
}: BotMessageProps) {
  const authorId = msg.author?.id;

  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();

  const {
    data: persona,
    error: personaError,
    loading: personaLoading,
  } = useBotFlatFragLoader(authorId);

  const usingName = overrideName ?? persona?.name;
  const usingEmoji = persona?.avatarEmoji ?? "🧒";

  // Only add data-testid when message is complete (not thinking)
  const cardProps = !isThinking ? { "data-testid": "assistant-message" } : {};

  return (
    <Stack key={`msg-${i}`} gap={0.5}>
      <BotMessageHeader
        isAuthorStillInChat={isAuthorStillInChat}
        persona={persona}
        overrideIcon={overrideIcon}
        overrideToolbar={overrideToolbar}
        usingName={usingName}
        usingEmoji={usingEmoji}
        isEditingAuthor={isEditingAuthor}
        setEditingAuthorId={setEditingAuthorId}
        disableEditing={disableEditing}
        isThinking={isThinking}
        thinkingIcon={thinkingIcon}
      />
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
            {...cardProps}
          >
            <MuiMarkdownDefault animateTyping>{msg.content}</MuiMarkdownDefault>
            {reactions && <EmojiReactionsList reactions={reactions} />}
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
