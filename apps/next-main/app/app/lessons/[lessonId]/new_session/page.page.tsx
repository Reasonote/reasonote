"use client"
import {
  useEffect,
  useState,
} from "react";

import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {LessonSessionOld} from "@/components/lesson_session/LessonSessionOld";
import {NotFoundPage} from "@/components/navigation/NotFound";
import {Txt} from "@/components/typography/Txt";
import {
  CircularProgress,
  Stack,
} from "@mui/material";
import { useSearchParamHelper } from "@/clientOnly/hooks/useQueryParamHelper";

interface PageParams {
  lessonId: string;
}

export default function LessonsSessionNewPage({ params }: { params: PageParams }) {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {value: courseId, update: setCourseId} = useSearchParamHelper('courseId');
  const {value: skillId, update: setSkillId} = useSearchParamHelper('skillId');

  useEffect(() => {
    try {
      const id = useRouteParams(params, 'lessonId');
      setLessonId(id);
    } catch (err) {
      setError("Failed to load lesson ID");
    }
  }, [params]);

  if (error) {
    return (
      <Stack spacing={2} alignItems="center">
        <Txt variant="h6" color="error">{error}</Txt>
        <NotFoundPage />
      </Stack>
    );
  }

  if (lessonId === null) {
    return (
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Txt>Loading lesson...</Txt>
      </Stack>
    );
  }

  if (courseId) {
    return <LessonSessionOld lessonId={lessonId} entityId={courseId} entityType="course"/>;
  }

  if (skillId) {
    return <LessonSessionOld lessonId={lessonId} entityId={skillId} entityType="skill"/>;
  }

  return <LessonSessionOld lessonId={lessonId}/>;
}