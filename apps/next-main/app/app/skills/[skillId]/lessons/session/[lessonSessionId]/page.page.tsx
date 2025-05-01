"use client"
import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import { useRouteParams, useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { LessonSession } from "@/components/lesson_session/LessonSession";
import { NotFoundPage } from "@/components/navigation/NotFound";
import { Stack } from "@mui/material";

export default function SkillLessonSessionIdPage({ params }: { params: any }) {
    const lessonSessionId = useRouteParams(params, 'lessonSessionId');
    const searchParams = useSearchParams();
    const router = useRouter();
    const versionVal = searchParams?.get('version');
    const { skillId } = useRouteParamsSingle(['skillId']);

    const onBackOverride = () => {
        router.push(`/app/skills/${skillId}/lessons`);
    }
    const onBackAfterLessonCompleteOverride = () => {
        router.push(`/app/skills/${skillId}`);
    }

    return <Stack alignItems={'center'} justifyContent={'center'}>
        <Stack height={'100%'} maxWidth={'48rem'} width={'100vw'}>
            {lessonSessionId ?
                versionVal === '2' ?
                    null
                    :
                    <LessonSession
                        lessonSessionId={lessonSessionId}
                        onBackOverride={onBackOverride}
                        onBackAfterLessonCompleteOverride={onBackAfterLessonCompleteOverride}
                    />
                :
                <NotFoundPage />
            }
        </Stack>
    </Stack>
}