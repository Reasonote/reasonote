import {
  useCallback,
  useRef,
} from "react";

import {
  ChaptersCreateLessonsRoute,
} from "@/app/api/chapters/create_lessons/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";

import {useApolloClient} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Card,
  Stack,
  useTheme
} from "@mui/material";
import {GetChaptersDeepQuery} from "@reasonote/lib-sdk-apollo-client";
import {
  getChapterDeep,
} from "@reasonote/lib-sdk-apollo-client/src/gqlDocuments/queries/getChapterDeep";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {
  LessonTree,
  LessonTreeSkeleton,
} from "../lesson_tree/LessonTree";
import {Txt} from "../typography/Txt";

export interface CourseChapterProps {
    skillIdPath: string[];
    chapter: NonNullable<GetChaptersDeepQuery['chapterCollection']>['edges'][0]['node'];
    isCurrentChapter?: boolean;
    lessonTreeOffsetCount?: number;
}

export function CourseChapter({skillIdPath, chapter, isCurrentChapter, lessonTreeOffsetCount}: CourseChapterProps) {
    const theme = useTheme();
    const userId = useRsnUserId();
    const ac = useApolloClient();

    const lessons = chapter.lessonCollection?.edges.map((edge) => edge.node).filter(notEmpty) ?? [];
    const lessonIds = lessons.map((l) => l.id);

    const lessonGenMutex = useRef(false);

    const initializeLessons = useCallback(async (n: number = 2, batchSize: number = 2) => {
        if (lessonGenMutex.current) {
            return;
        }

        lessonGenMutex.current = true;
        
        try {
            const res = await ChaptersCreateLessonsRoute.call({
                chapterId: chapter.id,
                numLessons: 4,
            });

            // Now, refetch the chapter + lessons.
            await ac.query({
                query: getChapterDeep,
                variables: {
                    filter: {
                        id: {
                            eq: chapter.id
                        }
                    },
                    first: 1
                }
            })
    
            // setLessonInitGen(true);
            
            // setNewLessonState('success');
        }
        catch (e) {
            console.error(e);
            // Do this to not infini-gen
            // setLessonInitGen(true);
            // setNewLessonState('error');
        }
        finally {
            lessonGenMutex.current = false;
        }
    }, [userId, skillIdPath, lessons]);

    useAsyncEffect(async () => {
        if (!lessons.length || lessons.length < 1){
            await initializeLessons();
        }
    }, [lessons.length]);

    return <Stack gap={2}>
        <Card sx={{backgroundColor: isCurrentChapter ? theme.palette.primary.dark : undefined}} elevation={5}>
            <Txt startIcon={chapter.icon} key={`chapter-${chapter.id}`} stackOverrides={{alignItems: 'center', justifyContent: 'center'}}>
                {chapter.name}
                {/* {chapter.summary} */}
            </Txt>
        </Card>
        {
            lessonIds && lessonIds.length > 0 ?
                <LessonTree lessonIds={lessonIds} skillIdPath={skillIdPath} key={`chapter-${chapter.id}-lessons`} disableStartTooltips={!isCurrentChapter} offsetCount={lessonTreeOffsetCount}/> 
                : 
                <LessonTreeSkeleton numLessons={4} offsetCount={lessonTreeOffsetCount} />
        }
    </Stack>
}