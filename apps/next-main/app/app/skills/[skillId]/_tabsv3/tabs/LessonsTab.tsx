'use client'

import {useState} from "react";

import {useRouter} from "next/navigation";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";

import {ModuleTreeView} from "../ModuleTreeView";
import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

export const LessonsTabRenderer = ({
  skillId,
  loading: propsLoading,
  error: propsError
}: ToolTabRendererProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingLessonSkillId, setLoadingLessonSkillId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonSkillId, setActiveLessonSkillId] = useState<string | null>(null);
  const { supabase } = useSupabase();
  const router = useRouter();

  const onClickLesson = async (lessonSkillId: string) => {
    try {
      setLoadingLessonSkillId(lessonSkillId);

      router.push(`/app/skills/${skillId}/lesson_v2/${lessonSkillId}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load or generate lesson'));
    }
  }

  if (propsLoading || loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack sx={{ height: '100%', p: 2 }}>
      <ModuleTreeView
        rootSkillId={skillId}
        loading={loading}
        error={error}
        activeModuleId={activeModuleId}
        activeLessonSkillId={activeLessonSkillId}
        onModuleSelect={setActiveModuleId}
        onLessonSelect={setActiveLessonSkillId}
        lessonActionList={
          <Button
            variant="contained"
            color="primary"
            disabled={loadingLessonSkillId === activeLessonSkillId}
            onClick={() => activeLessonSkillId && onClickLesson(activeLessonSkillId)}
            startIcon={loadingLessonSkillId === activeLessonSkillId ? <CircularProgress size={20} /> : undefined}
          >
            {loadingLessonSkillId === activeLessonSkillId ? 'Loading...' : 'Begin Lesson'}
          </Button>
        }
      />
    </Stack>
  );
};

export const LessonsTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <LessonsTabRenderer {...props} />}
  </ToolTabLayout>
); 