import {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  GetSuggestedLessonsRoute,
} from "@/app/api/lesson/get_suggested_lessons/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useQuery} from "@apollo/client";
import {Stack} from "@mui/material";
import {
  GetUserLessonResultsDeepDocument,
} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {LessonTreeSkeleton} from "../lesson_tree/LessonTree";
import {
  LessonTreeItem,
  LessonTreeItemSkeleton,
} from "../lesson_tree/LessonTreeItem";

export function CoursePathFirstLesson({skillIdPath}: {skillIdPath: string[]}) {
    const lessonGenMutex = useRef(false);
    const [lessonInitGen, setLessonInitGen] = useState<boolean>(false);
    const [newLessonState, setNewLessonState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [lessonId, setLessonId] = useState<string | null>(null);
    const userId = useRsnUserId();
    const lessonResultRes = useQuery(GetUserLessonResultsDeepDocument, {
        variables: {
            filter: {
                user: {
                    eq: userId
                },
                lesson: {
                    eq: lessonId
                }
            }
        },
        fetchPolicy: 'network-only'
    })

    const getLesson = useCallback(async (n: number = 2, batchSize: number = 2) => {
        if (lessonGenMutex.current || newLessonState === 'error') {
            return;
        }

        lessonGenMutex.current = true;

        setNewLessonState('loading');

        try {
            const res = await GetSuggestedLessonsRoute.call({
                skillIdPath,
                variant: 'short',
                maxTokensPerLesson: 200, 
                forceFirstLesson: true
            });

            if (!res.data) {
                throw new Error('Get suggested lessons failed!');
            }

            const firstLessonId = res.data.lessons[0].id;

            if (!firstLessonId) {
                throw new Error('No lesson id returned!');
            }

            setLessonId(firstLessonId);
            setLessonInitGen(true);
            setNewLessonState('success');
        }
        catch (e) {
            console.error(e);
            // Do this to not infini-gen
            setLessonInitGen(true);
            setNewLessonState('error');
        }
        finally {
            lessonGenMutex.current = false;
        }
    }, [skillIdPath]);

    useAsyncEffect(async () => {
        if (!lessonInitGen && newLessonState === 'idle' && !lessonGenMutex.current && !lessonId) {
            await getLesson();
        }
    }, [getLesson]);

    const isCompleted = !!lessonResultRes.data?.userLessonResultCollection?.edges?.find((result) => result.node.lesson?.id === lessonId);

    const showLessonTree = lessonId && !isCompleted && !lessonResultRes.loading;

    return (
        <Stack alignItems={'center'} justifyContent={'center'}>
            {
                lessonId ? 
                    <LessonTreeItem lessonId={lessonId} isNextLesson isFirstInList isStarterLesson isCompleted={isCompleted} disableStartTooltips={isCompleted} disableReview={isCompleted}/>
                    :
                    (
                        <LessonTreeItemSkeleton />
                    )
            }
            {
                showLessonTree ? <LessonTreeSkeleton numLessons={10} offsetCount={1} variant="assessment-needed"/> : null
            }
        </Stack>
    )
}