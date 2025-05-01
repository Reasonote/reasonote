import React, {
  useEffect,
  useState,
} from "react";

import _ from "lodash";

import {
  Button,
  Card,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";

import {Txt} from "../typography/Txt";

export interface LessonStub {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  createdAt: number;
}

interface ClassroomLessonSelectorDumbProps {
  recentLessons?: LessonStub[];
  olderLessons?: LessonStub[];
  onPickLesson: (lessonId: string) => void;
}

export const ClassroomLessonSelectorDumb: React.FC<ClassroomLessonSelectorDumbProps> = ({
  recentLessons,
  olderLessons,
  onPickLesson,
}) => {
  const theme = useTheme();
  const [showOlderLessons, setShowOlderLessons] = useState(false);

  useEffect(() => {
    // Auto-expand older lessons if there are no recent lessons
    if (!recentLessons || recentLessons.length === 0) {
      setShowOlderLessons(true);
    }
  }, [recentLessons]);

  const renderLessonGroup = (lessons: LessonStub[]) => (
    <Stack direction={'column'} gap={2} width={'100%'}>
      {lessons.map(lesson => (
        <Stack key={lesson.id} width={'100%'}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.default,
              border: `1.5px solid ${theme.palette.divider}`,
              borderRadius: "10px",
              cursor: "pointer",
              '&:hover': {
                boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.5)",
                backgroundColor: theme.palette.gray.light,
              },
              height: 'max-content',
            }}
            elevation={4}
            onClick={() => onPickLesson(lesson.id)}
            data-testid="lesson-card"
          >
            <Stack direction={'column'} gap={2}>
              {lesson.name && <Txt variant="h6" startIcon={lesson.emoji}>{lesson.name}</Txt>}
              {lesson.description && <Txt>{lesson.description}</Txt>}
            </Stack>
          </Card>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Stack direction={'column'} gap={2} height={'100%'} maxHeight={'100%'} overflow={'auto'} width={'100%'}>
      {recentLessons && recentLessons.length > 0 && renderLessonGroup(recentLessons)}
      {olderLessons && olderLessons.length > 0 && (
        <>
          {recentLessons && recentLessons.length > 0 && (
            <Divider><Txt color="grey">Older Lessons</Txt></Divider>
          )}
          {showOlderLessons ? (
            renderLessonGroup(olderLessons)
          ) : (
            <Button 
              size="small"
              onClick={() => setShowOlderLessons(true)}
              sx={{ mt: 2, alignSelf: 'center', textTransform: 'none' }}
              variant="text"
              color="info"
            >
              Show Older Lessons
            </Button>
          )}
        </>
      )}
    </Stack>
  );
};