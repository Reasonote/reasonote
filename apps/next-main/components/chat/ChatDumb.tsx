import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {CoreMessage} from "ai";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Info} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  Divider,
  Grid,
  Skeleton,
  Stack,
} from "@mui/material";
import {RNCoreMessage} from "@reasonote/lib-ai-common";
import {useBotFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {CoreMessageDisplay} from "../classroom/ClassroomChatMessages";
import {Txt} from "../typography/Txt";
import {ChatHeader} from "./ChatHeader/ChatHeader";
import ChatTypingIndicator from "./ChatTypingIndicator";
import {useChatMembers} from "./hooks/useChatMembers";
import SuggestedNextMessage from "./Messages/SuggestedNextMessage";
import {ChatTextField} from "./TextField/ChatTextField";

export interface ChatDumbComponentProps {
    chatId: string;
    onSend: (textToSend: string) => Promise<void>;
    chatMessages: RNCoreMessage[];
    suggestedNextMessages?: string[];
    isGenerating: boolean;
    // ... any other props you need
}

const BotDescriptorCard = ({botId}) => {
    const {data: bot, loading} = useBotFlatFragLoader(botId);

    const isSmallDevice = useIsSmallDevice();

    return loading ?
        <Skeleton variant="rounded" width={40} height={40} />
        :
        <Stack gap="5px" alignItems={'center'} justifyContent={'center'} maxWidth={isSmallDevice ? '100%' : '500px'}>
            <Txt variant="caption">Chatting with...</Txt>
        
            <Card elevation={3} >
                <Stack padding="5px" gap="5px" alignItems={'center'} justifyContent={'center'}>
                    
                    <Avatar>
                        {bot?.avatarEmoji ?? '🧒'}
                    </Avatar>
                    <Txt variant="h6">
                        {bot?.name ?? 'Bot'}
                    </Txt>
                  
                    <Txt sx={{whiteSpace: 'pre-line',maxHeight: '200px', overflow: 'auto'}}>{bot?.description ?? 'A friendly bot.'}

                    </Txt>
                    <Divider />
                </Stack>
            </Card>
            <Txt stackOverrides={{sx: {paddingTop: '10px'}}} startIcon={<Info/>} variant={'caption'}><i>Type below to start the chat</i></Txt>
        </Stack>
}

export const ChatDumbComponent = ({
    chatId,
    onSend,
    chatMessages,
    suggestedNextMessages,
    isGenerating,
}: ChatDumbComponentProps) => {
    const [text, setText] = useState("");

    const sendButtonClick = useCallback(async () => {
        const sendingText = text;
        setText("");
        await onSend(sendingText);
    }, [text, onSend]);

    const onKeyUp = (ev: React.KeyboardEvent<HTMLDivElement>) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
            sendButtonClick();
        }
    };

    useEffect(() => {
        const bottomEl = document.querySelector("#chat-bottom");
        if (bottomEl) {
            //@ts-ignore
            bottomEl.scrollIntoView({ behavior: "instant" });
        }
    }, [chatMessages]);

    const chatMembersRes = useChatMembers({chatId});

    const textSendIsDisabled = text.length === 0;

    const firstBotId = chatMembersRes?.data?.memberAuthorizationCollection?.edges?.[0]?.node?.botId ?? "";

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
                    <Stack alignItems={"center"} width="100%">
                        <ChatHeader chatId={chatId} />
                    </Stack>
                    <Divider sx={{ width: "100%" }} />
                </Box>
                <Box flexGrow={1} overflow="auto">
                    {
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
                                sx={{ overFlowX: "none", margin: '0 auto', alignSelf: 'center', justifySelf: 'center'}}
                            >
                                <BotDescriptorCard botId={firstBotId} />
                            </Stack>
                        )
                    }
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
                                key={`msg-${i}`} 
                                message={msg as CoreMessage & {id: string}} 
                                botInfo={{name: 'Bot', description: 'A friendly bot.', avatar: '🧒'}} 
                                toolCallState={{}} 
                                setToolCallState={() => {}} 
                                submitToolAnswers={() => {}} 
                                botIsThinking={isGenerating} 
                                botThinkingIcon={<ChatTypingIndicator />} 
                                isLastMessage={i === chatMessages.length - 1} 
                            />
                        })}
                        {
                        isGenerating && (
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
                </Box>
                <Box flexShrink={0}>
                    {suggestedNextMessages && suggestedNextMessages.length > 0 && chatMessages.filter(msg => msg.role !== 'system').length === 0 && (
                        <Box sx={{ width: '100%', mb: 0.5, mt: 0.5 }}>
                            <Grid container spacing={0.75} sx={{ maxWidth: '600px', margin: '0 auto', px: 1 }}>
                                {suggestedNextMessages.slice(0, 4).map((msg, i) => (
                                    <Grid item xs={6} sm={6} key={`suggested-next-${i}`}>
                                        <SuggestedNextMessage msg={msg} i={i} sendMessage={onSend} />
                                    </Grid>
                                ))}
                                {/* Add placeholder items if we have fewer than 2 suggestions to maintain layout */}
                                {suggestedNextMessages.length === 1 && (
                                    <Grid item xs={6} sm={6} key="placeholder-item">
                                        <Box sx={{ height: '100%', minHeight: '40px' }} />
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
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
                                    "data-testid": `chat-text-field-${chatId}`,
                                },
                            }}
                            buttonProps={{
                                //@ts-ignore
                                "data-testid": `chat-send-button-${chatId}`
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
};

