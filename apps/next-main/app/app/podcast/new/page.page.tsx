"use client"

import React from "react";

import {useRouter} from "next/navigation";

import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {
  PodcastGenerationForm,
} from "@/components/podcast/PodcastGenerationForm";

export default function PodcastNewPage() {
    // get skillId from params
    const {value: skillId, update: setSkillId} = useSearchParamHelper("skillId", undefined);
    const router = useRouter();

    // TODO: pass in path here?
    return <PodcastGenerationForm skillPath={skillId ? [skillId] : undefined} onAfterGenerate={(podcastId) => {
      router.push(`/app/podcast/${podcastId}/player`);
    }} />
}