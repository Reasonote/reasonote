"use client";

import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {ChatV4CreateRoute} from "@/app/api/chat/v4/create/routeSchema";
import {
  CreateCharacterDialog,
} from "@/components/characters/CreateCharacterDialog/CreateCharacterDialog";
import {AutoAwesomeAddIcon} from "@/components/icons/AutoAwesomeAdd";
import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import MobileContent from "@/components/positioning/mobile/MobileContent";
import {Txt} from "@/components/typography/Txt";

import {
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {BotsList} from "../../../components/lists/BotList";
import {ActionCard} from "../activities/new/page.page";

const Component = () => {
  const theme = useTheme();
  const router = useRouter();
  const [creatingCharacter, setCreatingCharacter] = useState(false);

  return (
    <MainMobileLayout>
      <MobileContent>
        <BotsList
          onBotClicked={(botId) => {
            if (botId){
              router.push(`/app/characters/${botId}`)
            }
            else {
              console.error('No botId provided');
            }
          }}
          onChatClicked={async (botId) => {
            const chatRes = await ChatV4CreateRoute.call({
              botIds: [botId]
            })

            const chatId = chatRes.data?.chatId;

            if (!chatId){
              console.error('Error creating chat:', chatRes.error);
            }
            else {
              router.push(`/app/chat/${chatId}`);
            }
          }}
        />
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
        <CreateCharacterDialog open={creatingCharacter} setOpen={setCreatingCharacter} onCharacterCreated={(botId) => {
          router.push(`/app/characters/${botId}`);
        }}/>
      </MobileContent>
    </MainMobileLayout> 
  );
};

//////////////////////////////////////////////
// The actual exported page.
export default function Web() {
  // This is my way of doing NoSSR.
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  return <>{domLoaded && <Component />}</>;
}
