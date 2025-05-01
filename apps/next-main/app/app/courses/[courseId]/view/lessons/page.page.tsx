'use client'
import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { Stack } from "@mui/material";
import { UserLessonList } from "@/components/lists/UserLessonList";
import { Txt } from "@/components/typography/Txt";

export default function CourseLessonsPage() {
    const { courseId } = useRouteParamsSingle(['courseId']);

    if (!courseId) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <Txt color="error">Course not found</Txt>
            </Stack>
        );
    }

    return (
        <Stack gap={2} p={2} height="100%" alignItems="center">
            <UserLessonList courseId={courseId} allowEdit={false} />
        </Stack>
    );
}
