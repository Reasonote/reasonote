'use client'
import { useEffect } from "react";

import posthog from "posthog-js";

import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { Txt } from "@/components/typography/Txt";

import { Skeleton, Stack } from "@mui/material";

import { PracticeSection } from "@/components/home/PracticeSection";
import { SkillChip } from "@/components/chips/SkillChip/SkillChip";

export default function PracticePage() {
  const { skillId } = useRouteParamsSingle(['skillId']);

  useEffect(() => {
    posthog.capture('practice_view', {
      skill_id: skillId,
    }, { send_instantly: true });
  }, [skillId]);

  return skillId ? (
    <Stack gap={2} height={'100%'} alignItems={'center'} p={2}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <Txt startIcon={<SkillIcon />} variant="h5" textAlign={'center'} fontWeight={'bold'}>Practice</Txt>
        <SkillChip
          disableModal
          disableLevelIndicator
          disableAddDelete
          topicOrId={skillId ?? ''}
        />
      </Stack>
      <PracticeSection skillId={skillId} />
    </Stack>
  )
    :
    <Skeleton variant="rectangular" height={'100%'} />
}