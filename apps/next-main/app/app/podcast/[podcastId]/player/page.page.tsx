"use client"

import React from "react";

import {
  Metadata,
  ResolvingMetadata,
} from "next";
import {useSearchParams} from "next/navigation";

import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import LoginWall from "@/components/auth/LoginWall";
import {NotFoundPage} from "@/components/navigation/NotFound";
import {PodcastPlayer} from "@/components/podcast/PodcastPlayer";
import {
  DesktopBodyLayout,
} from "@/components/positioning/desktop/DesktopBodyLayout";
import {
  SkillHeader,
  SkillHeaderHeight,
} from "@/components/skill/SkillHeader";
import {Txt} from "@/components/typography/Txt";
import {
  generateMetadataForPodcasts,
} from "@/utils/nextjs/generateMetadataForPodcasts";
import {
  Box,
  Stack,
  useTheme,
} from "@mui/material";

type Props = {
  params: { podcastId: string}
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const podcastId = params.podcastId;

  return generateMetadataForPodcasts(podcastId);
}

export default function AIPodcastPlayerPage() {
  const theme = useTheme();
  const params = useRouteParamsSingle(['podcastId'])
  const podcastId = params.podcastId;
  const qParams = useSearchParams();

  const fromSkillId = qParams?.get('from')?.startsWith('skill') ? qParams.get('from') : undefined;
  
  if (!podcastId) {
    return <NotFoundPage />
  }

  return (
    <LoginWall extraUrlParams={{
      startListeningPodcastId: podcastId,
    }}>
      <DesktopBodyLayout disableBottomBar>
        <Stack alignItems="center" flexGrow={1} height="100%" minHeight="100%" maxHeight="100%">
            {fromSkillId ? (
                <Stack sx={{
                    height: `calc(100% - ${SkillHeaderHeight})`,
                    maxHeight: `calc(100% - ${SkillHeaderHeight})`,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    alignItems: 'center'
                }}>
                    <Box sx={{pt: 2, px: 3, height: SkillHeaderHeight, minHeight: SkillHeaderHeight, width: '100%' }}>
                        <SkillHeader
                            skillId={fromSkillId}
                            breadCrumbs={[
                                <Txt color={theme.palette.text.primary}>Podcast</Txt>
                            ]}
                        />
                    </Box>
                    <Stack py={2} px={3} flexGrow={1} height="100%" minHeight="100%" maxHeight="100%" maxWidth="800px">
                        <PodcastPlayer podcastId={podcastId} />
                    </Stack>
                </Stack>
            ) : (
                <Stack py={2} px={3} flexGrow={1} height="100%" minHeight="100%" maxHeight="100%" maxWidth="800px">
                    <PodcastPlayer podcastId={podcastId} />
                </Stack>
            )}
        </Stack>
      </DesktopBodyLayout>
    </LoginWall>
  );
}