"use client";

import React, { useRef, useState } from "react";

import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import { useRsnUser } from "@/clientOnly/hooks/useRsnUser";
import { Txt } from "@/components/typography/Txt";
import { notEmpty } from "@lukebechtel/lab-ts-utils";
import { Add as AddIcon, LocalLibrary } from "@mui/icons-material";
import { Box, Button, Grid, Skeleton, Stack } from "@mui/material";
import { Database } from "@reasonote/lib-sdk";
import { useAsyncEffect } from "@reasonote/lib-utils-frontend";
import { useApolloClient } from "@apollo/client";

import { useSupabase } from "../supabase/SupabaseProvider";
import { LessonCard } from "@/components/lesson/LessonCard";
import { SkillChip } from "../chips/SkillChip/SkillChip";
import { createLessonSession } from "@/clientOnly/helpers/createLessonSession";
import { FullscreenLoading } from "@/components/loading/FullscreenLoading";

type LessonFlatFragFragmentWithEditable = Database['public']['Tables']['lesson']['Row'] & { editable: boolean };

interface UserLessonListProps {
    skillId?: string;
    courseId?: string;
    allowEdit?: boolean;
}

export const UserLessonList: React.FC<UserLessonListProps> = ({
    skillId,
    courseId,
    allowEdit = true
}) => {
    const { rsnUserId } = useRsnUser();
    const router = useRouter();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true });
    const [lessons, setLessons] = useState<LessonFlatFragFragmentWithEditable[]>([]);
    const { sb } = useSupabase();
    const isSmallDevice = useIsSmallDevice();
    const [isLoading, setIsLoading] = useState(false);
    const [rootSkillId, setRootSkillId] = useState<string | null>(null);

    const [isTightLayout, setIsTightLayout] = useState(false);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null);

    const ac = useApolloClient();

    const redirectTo = async (lessonId: string) => {
        if (!rsnUserId) return;

        try {
            setLoadingLessonId(lessonId);
            setIsCreatingSession(true);
            const sessionId = await createLessonSession({
                lessonId,
                rsnUserId,
                ac
            });

            if (skillId) {
                router.push(`/app/skills/${skillId}/lessons/session/${sessionId}`);
            } else if (courseId) {
                router.push(`/app/courses/${courseId}/view/lessons/session/${sessionId}`);
            } else {
                router.push(`/app/lessons/session/${sessionId}`);
            }
        } catch (error) {
            console.error('Error creating lesson session:', error);
        } finally {
            setLoadingLessonId(null);
            setIsCreatingSession(false);
        }
    }

    useAsyncEffect(async () => {
        if (courseId) {
            setIsLoading(true);
            const fetchCourse = async () => {
                try {
                    const { data: courseLessonsData, error: courseLessonsError } = await sb.from('course_lesson')
                        .select('lesson (*)')
                        .eq('course', courseId);

                    const { data: courseData, error: courseError } = await sb.from('course')
                        .select('root_skill')
                        .eq('id', courseId);

                    if (courseLessonsError || !courseLessonsData) {
                        console.error('Error fetching course lessons:', courseLessonsError);
                    }
                    if (courseError || !courseData) {
                        console.error('Error fetching course:', courseError);
                    }

                    setLessons(courseLessonsData?.map(courseLesson => courseLesson.lesson as LessonFlatFragFragmentWithEditable) ?? []);
                    setRootSkillId(courseData?.[0]?.root_skill ?? null);
                    setIsTightLayout(lessons.length === 0 || isSmallDevice);
                } catch (error) {
                    console.error('Error fetching course:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCourse();
        }
        else {
            setIsLoading(true);
            const { data: lessonPermsData, error } = await sb
                .from('vw_lesson_memauth')
                .select('*')
                .eq('principal_id', rsnUserId!);

            let query = sb.from('lesson')
                .select('*')
                .in('id', lessonPermsData?.map(lesson => lesson.lesson_id!).filter(notEmpty) ?? []);

            // Add filters based on skillId or courseId if provided
            if (skillId) {
                query = query.eq('root_skill', skillId);
            }
            if (courseId) {
                query = query.eq('course_id', courseId);
            }

            const { data: lessonsData } = await query.order('updated_date', { ascending: false });

            const lessonJoined = lessonsData?.map(lesson => ({
                ...lesson,
                editable: lessonPermsData?.some(perm =>
                    perm.lesson_id === lesson.id &&
                    perm.permissions?.includes('lesson.UPDATE')
                ) ?? false,
            }));

            setLessons(lessonJoined ?? []);
            setIsLoading(false);
            setIsTightLayout(lessonsData?.length === 0 || isSmallDevice);
        }
    }, [sb, rsnUserId, skillId, courseId, isSmallDevice]);

    return (
        <>
            <FullscreenLoading open={isCreatingSession} title="Creating your lesson session" />
            <Stack
                width="100%"
                ref={containerRef}
                alignItems="center"
            >
                <Stack
                    spacing={2}
                    sx={{
                        width: '100%',
                        maxWidth: '48rem',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: .5 }}
                    >
                        <Stack
                            direction={isTightLayout ? "column" : "row"}
                            justifyContent={isTightLayout ? "center" : allowEdit ? "space-between" : "center"}
                            alignItems={isTightLayout ? "center" : "flex-start"}
                            spacing={isTightLayout ? 2 : 0}
                            sx={{ mb: 2 }}
                        >
                            <Txt
                                startIcon={<LocalLibrary className="animate-draw-in-7s" />}
                                variant="h5"
                                fontWeight={'bold'}
                            >
                                {skillId || rootSkillId ?
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        Lessons for
                                        <Txt variant="body1">
                                            <SkillChip
                                                topicOrId={skillId ? skillId : rootSkillId ? rootSkillId : ''}
                                                disableAddDelete
                                                disableLevelIndicator
                                                disableModal
                                            />
                                        </Txt>
                                    </Stack> : 'Your Lessons'}
                            </Txt>
                            {allowEdit && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => router.push('/app/lessons/new')}
                                >
                                    Create New Lesson
                                </Button>
                            )}
                        </Stack>

                        <Box sx={{ overflow: "auto" }}>
                            <Grid container spacing={3} p={.5}>
                                {lessons.length > 0 ? lessons.map(lesson => (
                                    <Grid item xs={12} key={lesson.id}>
                                        <LessonCard
                                            lesson={lesson}
                                            onClick={() => redirectTo(lesson.id)}
                                            onEdit={() => router.push(`/app/lessons/${lesson.id}/edit`)}
                                            showEditButton={allowEdit}
                                            isLoading={loadingLessonId === lesson.id}
                                        />
                                    </Grid>
                                )) : isLoading ? (
                                    <Grid item xs={12}>
                                        <Skeleton variant="rectangular" height={100} />
                                    </Grid>
                                ) : (
                                    <Grid item xs={12}>
                                        <Txt variant="body1" color="text.secondary">
                                            You have no lessons yet
                                        </Txt>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </motion.div>
                </Stack>
            </Stack>
        </>
    );
}; 