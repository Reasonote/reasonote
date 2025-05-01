import React, {
  useEffect,
  useState,
} from "react";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {
  createLessonSessionFlatMutDoc,
  getLessonFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {
  LessonSessionConceptPracticeReview,
} from "../lesson_session/SessionTypes/LessonSessionConceptPracticeReview";
import {LinearProgressWithLabel} from "../progress/LinearProgressWithLabel";
import {Txt} from "../typography/Txt";

export interface ClassroomLessonDisplayProps {
  lessonId: string;
  onActivityComplete: (res: any) => void;
  onLessonComplete: () => void;
  onBack: () => void;
}

export function ClassroomLessonDisplay({ 
  lessonId, 
  onActivityComplete, 
  onLessonComplete, 
  onBack 
}: ClassroomLessonDisplayProps) {
  const ac = useApolloClient();
  const rsnUserId = useRsnUserId();
  const { loading, error, data } = useQuery(getLessonFlatQueryDoc, {
    variables: { filter: { id: { eq: lessonId } } },
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [lessonSessionId, setLessonSessionId] = useState<string | null>(null);



  const lesson = data?.lessonCollection?.edges?.[0]?.node;

  // Create a new lesson session for this lesson
  useEffect(() => {
    const createLessonSession = async () => {
      const { data } = await ac.mutate({
        mutation: createLessonSessionFlatMutDoc,
        variables: { objects: [{lesson: lessonId, user: rsnUserId}] },
      });

      const newId = data?.insertIntoLessonSessionCollection?.records?.[0]?.id;

      if (!newId) {
        setErrorMsg('no id found');
        return;
      }

      setLessonSessionId(newId);
    };

    createLessonSession();
  }, [lessonId]);


  if (!lesson) {
    return (
      <>
        <button onClick={onBack}>Back</button>
        <Txt>Lesson not found</Txt>
      </>
    );
  }


  if (loading) return <Txt>Loading lesson...</Txt>;
  if (error) return <Txt>Error loading lesson: {error.message}</Txt>;

  if (errorMsg) {
    return <Txt>{errorMsg}</Txt>;
  }

  return (lessonSessionId ?
    <LessonSessionConceptPracticeReview 
        lessonSessionId={lessonSessionId} 
        onBack={onBack} 
        onBackAfterLessonComplete={() => {
          onLessonComplete?.()
          onBack?.()
        }}
        onStartNewLesson={() => {
            // TODO: Implement this
        }} 
    /> :
    <LinearProgressWithLabel label={'Loading lesson session...'} labelPos={'above'} />
  );
}