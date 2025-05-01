"use client"

import React from "react";

import {useRouter} from "next/navigation";

import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {
  PodcastGenerationForm,
} from "@/components/podcast/PodcastGenerationForm";
import {Box} from "@mui/material";

export default function PodcastNewPage() {
    // get skillId from params
    const {skillId} = useRouteParamsSingle(['skillId'])
    const router = useRouter();

    return <Box maxWidth={'600px'} margin={'auto'}>
        <PodcastGenerationForm 
            skillPath={skillId ? [skillId] : []}
            onAfterGenerate={(podcastId) => {
                router.push(`/app/skills/${skillId}/podcast/${podcastId}/player`);
            }} 
        />
    </Box>
}