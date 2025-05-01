import React, {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import {useBotFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {BotFunctionMessage} from "./BotFunctionMessage/BotFunctionMessage";
import {BotNormalMessage} from "./BotNormalMessage";

export interface BotMessageProps {
  // TODO actual args
  msg: {
    content?: string | null;
    functionCall?: {
      name: string;
      args: any[];
    } | null;
    author?: any | null;
  };
  i: number;
  reactions?: { messageId: string; authorId: string; emoji: string }[];
  isAuthorStillInChat?: boolean;
  isEditingAuthor?: boolean;
  disableEditing?: boolean;
  setEditingAuthorId?: (id: string | null) => void;
  overrideIcon?: React.ReactNode;
  overrideName?: string;
  overrideToolbar?: React.ReactNode;
  isThinking?: boolean;
  thinkingIcon?: React.ReactNode;
}

export const fadeInStyle = {
  animation: "fadeIn 0.5s ease-in-out",
};

export type Reaction = {
  messageId: string;
  authorId: string;
  emoji: string;
};

export function SingleReactionPersonInList({ authorId }: { authorId: string }) {
  const persona = useBotFlatFragLoader(authorId);

  return persona.data ? <div key={authorId}>{persona.data.name}</div> : null;
}

/**
 * This is a List of emoji reactions which will display at the bottom left of a message component.
 *
 * For each unique emoji reaction, which should be a react button, it should show the count, and then the emoji.
 *
 * When mousing over the button, it should show the list of users who reacted with that emoji in a MUI Tooltip.
 *
 * All reactions of the same emoji should be clustered together.
 *
 * This should all be written in MUI style.
 */
export function EmojiReactionsList({
  reactions,
}: {
  reactions: { messageId: string; authorId: string; emoji: string }[];
}) {
  const [emojiReactionCount, setEmojiReactionCount] = useState<
    Map<string, Reaction[]>
  >(new Map());

  React.useEffect(() => {
    const groupedReactions = reactions.reduce(
      (grouped: Map<string, Reaction[]>, reaction: Reaction) => {
        const emoji = reaction.emoji;
        const existingReactions = grouped.get(emoji) || [];
        existingReactions.push(reaction);
        grouped.set(emoji, existingReactions);
        return grouped;
      },
      new Map<string, Reaction[]>()
    );
    setEmojiReactionCount(groupedReactions);
  }, [reactions]);

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {Array.from(emojiReactionCount.entries()).map(([emoji, reactions]) => (
        <Tooltip
          key={emoji}
          title={
            <Box>
              {reactions.map((reaction) => (
                <SingleReactionPersonInList
                  authorId={reaction.authorId}
                  key={reaction.authorId}
                />
              ))}
            </Box>
          }
        >
          <Chip
            size="small"
            label={reactions.length}
            avatar={
              <Stack
                alignContent="center"
                justifyContent={"center"}
                alignItems="center"
                justifyItems="center"
              >
                {emoji}
              </Stack>
            }
          />
        </Tooltip>
      ))}
    </Box>
  );
}

export function BotMessage({
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
  thinkingIcon,
}: BotMessageProps) {
  useEffect(() => {
  }, [])

  if (msg.functionCall) {
    return (
      <>
        <BotFunctionMessage
          msg={msg}
          reactions={reactions}
          i={i}
          isAuthorStillInChat={isAuthorStillInChat}
          isEditingAuthor={isEditingAuthor}
          setEditingAuthorId={setEditingAuthorId}
          disableEditing={disableEditing}
          overrideIcon={overrideIcon}
          overrideToolbar={overrideToolbar}
        />
      </>
    );
  } else {
    return (
      <BotNormalMessage
        msg={msg}
        reactions={reactions}
        i={i}
        isAuthorStillInChat={isAuthorStillInChat}
        isEditingAuthor={isEditingAuthor}
        setEditingAuthorId={setEditingAuthorId}
        disableEditing={disableEditing}
        overrideIcon={overrideIcon}
        overrideName={overrideName}
        overrideToolbar={overrideToolbar}
        isThinking={isThinking}
        thinkingIcon={thinkingIcon}
      />
    );
  }
}
