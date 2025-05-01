'use client'

import { useEffect, useState, useRef } from "react";
import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { SkillTreeV2 } from "@/components/skill/SkillTreeV2/SkillTreeV2";
import { Box, Stack, CircularProgress } from "@mui/material";
import { GetCourseRoute } from "@/app/api/courses/get/routeSchema";
import { Txt } from "@/components/typography/Txt";

export default function CourseTreePage() {
    const { courseId } = useRouteParamsSingle(['courseId']);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    if (error || !course) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <Txt color="error">{error || 'Course not found'}</Txt>
            </Stack>
        );
    }

    if (!course.rootSkillId) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <Txt>No skill tree available for this course</Txt>
            </Stack>
        );
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                height: '100%',
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <SkillTreeV2
                skillId={course.rootSkillId}
                variant="graph"
                showScore={true}
                containerRef={containerRef}
            />
        </Box>
    );
}