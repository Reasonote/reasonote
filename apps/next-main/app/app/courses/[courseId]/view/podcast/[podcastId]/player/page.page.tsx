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
  generateMetadataForPodcasts,
} from "@/utils/nextjs/generateMetadataForPodcasts";
import {Box} from "@mui/material";

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
  const params = useRouteParamsSingle(['podcastId'])
  const podcastId = params.podcastId;
  const qParams = useSearchParams();
  
  if (!podcastId) {
    return <NotFoundPage />
  }

  return (
    <LoginWall extraUrlParams={{
      startListeningPodcastId: podcastId,
    }}>
      <Box display={'flex'} width={'100%'} height={'100%'} justifyItems={'center'} justifyContent={'center'}>
          <Box width={'100%'} height={'100%'} maxWidth={'600px'}>
            <PodcastPlayer podcastId={podcastId} />
          </Box>
      </Box>
    </LoginWall>
  )
}