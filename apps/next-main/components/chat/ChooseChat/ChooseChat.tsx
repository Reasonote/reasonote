"use client"
import {
  useCallback,
  useState,
} from "react";

import {ChatV4CreateRoute} from "@/app/api/chat/v4/create/routeSchema";
import {ActionCard} from "@/app/app/activities/new/page.page";
import {useUserBots} from "@/clientOnly/hooks/useUserBots";
import {
  CreateCharacterDialog,
} from "@/components/characters/CreateCharacterDialog/CreateCharacterDialog";
import {AutoAwesomeAddIcon} from "@/components/icons/AutoAwesomeAdd";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";

import {Chat} from "@mui/icons-material";
import {
  Avatar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

export interface ChooseChatProps {
    onChatChosen: (chatId: string) => void;
    createContextMessages?: {contextId: string, contextType: string, contextData: any}[];
    disableCreateCharacter?: boolean;
    subjectName?: string;
}

export function ChooseChat({
    onChatChosen,
    createContextMessages,
    subjectName
}: ChooseChatProps) {
    const {
        data: bots
    } = useUserBots();
    const theme = useTheme();
    const {sb} = useSupabase();
    const [creatingCharacter, setCreatingCharacter] = useState(false);

    const onBotChosen = useCallback(async (botId: string) => {
        // Create the chatroom, with this bot
        const resp = await ChatV4CreateRoute.call({
            botIds: [botId],
            contextItems: createContextMessages
        })

        const chatId = resp?.data?.chatId;

        if (!chatId){
            console.error('Failed to create chat room!');
            return;
        }

        onChatChosen(chatId);
    }, [onChatChosen]);

    return (
        <Stack gap={1}>
            <Txt startIcon={<Chat/>} variant={'h6'} stackOverrides={{justifyContent: 'center'}}>
                Chat With Who?
            </Txt>
            <Txt 
                variant={'body1'}
                stackOverrides={{
                    justifyContent: 'center',
                    textAlign: 'center',
                }}
                textAlign={'center'}
            >
                {
                    subjectName ?
                        `Chat about "${subjectName}" by choosing a character below.`
                        :
                        `Choose a character to chat with.`
                }
            </Txt>
            {bots?.map(bot => {
                const botId = bot.id;
                if (botId){
                    return (
                        <ActionCard 
                            onClick={() => onBotChosen(botId)} cardProps={{elevation: 5}}
                        >
                            <Stack direction={'row'} gap={1} alignItems={'center'}>
                                <Avatar>{bot.avatarEmoji ?? '🧒'}</Avatar>
                                <Typography variant={'h6'}>
                                    {bot.name}
                                </Typography>
                            </Stack>
                        </ActionCard>
                    )
                }
                else {
                    return 
                }
            })}
            <ActionCard
                onClick={() => {
                    setCreatingCharacter(true);
                }}
                cardActionAreaProps={{
                    sx: {
                        paddingY: '10px',
                    }
                }}
                cardProps={{
                    elevation: 2,
                    sx: {
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                        }
                    },
                }}
            >
                <Stack alignItems={'center'} justifyContent={'center'}>
                    <Stack direction={'row'} gap={1} alignItems={'center'} justifyContent={'center'}>
                        <AutoAwesomeAddIcon/>
                        <Typography variant="h6">Create More Characters</Typography>
                    </Stack>
                    <Txt variant="caption">Add Characters to your team!</Txt>
                </Stack>
            </ActionCard>
            <CreateCharacterDialog open={creatingCharacter} setOpen={setCreatingCharacter} onCharacterCreated={onBotChosen}/>
        </Stack>
    )
}