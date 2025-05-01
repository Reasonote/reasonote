import React, {
  useCallback,
  useEffect,
} from "react";

import {ChatDrawerState} from "@/clientOnly/state/chatDrawer";
import {
  useMutation,
  useReactiveVar,
} from "@apollo/client";
import {ArrowDownward} from "@mui/icons-material";
import {
  Stack,
  styled,
  SwipeableDrawer,
  useTheme,
} from "@mui/material";
import {grey} from "@mui/material/colors";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {ChatComponent} from "../Chat";

const drawerBleeding = 15;

const Puller = styled('div')(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[900],
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
  }));

export function ChatDrawer() {
    const theme = useTheme();
    const isOpen = useReactiveVar(ChatDrawerState.isOpenVar);
    const chatId = useReactiveVar(ChatDrawerState.chatIdVar);
    const suggestedNextMesages = useReactiveVar(ChatDrawerState.suggestedNextMessagesVar);
    const [createChat] = useMutation(createChatFlatMutDoc)

    const setDrawerState = useCallback((open: boolean) => {
        ChatDrawerState.isOpenVar(open);
    }, [isOpen]);

    const creatingStateRef = React.useRef<"idle" | "creating" | "complete" | "failed">("idle");

    useEffect(() => {
        creatingStateRef.current = "idle";
    }, [chatId])

    useAsyncEffect(async () => {
        if (isOpen && !chatId && creatingStateRef.current === "idle") {
            creatingStateRef.current = "creating";
            console.log("Creating new chatroom");
            // Create the new chatroom
            const result = await createChat({
                variables: {
                objects: [
                    {
                    isPublic: false,
                    },
                ],
                },
            });

            // Get the new chatroom's ID
            const newChat = result.data?.insertIntoChatCollection?.records[0];

            if (!newChat) {
                creatingStateRef.current = "failed";
                console.error(`Failed to create new chatroom`);
            }
            else {
                ChatDrawerState.chatIdVar(newChat.id);
                creatingStateRef.current = "idle";
            }
        }
    }, [isOpen, chatId]);

    // console.log('ChatDrawer chatId', chatId);

    return <React.Fragment key={'ChatDrawer'}>
        {/* <Button onClick={() => setDrawerState(!isOpen)}>Drawer</Button> */}
        {/* @ts-ignore */}
        <SwipeableDrawer
            anchor={'bottom'}
            open={isOpen}
            onClose={() => setDrawerState(false)}
            onOpen={() => setDrawerState(true)}
            swipeAreaWidth={drawerBleeding}
            PaperProps={{
                sx: {
                    alignContent: 'center',
                    background: 'transparent',
                },
                onClick: (e) => {
                    setDrawerState(!isOpen);
                }
            }}
        >
            <Stack width={'100%'} justifyContent={'center'} alignItems={'center'} spacing={2}>
                <ArrowDownward/>
                <Stack height={"90dvh"} maxWidth={theme.breakpoints.values.sm} spacing={2} width={'100%'} sx={{overflowY: 'auto'}} alignItems={'center'}  onClick={(ev) => {
                    ev.stopPropagation();
                }}>
                    {
                        chatId ? 
                            <ChatComponent 
                                chatId={chatId}
                                //suggestedNextMessages={ctx.emptyChatSuggestedNextMessages}
                                divProps={{
                                    style: {
                                        width: '100%'
                                    }
                                }}
                                paperProps={{
                                    sx: {
                                        width: '100%'
                                    }
                                }}
                                suggestedNextMessages={suggestedNextMesages ?? []}
                                onSendStart={() => {
                                    ChatDrawerState.suggestedNextMessagesVar([]);
                                }}
                                // already have slideout
                                disableFade
                            />
                            :
                            null
                    }
                </Stack>
            </Stack>
        </SwipeableDrawer>
    </React.Fragment>
}