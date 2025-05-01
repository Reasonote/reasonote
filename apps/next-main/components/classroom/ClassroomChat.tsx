"use client";
import React, {
  useEffect,
  useState,
} from "react";

import {CoreMessage} from "ai";
import _ from "lodash";

import {ChatHeader} from "@/components/chat/ChatHeader/ChatHeader";
import {ChatTextField} from "@/components/chat/TextField/ChatTextField";
import {
  Box,
  Divider,
  Stack,
} from "@mui/material";

import ChatTypingIndicator from "../chat/ChatTypingIndicator";
import {
  CoreMessageDisplay,
  ToolCallStateMap,
} from "./ClassroomChatMessages";

export function ClassroomChat({
    chatId,
    chatMessages,
    isGenerating,
    sendButtonClick,
    onKeyUp,
    botInfo,
    text,
    setText,
    textSendIsDisabled,
    toolCallState,
    setToolCallState,
    submitToolAnswers,
    loadingIcon,
    botThinkingIcon
  }: {
    chatId?: string;
    chatMessages: (CoreMessage & { id: string })[];
    isGenerating: boolean;
    sendButtonClick: (text: string) => void;
    onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    text: string;
    setText: (text: string) => void;
    textSendIsDisabled: boolean;
    botInfo: {
      name: string;
      description: string;
      avatar: string;
    }
    toolCallState: ToolCallStateMap
    setToolCallState: (updater: (state: ToolCallStateMap) => ToolCallStateMap) => void
    submitToolAnswers: (toolCallId: string, answers: any) => void,
    loadingIcon?: React.ReactNode,
    botThinkingIcon?: React.ReactNode
  }) {
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  
  
    useEffect(() => {
        const bottomEl = document.querySelector("#chat-bottom");
        if (bottomEl && !userHasScrolledUp) {
            //@ts-ignore
            bottomEl.scrollIntoView({ behavior: "instant"});
        }
    }, [chatMessages]);

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
          <Box flexGrow={1} overflow="auto">
            {/* {
              chatMessages.filter((cm) => cm.role !== 'system').length === 0 && (
                <Stack
                  padding="5px"
                  boxSizing="border-box"
                  justifyContent="center"
                  gap="10px"
                  alignItems="center"
                  flexDirection={"column"}
                  width={"100%"}
                  height={"100%"}
                  sx={{ overFlowX: "none", margin: '0 auto', alignSelf: 'center', justifySelf: 'center' }}
                >
                  <BotDescriptorCard botId={firstBotId} />
                </Stack>
              )
            } */}
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
                    {/* <BotMessageHeader isAuthorStillInChat={false} persona={botInfo} disableEditing usingName={botInfo.name} overrideIcon={botInfo.avatar} usingEmoji={botInfo.avatar}/> */}
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
          <div
              id="chat-bottom"
              style={{
                  height: "1px",
                  width: "1px",
              }}
          />
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