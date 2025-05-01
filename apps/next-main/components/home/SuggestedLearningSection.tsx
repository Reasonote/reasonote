import { useRouter } from "next/navigation";
import { GraduationCap, Podcast, Redo } from "lucide-react";
import { useState } from "react";
import { useRsnUserId } from "@/clientOnly/hooks/useRsnUser";
import { useApolloClient } from "@apollo/client";
import { createLessonSession } from "@/clientOnly/helpers/createLessonSession";

import { Txt } from "@/components/typography/Txt";
import { useQuery } from "@apollo/client";
import { Button, Card, Skeleton, Stack, useTheme } from "@mui/material";
import { getLessonFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";
import { FullscreenLoading } from "@/components/loading/FullscreenLoading";

import { PracticeSection } from "./PracticeSection";
import { Course, Lesson } from "@/app/api/courses/get/types";

type LessonWithCreatedAt = Lesson & { createdAt?: number };


type SuggestedLearningSectionProps = {
    skillId?: string | null | undefined;
    course?: Course | null | undefined;
}

export function SuggestedLearningSection({ skillId, course }: SuggestedLearningSectionProps) {
    const theme = useTheme();
    const router = useRouter();
    const { loading, error, data } = useQuery(getLessonFlatQueryDoc, {
        variables: { filter: { rootSkill: { eq: skillId } } },
    });

    let allLessons: LessonWithCreatedAt[] = [];
    let latestLesson: LessonWithCreatedAt | null = null;
    if (course) {
        allLessons = course.lessons;
        latestLesson = allLessons.sort((a, b) => (b.orderIndex ?? 0) - (a.orderIndex ?? 0)).slice(-1)[0];
    } else if (skillId) {
        allLessons = data?.lessonCollection?.edges?.map(({ node: lesson }) => ({
            id: lesson.id,
            name: lesson.name ?? '',
            description: lesson.summary ?? '',
            emoji: lesson.icon ?? '',
            rootSkillId: skillId,
            orderIndex: 0,
            createdAt: new Date(lesson.createdDate).getTime(),
        })) ?? [];
        latestLesson = allLessons.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 1)[0];
    }

    const noLessons = allLessons.length === 0;

    const rsnUserId = useRsnUserId();
    const ac = useApolloClient();
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    const onPickLesson = async (lessonId: string) => {
        if (!rsnUserId) return;

        try {
            setIsCreatingSession(true);
            const sessionId = await createLessonSession({
                lessonId,
                rsnUserId,
                ac
            });

            if (!sessionId) {
                console.error("Failed to create lesson session");
                return;
            }

            // Direct navigation based on context
            if (course) {
                router.push(`/app/courses/${course.id}/view/lessons/session/${sessionId}`);
            } else if (skillId) {
                router.push(`/app/skills/${skillId}/lessons/session/${sessionId}`);
            } else {
                router.push(`/app/lessons/session/${sessionId}`);
            }
        } catch (error) {
            console.error('Error creating lesson session:', error);
        } finally {
            setIsCreatingSession(false);
        }
    }

    const onClassroom = () => {
        if (course) {
            router.push(`/app/courses/${course.id}/view/classroom`);
        } else if (skillId) {
            router.push(`/app/skills/${skillId}/classroom`);
        }
    }

    const onPodcast = () => {
        if (course) {
            router.push(`/app/courses/${course.id}/view/podcast/new`);
        } else if (skillId) {
            router.push(`/app/skills/${skillId}/podcast/new`);
        }
    }

    return (
        <>
            <FullscreenLoading open={isCreatingSession} title="Creating your lesson session" />
            <Card sx={{ p: 2, mt: 2, borderRadius: 5 }} elevation={4}>
                <Stack spacing={2} gap={1}>
                    <Txt startIcon={<Redo className="animate-draw-in-1s" />} variant="h5" fontWeight={'bold'} sx={{ fontWeight: 'bold', mb: 2, marginBottom: 0 }}>
                        Jump Back In
                    </Txt>

                    {loading && <Skeleton variant="rectangular" height={118} />}
                    {!loading && !noLessons && (
                        <Card
                            onClick={() => onPickLesson(latestLesson?.id ?? '')}
                            sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3,
                                    borderColor: 'primary.main',
                                },
                                borderRadius: 5
                            }}
                            elevation={4}
                        >
                            <Stack spacing={1}>
                                <Txt
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                >
                                    Jump into your next lesson
                                </Txt>
                                <Stack spacing={1}>
                                    {latestLesson?.name && (
                                        <Txt
                                            variant="h6"
                                            startIcon={latestLesson?.emoji}
                                        >
                                            {latestLesson?.name}
                                        </Txt>
                                    )}
                                    {latestLesson?.description && (
                                        <Txt variant="body2" color="text.secondary">
                                            {latestLesson?.description}
                                        </Txt>
                                    )}
                                </Stack>
                            </Stack>
                        </Card>
                    )}

                    <Stack
                        direction="row"
                        spacing={2}
                    >
                        <Button
                            variant="contained"
                            startIcon={<GraduationCap />}
                            onClick={onClassroom}
                            sx={{
                                py: 1.5,
                                flex: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                                borderRadius: 5
                            }}
                        >
                            <Txt variant="body1" fontWeight="bold">Learn in Classroom</Txt>
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<Podcast />}
                            onClick={onPodcast}
                            sx={{
                                py: 1.5,
                                flex: 1,
                                borderRadius: 5,
                                border: `2px solid ${theme.palette.primary.main}`,
                            }}
                        >
                            <Txt variant="body1" fontWeight="bold">Generate Podcast</Txt>
                        </Button>
                    </Stack>
                    <Stack>
                        <PracticeSection skillId={skillId ?? course?.rootSkillId} courseId={course?.id} />
                    </Stack>
                </Stack>
            </Card>
        </>
    );
} 