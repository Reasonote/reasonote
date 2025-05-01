'use client'
import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import ClassroomComponent from "@/components/classroom/ClassroomComponent";
import { NotFoundPage } from "@/components/navigation/NotFound";
import { Stack } from "@mui/material";

export default function SkillIdClassroomPage() {
    const { skillId } = useRouteParamsSingle(['skillId']);

    return <Stack sx={{ height: '100%' }}>
        <Stack flexGrow={1} minHeight="100%" maxHeight="100%">
            {
                skillId ?
                    <ClassroomComponent skillId={skillId} />
                    :
                    <NotFoundPage />
            }
        </Stack>
    </Stack>
}