"use client";
import React, {
  useEffect,
  useState,
} from "react";

import {CoreMessage} from "ai";
import _ from "lodash";

import {ChatHeader} from "@/components/chat/ChatHeader/ChatHeader";
import {useChat} from "@/components/chat/hooks/useChat";
import {ChatTextField} from "@/components/chat/TextField/ChatTextField";
import {
  Box,
  Divider,
  Stack,
} from "@mui/material";
import {CtxInjectorRegistryWithUnknowns} from "@reasonote/core";
import {
  RNAgentCMRInvokeConfig,
  RNAgentToolInvokeConfig,
} from "@reasonote/lib-ai-common";

import {
  CoreMessageDisplay,
  ToolCallStateMap,
} from "../classroom/ClassroomChatMessages";
import {ChatMessageToCoreMessage} from "./ChatInnerComponent";
import ChatTypingIndicator from "./ChatTypingIndicator";

export function ChatV2({
    chatId,
    botInfo,
    onSendMessage,
    textSendIsDisabled: externalTextSendIsDisabled,
    loadingIcon,
    tools,
    systemPrompt,
    contextInjectors,
    contextMessageRenderers,
    botThinkingIcon
  }: {
    chatId: string;
    botInfo: {
      name: string;
      description: string;
      avatar: string;
    };
    onSendMessage?: (text: string) => void;
    textSendIsDisabled?: boolean;
    loadingIcon?: React.ReactNode;
    botThinkingIcon?: React.ReactNode;
    tools?: RNAgentToolInvokeConfig<any>[];
    systemPrompt?: string;
    contextInjectors?: CtxInjectorRegistryWithUnknowns;
    contextMessageRenderers?: RNAgentCMRInvokeConfig[];
  }) {
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
    const [text, setText] = useState("");
    const [toolCallState, setToolCallState] = useState<ToolCallStateMap>({});
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Use the chat hook to automatically fetch messages
    const { 
      fetchResponse: chatMessagesResult,
      sendMessage
    } = useChat({
      chatId
    });
    
    // Extract the chat messages from the query result
    const chatMessages = chatId 
      ? (chatMessagesResult.data?.chatMessageCollection?.edges || []).map(edge => ChatMessageToCoreMessage(edge.node)) as (CoreMessage & { id: string })[]
      : [];
      
    // Handle sending a message
    const sendButtonClick = async (message: string) => {
      if (message.trim()) {
        setText("");
        setIsGenerating(true);
        
        try {
            if (onSendMessage) {
                // Async handler
                Promise.resolve(onSendMessage(message));
            }
            console.log('sending message', message)
            // Otherwise use the hook's sendMessage function
            await sendMessage({
                id: `msg_${Math.random().toString(36).substring(2, 15)}`,
                type: "message",
                role: "user",
                content: message
            }, {
                tools,
                systemPrompt,
                contextInjectors,
                contextMessageRenderers
            });
        } catch (error) {
          console.error("Error sending message:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    // Handle key press events
    const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendButtonClick(text);
      }
    };
    
    // Dummy function for tool answers
    const submitToolAnswers = (toolCallId: string, answers: any) => {
      console.log("Tool answers submitted:", toolCallId, answers);
      // Implement tool answer submission if needed
    };
    
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      const bottomEl = document.querySelector("#chat-bottom");
      if (bottomEl && !userHasScrolledUp) {
        //@ts-ignore
        bottomEl.scrollIntoView({ behavior: "instant"});
      }
    }, [chatMessages, userHasScrolledUp]);
    
    // Detect when user scrolls up
    useEffect(() => {
      const handleScroll = () => {
        const chatContainer = document.querySelector('[data-chat-scroll-container]');
        if (chatContainer) {
          const { scrollTop, scrollHeight, clientHeight } = chatContainer as HTMLElement;
          const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
          setUserHasScrolledUp(!isAtBottom);
        }
      };
      
      const chatContainer = document.querySelector('[data-chat-scroll-container]');
      if (chatContainer) {
        chatContainer.addEventListener('scroll', handleScroll);
      }
      
      return () => {
        if (chatContainer) {
          chatContainer.removeEventListener('scroll', handleScroll);
        }
      };
    }, []);

    // Loading state from the query
    const isLoading = chatMessagesResult.loading;
    const textSendIsDisabled = externalTextSendIsDisabled || isGenerating || isLoading;

    return (
      <>
        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          height="100%"
          boxSizing={"border-box"}
        >
          <Box flexShrink={0}>
            {/* Chat header */}
            {chatId && <Stack alignItems={"center"} width="100%">
              <ChatHeader chatId={chatId} />
              <Divider sx={{ width: "100%" }} />
            </Stack>}
          </Box>
          <Box 
            flexGrow={1} 
            overflow="auto"
            data-chat-scroll-container
          >
            <Stack
              padding="5px"
              boxSizing="border-box"
              justifyContent="center"
              gap="10px"
              alignContent="center"
              flexDirection={"column"}
              width={"100%"}
              sx={{ overFlowX: "none" }}
            >
              {chatMessages?.map((msg, i) => {
                return <CoreMessageDisplay
                  key={msg.id}
                  message={msg}
                  botInfo={botInfo}
                  botThinkingIcon={botThinkingIcon}
                  botIsThinking={isGenerating}
                  toolCallState={toolCallState}
                  setToolCallState={setToolCallState}
                  submitToolAnswers={submitToolAnswers}
                  isLastMessage={i === chatMessages.length - 1}
                />
              })}  
              {isGenerating ?
                loadingIcon ?
                  <>
                    {loadingIcon}
                  </>
                  :
                  <ChatTypingIndicator />
                : null
              }
              <div
                id="chat-bottom"
                style={{
                  height: "1px",
                  width: "1px",
                }}
              ></div>
            </Stack>
          </Box>
          <Box flexShrink={0}>
            <div
              style={{
                minHeight: "min-content",
                width: "100%",
                alignSelf: "end",
              }}
            >
              <ChatTextField
                textFieldProps={{
                  inputProps: {
                    "data-testid": "user-input"
                  },
                }}
                buttonProps={{
                  //@ts-ignore
                  "data-testid": "send-message"
                }}
                sendButtonClick={sendButtonClick}
                onKeyUp={onKeyUp}
                text={text}
                setText={setText}
                textSendIsDisabled={textSendIsDisabled}
              />
            </div>
          </Box>
        </Box>
      </>
    );
  } 