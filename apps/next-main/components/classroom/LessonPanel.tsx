import React from "react";

import {DeepPartial} from "ai";

import {Stack} from "@mui/material";

import {
  ClassroomLessonDisplay,
} from "./ClassroomLessonDisplay"; // Update import if necessary
import {ClassroomLessonSelector} from "./ClassroomLessonSelector";
import {LessonWithActivities} from "./schema";

interface LessonPanelProps {
  skillId?: string;
  courseId?: string;
  lessons: (DeepPartial<LessonWithActivities> & {createdAt: number; id: string})[];
  selectedLessonId: string | null;
  onPickLesson: (lessonId: string | null) => void;
  onActivityComplete: (res: any) => void;
  onLessonComplete: () => void;
  lastLessonIdGroup: string[] | null;
}

export const LessonPanel: React.FC<LessonPanelProps> = ({
  skillId,
  courseId,
  lessons,
  selectedLessonId,
  onPickLesson,
  onActivityComplete,
  onLessonComplete,
  lastLessonIdGroup,
}) => {

  return (
    <>
      {selectedLessonId ? (
        <Stack direction={'column'} gap={2} height={'100%'} width={'100%'}>
          <ClassroomLessonDisplay
            onBack={() => {
              onPickLesson(null);  // This will trigger the parent to set status to 'pick-lesson'
            }}
            lessonId={selectedLessonId}
            onActivityComplete={onActivityComplete}
            onLessonComplete={onLessonComplete}
          />
        </Stack>
      ) : (
        <ClassroomLessonSelector 
          skillId={skillId}
          courseId={courseId}
          onPickLesson={onPickLesson} 
          lastLessonIdGroup={lastLessonIdGroup}
        />
      )}
    </>
  );
};