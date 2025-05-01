"use client";
import React, { useEffect, useMemo, useState } from "react";

import _ from "lodash";

import { Card, LinearProgress, Stack, Typography, useTheme } from "@mui/material";

import { Message } from "./Message";
import { sampleConversations } from "./sampleConversations";

const botAnimation = `
  @keyframes slideInBot {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const userAnimation = `
  @keyframes slideInUser {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const generalStyle = `
.chat-container {
    width: 60%;
    padding: 20px;
    border-radius: 8px;
    background-color: #ffffff;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
}

.message {
    max-width: 70%;
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 8px;
    opacity: 0;
    animation: slideIn 0.5s forwards;
}

.bot {
    margin-left: 5px;
    background-color: #e9e9e9;
}

.user {
    margin-right: 5px;
    background-color: #4db6ac;
    align-self: flex-end;
}

.bot {
    animation-name: slideInBot;
}

.user {
    animation-name: slideInUser;
}

`;

const ChatAnimation: React.FC = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [index, setIndex] = useState(0);

  const messagesData = useMemo(() => {
    // select randomly from the sampleConversations
    const randomIndex = _.sample(_.keys(sampleConversations));
    if (!randomIndex) return [];
    return sampleConversations[randomIndex].messages;
  }, []);

  useEffect(() => {
    if (index >= messagesData.length) return;

    const botTimePerCharacter = 10;
    const userTimePerCharacter = 50;
    const time =
      messagesData[index].type === "bot"
        ? messagesData[index].text.length * botTimePerCharacter
        : messagesData[index].text.length * userTimePerCharacter;
    const timer = setTimeout(() => {
      setMessages((prevMessages) => [...prevMessages, messagesData[index]]);
      setIndex(index + 1);
    }, time);

    return () => clearTimeout(timer);
  }, [index]);

  const isGenerating = messagesData[index]?.type === "bot";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        width: "100%",
      }}
    >
      {messages.map((message) => {
        const fadeInStyle = {
          animation:
            message.type === "bot"
              ? "slideInBot 1s forwards"
              : "slideInUser 1s forwards",
        };

        const messageStyle = {
          display: "flex",
          flexDirection: "row" as const,
          justifyContent: message.type === "bot" ? "flex-start" : "flex-end",
          width: "100%",
          ...fadeInStyle,
        };

        return (
          <div key={message.id} style={messageStyle}>
            <Card
              style={{
                backgroundColor:
                  message.type === "bot"
                    ? "lightgray"
                    : theme.palette.primary.main,
                borderRadius: "5px",
                padding: "10px",
                maxWidth: "80%",
                width: "max-content",
              }}
            >
              <Typography
                variant="body1"
                align={message.type === "bot" ? "left" : "right"}
                style={{
                  color: message.type === "bot" ? theme.palette.background.default : theme.palette.text.primary,
                }}
              >
                {message.text}
              </Typography>
            </Card>
          </div>
        );
      })}
      {isGenerating && (
        <Stack
          sx={{ animation: "slideInBot 1s forwards" }}
          alignItems="left"
          width="100%"
          paddingTop="20px"
          paddingBottom="20px"
        >
          <Stack alignItems="left" width="80%">
            <LinearProgress sx={{ width: "60%" }} />
          </Stack>
        </Stack>
      )}

      <style>
        {`
          @keyframes slideInBot {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideInUser {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatAnimation;
