'use client'

import {useState} from "react";

import {useRouter} from "next/navigation";

import {
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";

import {ModuleTreeView} from "../ModuleTreeView";
import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

export const PracticeTabRenderer = ({
  skillId,
  loading: propsLoading,
  error: propsError
}: ToolTabRendererProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingPracticeId, setLoadingPracticeId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonSkillId, setActiveLessonSkillId] = useState<string | null>(null);
  const router = useRouter();

  const onClickLesson = async (lessonId: string) => {
    try {
      setLoadingPracticeId(lessonId);

      router.push(`/app/skills/${skillId}/practice_v2/practice?subtopicIds=${lessonId}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load or generate lesson'));
    } finally {
      setLoadingPracticeId(null);
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
            disabled={loadingPracticeId === activeLessonSkillId}
            onClick={() => activeLessonSkillId && onClickLesson(activeLessonSkillId)}
            startIcon={loadingPracticeId === activeLessonSkillId ? <CircularProgress size={20} /> : undefined}
          >
            {loadingPracticeId === activeLessonSkillId ? 'Loading...' : 'Start Practicing'}
          </Button>
        }
      />
    </Stack>
  );
};

export const PracticeTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <PracticeTabRenderer {...props} />}
  </ToolTabLayout>
); 