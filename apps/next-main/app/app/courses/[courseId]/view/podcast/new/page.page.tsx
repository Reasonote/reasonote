"use client"

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { PodcastGenerationForm } from "@/components/podcast/PodcastGenerationForm";
import { Box, CircularProgress, Stack } from "@mui/material";
import { GetCourseRoute } from "@/app/api/courses/get/routeSchema";
import { Txt } from "@/components/typography/Txt";

export default function PodcastNewPage() {
    const { courseId } = useRouteParamsSingle(['courseId'])
    const router = useRouter();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    if (!courseId) {
        return <Txt>Course ID is required</Txt>
    }

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const result = await GetCourseRoute.call({ courseId: courseId ?? '' });
                setCourse(result.data?.courses[0] ?? null);
            } catch (error) {
                console.error('Error fetching course:', error);
                setError('Failed to load course data');
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <CircularProgress />
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <Txt>Error: {error}</Txt>
            </Stack>
        );
    }

    return <Box maxWidth={'600px'} margin={'auto'}>
        <PodcastGenerationForm
            skillPath={course?.rootSkillId ? [course.rootSkillId] : []}
            courseId={courseId}
            onAfterGenerate={(podcastId) => {
                router.push(`/app/courses/${courseId}/view/podcast/${podcastId}/player`);
            }}
        />
    </Box>
}