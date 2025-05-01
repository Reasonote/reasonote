"use client"
import {useState} from "react";

import {ChatInnerComponent} from "@/components/chat/ChatInnerComponent";
import {ChooseChat} from "@/components/chat/ChooseChat/ChooseChat";
import {Stack} from "@mui/material";

export interface SkillIdDiveTabContentProps {
    skillId: string;
}

export function ChatChosen({chatId}: {chatId: string}) {
    return <ChatInnerComponent chatId={chatId}/>
}

export function SkillIdChatTabContent({skillId}: SkillIdDiveTabContentProps) {
    const [chatId, setChatId] = useState<string | null>(null);

    // const chatCreateRes = useAsyncMemo(async () => {
    //     // Create the Chat
    //     const chatRes = await ac.mutate({
    //         mutation: createChatFlatMutDoc,
    //         variables: {
    //             objects: [
    //                 {
    //                     isPublic: false,
    //                 },
    //             ],
    //         },
    //     });

    //     const newChatId = chatRes.data?.insertIntoChatCollection?.records?.[0]?.id;

    //     if (!newChatId) {
    //         return {
    //             data: null,
    //             loading: false,
    //             error: new Error("Failed to create new chatroom")
    //         }
    //     }

    //     // Set the Persona Context
    //     ChatV4UpsertContextRoute.call({
    //         chatId: newChatId,
    //         contextType: 'viewing_skill',
    //         contextId: skillId,
    //         contextData: {
    //             skillId
    //         }
    //     });

    //     return {
    //         data: newChatId,
    //         loading: false,
    //         error: null
    //     }
    // }, [skillId]) ?? {
    //     data: null,
    //     loading: true,
    //     error: null
    // };

    return <Stack gap={1} width={'100%'}>
        {
            chatId ? 
                <ChatChosen chatId={chatId}/>
                :
                <ChooseChat 
                    createContextMessages={[
                        {
                            contextId: skillId,
                            contextType: 'viewing_skill',
                            contextData: {
                                skillId
                            }
                        }
                    ]}
                    onChatChosen={(cid) => setChatId(cid)}
                />
        }
    </Stack>
}