"use client";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {EditCharacter} from "@/components/characters/EditCharacter";
import {NotFoundPage} from "@/components/navigation/NotFound";
import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import MobileContentHeader
  from "@/components/positioning/mobile/MobileContentHeader";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {ArrowBackIos} from "@mui/icons-material";
import {
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

//////////////////////////////////////////////
// The actual exported page.
export default function CharacterIdPage({ params }: { params: any }) {
  const characterId = useRouteParams(params, 'characterId');
  const isSmallDevice = useIsSmallDevice();
  const router = useRouter();

  return characterId ? 
    <MainMobileLayout>
      <MobileContentHeader disableBreadcrumb>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
            <IconButton onClick={() => {
                router.push('/app/characters');
            }}>
                <ArrowBackIos />
            </IconButton>
            <Typography variant="h6">Editing Character</Typography>
        </Stack>
      </MobileContentHeader>
      <MobileContentMain>
        <EditCharacter botId={characterId} />
      </MobileContentMain>
    </MainMobileLayout>
    :
    <NotFoundPage/>
}
