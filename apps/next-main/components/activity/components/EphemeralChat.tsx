import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import {z} from "zod";

import {BotMessage} from "@/components/chat/Messages/BotMessage/BotMessage";
import SuggestedNextMessage
  from "@/components/chat/Messages/SuggestedNextMessage";
import {SystemMessage} from "@/components/chat/Messages/SystemMessage";
import {UserMessage} from "@/components/chat/Messages/UserMessage";
import {ChatTextField} from "@/components/chat/TextField/ChatTextField";
import {PersonaSaveButton} from "@/components/personas/PersonaSaveButton";
import {
  Card,
  LinearProgress,
  Stack,
  StackProps,
  Typography,
} from "@mui/material";
import {
  ChatDriverConfigNoKeySchema,
  ChatDriverOpenaiRequestSchema,
} from "@reasonote/lib-ai-common";

import ChatTypingIndicator from "../../chat/ChatTypingIndicator";

export const ChatDirectRouteRequestSchema =
  ChatDriverOpenaiRequestSchema.omit({driverConfig: true}).extend({
    driverConfig: ChatDriverConfigNoKeySchema
  });
export type ChatDirectRouteRequestIn = z.input<
  typeof ChatDirectRouteRequestSchema
>;

export type EphemeralChatMessage = ChatDirectRouteRequestIn["messages"][0] & {
  id?: string;
  botId?: string;
  characterName?: string;
  characterIcon?: ReactNode | null;
}

export type EphMessageWithCharacterInfo = EphemeralChatMessage & {
  characterName: string;
  characterIcon?: ReactNode | null;
};

export function EphemeralChat({
  messages,
  onSend,
  sendOnMount,
  isResponding,
  emptyChatInfoBubble,
  suggestedNextMessages,
  isGeneratingSuggestedNextMessages,
  stackProps,
}: {
  messages: EphemeralChatMessage[];
  onSend: (message: EphemeralChatMessage) => void;
  sendOnMount?: boolean;
  isResponding?: boolean;
  stackProps?: StackProps;
  suggestedNextMessages?: string[];
  emptyChatInfoBubble?: ReactNode;
  isGeneratingSuggestedNextMessages?: boolean;
}) {
  const [msgToSend, setMsgToSend] = useState("");

  useEffect(() => {
    const bottomEl = document.querySelector("#chat-bottom");
    if (bottomEl) {
      bottomEl.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isResponding]);

  const onSendText = useCallback((txt: string) => {
    onSend({
      role: "user",
      content: txt,
    });
    setMsgToSend("");
  }, [msgToSend, onSend]);

  return (
    <Stack gap={1} {...stackProps}>
      <Stack sx={{ flex: "1 1 auto", overflow: "auto" }} gap={1}>
        {messages.map((message, idx) => {
          if (message.role === "system") {
            return <SystemMessage key={`system-message-${idx}`} msg={message} />;
          } else if (message.role === "user") {
            return <UserMessage 
              key={`user-message-${message.id || idx}`}
              msg={message} 
              overrideIcon={message.characterIcon}
              overrideName={message.characterName}
            />;
          } else if (message.role === "assistant") {
            return <BotMessage 
              key={`bot-message-${message.id || idx}`}
              msg={message} 
              i={idx} 
              disableEditing 
              overrideName={message.characterName}
              overrideIcon={message.characterIcon}
              overrideToolbar={message.botId ? <PersonaSaveButton iconProps={{fontSize: 'small'}} iconBtnProps={{size: 'small'}} botId={message.botId}/> : undefined}
            />;
          }

          return null;
        })}
        {
          messages.length === 0 && emptyChatInfoBubble
            ? <Stack>
                {emptyChatInfoBubble}
              </Stack>
            : null
        }
        {
          isResponding ? null : suggestedNextMessages?.map((msg, i) => {
            return <SuggestedNextMessage key={`suggested-next-${i}`} msg={msg} i={i} sendMessage={onSendText} />
          }) ?? null
        }
        {
          isGeneratingSuggestedNextMessages && (
            <Stack gap={1} width={'100%'} alignItems={'end'}>
              <div style={{width: 'fit-content'}}>
                <Typography variant="caption" color={(t) => t.palette.gray.light}>
                  Suggesting Messages...
                </Typography>
                <LinearProgress />
              </div>
            </Stack>
          )
        }
        {
          isResponding && (
            <Card elevation={5} sx={{padding: 0, margin: 0, width: 'fit-content'}}>
              <ChatTypingIndicator />
            </Card>
          )
        }
        <div
          id="chat-bottom"
          style={{
            height: "1px",
            width: "1px",
          }}
        ></div>
      </Stack>
      
      <ChatTextField 
        text={msgToSend} 
        setText={(text: string) => {
          setMsgToSend(text);
        }} 
        sendButtonClick={() => {
          onSend({
            role: "user",
            content: msgToSend,
          });
          setMsgToSend("");
        }}
        textFieldProps={{
            size: 'small',
            maxRows: 6,
        }}
        buttonProps={{
            size: 'small'
        }}
        textSendIsDisabled={msgToSend.trim().length === 0} 
        onKeyUp={(ev: KeyboardEvent<HTMLDivElement>) => {
          if (ev.key === "Enter" && !ev.shiftKey) {
            onSend({
              role: "user",
              content: msgToSend,
            });
            setMsgToSend("");
          }
        }}
      />
    </Stack>
  );
}