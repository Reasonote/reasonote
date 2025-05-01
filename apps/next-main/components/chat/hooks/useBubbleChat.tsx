import {
  useCallback,
  useState,
} from "react";

import {
  useApolloClient,
  useReactiveVar,
} from "@apollo/client";
import {
  notEmpty,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {uuidv4} from "@reasonote/lib-utils";

import {
  chatBubbleOpenChatIdVar,
  chatBubbleOpenVar,
  chatBubbleSuggestedNextMessages,
  vAIPageContext,
} from "../ChatBubble";
import {
  asyncChat,
  useChat,
} from "./useChat";

export function useBubbleChat() {
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const ac = useApolloClient();
  const { sendMessage, fetchResponse: chatMessagesResult } = useChat({
    chatId,
  });
  const AIPageContext = useReactiveVar(vAIPageContext);

  const startBubbleChat = useCallback(
    async ({
      systemMessage,
      userMessage,
      suggestedNextMessages,
      autoStart,
    }: {
      systemMessage?: string;
      userMessage?: string;
      suggestedNextMessages?: string[];
      autoStart?: boolean;
    }) => {
      // Create a new chat
      const chatMut = await ac.mutate({
        mutation: createChatFlatMutDoc,
        variables: {
          objects: [
            {
              isPublic: false,
            },
          ],
        },
      });

      if (chatMut.errors) {
        throw new Error(`Failed to create chat: ${chatMut.errors}`);
      }

      const chatId = chatMut.data?.insertIntoChatCollection?.records[0]?.id;

      if (!chatId) {
        throw new Error(`Failed to create chat: ${chatMut.errors}`);
      }

      // Set that chat as the current chat
      chatBubbleOpenChatIdVar(chatId);
      chatBubbleOpenVar(true);
      chatBubbleSuggestedNextMessages(suggestedNextMessages ?? []);

      // Now send the initial messages for the chat.
      if (autoStart) {
        const res = await asyncChat({
          ac,
          chatId,
          messagesToSend: [
            systemMessage
              ? {
                  id: uuidv4(),
                  type: "message" as const,
                  role: "system" as const,
                  content: systemMessage,
                }
              : null,
            AIPageContext
              ? {
                  id: uuidv4(),
                  type: "message" as const,
                  role: "system" as const,
                  content: trimLines(`
                  <|ADDED_CONTEXT|>
                  <CONTEXT>
                  `).replace("<CONTEXT>", AIPageContext),
                }
              : null,
            userMessage
              ? {
                  id: uuidv4(),
                  type: "message" as const,
                  role: "user" as const,
                  content: userMessage,
                }
              : null,
          ].filter(notEmpty),
        });
      }
    },
    [ac, chatId, sendMessage, chatMessagesResult, AIPageContext]
  );

  return {
    startBubbleChat,
  };
}
