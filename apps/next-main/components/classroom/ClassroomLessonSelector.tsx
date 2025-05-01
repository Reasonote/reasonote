import React from "react";

import { useQuery } from "@apollo/client";
import { getLessonFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
import { useSupabase } from "@/components/supabase/SupabaseProvider";

import {
  ClassroomLessonSelectorDumb,
  LessonStub,
} from "./ClassroomLessonSelectorDumb";

interface ClassroomLessonSelectorProps {
  courseId?: string;
  skillId?: string;
  onPickLesson: (lessonId: string) => void;
  lastLessonIdGroup?: string[] | null;
}

export const ClassroomLessonSelector: React.FC<ClassroomLessonSelectorProps> = ({
  courseId,
  skillId,
  onPickLesson,
  lastLessonIdGroup,
}) => {
  const { supabase } = useSupabase();
  const [courseLessons, setCourseLessons] = React.useState<LessonStub[]>([]);

  // First, fetch lessons directly associated with the skill (if skillId provided)
  const { loading: skillLessonsLoading, error: skillLessonsError, data: skillLessonsData } = useQuery(getLessonFlatQueryDoc, {
    variables: { filter: { rootSkill: { eq: skillId } } },
    skip: !skillId,
  });

  // Fetch lessons from the course if courseId is provided
  React.useEffect(() => {
    const fetchCourseLessons = async () => {
      if (!courseId) return;
      
      try {
        const { data: lessonData } = await supabase
          .from('course_lesson')
          .select(`
            lesson:lesson(
              id,
              _name,
              _summary,
              icon,
              created_date
            )
          `)
          .eq('course', courseId)
          .order('order_index');

        // Transform the data into LessonStub format
        const lessons: LessonStub[] = lessonData
          ?.map(item => ({
            id: item.lesson?.id ?? '',
            name: item.lesson?._name ?? '',
            description: item.lesson?._summary ?? '',
            emoji: item.lesson?.icon ?? '',
            createdAt: new Date(item.lesson?.created_date ?? '').getTime(),
          }))
          .filter(Boolean) ?? [];

        setCourseLessons(lessons);
      } catch (error) {
        console.error('Error fetching course lessons:', error);
      }
    };

    fetchCourseLessons();
  }, [courseId, supabase]);

  if (skillId && skillLessonsLoading) return <div>Loading...</div>;
  if (skillId && skillLessonsError) return <div>Error: {skillLessonsError.message}</div>;

  // Get lessons from skill if available
  const skillLessons: LessonStub[] = skillId ? (
    skillLessonsData?.lessonCollection?.edges?.map(({node: lesson}) => ({
      id: lesson.id,
      name: lesson.name ?? '',
      description: lesson.summary ?? '',
      emoji: lesson.icon ?? '',
      createdAt: new Date(lesson.createdDate).getTime(),
    })) ?? []
  ) : [];

  // Use either course lessons or skill lessons + course lessons
  const allLessons = courseId 
    ? courseLessons // If courseId is provided, only show course lessons
    : [...skillLessons, ...courseLessons].filter((lesson, index, self) => 
        index === self.findIndex(l => l.id === lesson.id)
      );

  const recentLessons = lastLessonIdGroup ? allLessons.filter(lesson => lastLessonIdGroup.includes(lesson.id)) : undefined;
  const olderLessons = lastLessonIdGroup ? allLessons.filter(lesson => !lastLessonIdGroup.includes(lesson.id)) : allLessons;

  return (
    <ClassroomLessonSelectorDumb
      recentLessons={recentLessons}
      olderLessons={olderLessons}
      onPickLesson={onPickLesson}
    />
  );
};