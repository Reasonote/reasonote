'use client'
import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import ClassroomComponent from "@/components/classroom/ClassroomComponent";
import { NotFoundPage } from "@/components/navigation/NotFound";
import { Stack } from "@mui/material";

export default function CourseIdClassroomPage() {
    const { courseId } = useRouteParamsSingle(['courseId']);

    return <Stack sx={{ height: '100%' }}>
        <Stack flexGrow={1} minHeight="100%" maxHeight="100%">
            {
                courseId ?
                    <ClassroomComponent courseId={courseId} />
                    :
                    <NotFoundPage />
            }
        </Stack>
    </Stack>
}