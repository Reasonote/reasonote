'use client'
import { useEffect, useState } from "react";

import posthog from "posthog-js";

import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { Txt } from "@/components/typography/Txt";

import { Skeleton, Stack } from "@mui/material";

import { PracticeSection } from "@/components/home/PracticeSection";
import { useSupabase } from "@/components/supabase/SupabaseProvider";
import { SkillChip } from "@/components/chips/SkillChip/SkillChip";

export default function PracticePage() {
  const { courseId } = useRouteParamsSingle(['courseId']);
  const { sb } = useSupabase();
  const [rootSkillId, setRootSkillId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      return;
    }
    const fetchCourse = async () => {
      const course = await sb.from('course').select('root_skill').eq('id', courseId).single();
      setRootSkillId(course?.data?.root_skill ?? null);
    };
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    posthog.capture('practice_view', {
      course_id: courseId,
    }, { send_instantly: true });
  }, [courseId]);

  return courseId ? (
    <Stack gap={2} height={'100%'} alignItems={'center'} p={2}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <Txt startIcon={<SkillIcon />} variant="h5" textAlign={'center'} fontWeight={'bold'}>Practice</Txt>
        <SkillChip
          disableModal
          disableLevelIndicator
          disableAddDelete
          topicOrId={rootSkillId ?? ''}
        />
      </Stack>
      <PracticeSection skillId={rootSkillId} courseId={courseId} />
    </Stack>
  )
    :
    <Skeleton variant="rectangular" height={'100%'} />
}