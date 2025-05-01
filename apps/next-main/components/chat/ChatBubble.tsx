import React from "react";


import {
  makeVar,
  useMutation,
  useReactiveVar,
} from "@apollo/client";
import {Chat} from "@mui/icons-material";
import {
  IconButton,
  Popover,
  useTheme,
} from "@mui/material";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {ChatInnerComponent} from "./ChatInnerComponent";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

/**
 * Whether the chat bubble is open.
 */
export const chatBubbleOpenVar = makeVar(false);

/**
 * The chatId of the chat that is open in the chat bubble.
 */
export const chatBubbleOpenChatIdVar = makeVar(null as string | null);

/**
 * SuggestedNextMessages for the chat bubble.
 */
export const chatBubbleSuggestedNextMessages = makeVar<string[]>([]);

/**
 * The page context provided to the AI in the chat bubble.
 */
export const vAIPageContext = makeVar(null as string | null);

/**
 * Options for interacting with the AI.
 */
export const vAIOptions = makeVar<{
  [name: string]: {
    icon: React.ReactNode;
    initializeChat: () => {
      systemMessage?: string;
      userMessage?: string;
    };
  };
}>({});

export function ChatBubble() {
  const chatOpen = useReactiveVar(chatBubbleOpenVar);
  const chatOpenId = useReactiveVar(chatBubbleOpenChatIdVar);
  const suggestedNextMessages = useReactiveVar(chatBubbleSuggestedNextMessages);
  const [createChat] = useMutation(createChatFlatMutDoc);

  const aiContext = useReactiveVar(vAIPageContext);
  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();
  // If the chat is open, and the chatId is null, then we need to create a new chat.
  useAsyncEffect(async () => {
    if (chatOpen && chatOpenId === null) {
      const res = await createChat({
        variables: {
          objects: [
            {
              isPublic: false,
            },
          ],
        },
      });

      const chatId = res.data?.insertIntoChatCollection?.records[0]?.id;

      if (chatId) {
        chatBubbleOpenChatIdVar(chatId);
      }
    }
  }, [chatOpen, chatOpenId, createChat]);

  const chatBubbleRef = React.useRef(null);

  return (
    <React.Fragment key={"bottom"}>
      <div 
        style={{
          position: "fixed",
          bottom: isSmallDevice ? ".5rem" : "2rem",
          right: isSmallDevice? ".5rem" : "2rem",
          zIndex: 1000,
        }}
      >
        <IconButton
          ref={chatBubbleRef}
          sx={{
            backgroundColor: chatOpen
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            ":hover": {
              backgroundColor: chatOpen
                ? theme.palette.primary.main
                : theme.palette.primary.dark,
            },
            color: chatOpen ? theme.palette.grey[200] : theme.palette.grey[200],
          }}
          onClick={() => {
            chatBubbleOpenVar(!chatOpen)
          }}
        >
          <Chat />
        </IconButton>
      </div>
      <Popover
        id={'chat-bubble-popover'}
        open={chatOpen}
        onClose={() => {
          chatBubbleOpenVar(false);
        }}
        anchorEl={chatBubbleRef.current}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        elevation={8}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              left: isSmallDevice ? "0px" : undefined,
              borderRadius: "10px", // rounded borders
              padding: ".5rem", // good padding
              // boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)", // optional drop shadow for a "floating" effect
              // zIndex: 999, // ensure the chat box appears below the button
              width: isSmallDevice ? "100vw" : "80vw",
              maxWidth: isSmallDevice ? "100vw" : "900px",
              maxHeight: "66vh",
              height: "66vh",
            }
          }
        }}
      >
        {chatOpenId && (
          <ChatInnerComponent
            chatId={chatOpenId}
            systemContextMessage={aiContext ?? undefined}
            suggestedNextMessages={suggestedNextMessages}
            onSendStart={(message) => {
              chatBubbleSuggestedNextMessages([]);
            }}
          />
        )}
      </Popover>
    </React.Fragment>
  );
}
