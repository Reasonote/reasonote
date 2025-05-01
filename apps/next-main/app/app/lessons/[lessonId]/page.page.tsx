'use client'
import {useRouter} from "next/navigation";

import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {
  ActivityLoadingComponent,
} from "@/components/activity/components/ActivityLoadingComponent";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {Txt} from "@/components/typography/Txt";
import {useQuery} from "@apollo/client";
import {AddCircle} from "@mui/icons-material";
import {Stack} from "@mui/material";
import {getLessonFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";

import {ActionCard} from "../../activities/new/page.page";

export default function LessonIdPage({params}: {params: any}){
    const lessonId = useRouteParams(params, 'lessonId');

    const {data: lessonResult, loading, error} = useQuery(getLessonFlatQueryDoc, {
        variables: {
            filter: {
                id: {
                    eq: lessonId
                }
            }
        }
    })

    const lesson = lessonResult?.lessonCollection?.edges?.[0]?.node;


    const router = useRouter();

    return <CenterPaperStack> 
            {
                loading ?
                (
                    <ActivityLoadingComponent />
                )
                :
                (
                    (
                        lesson === undefined || error ?
                            // TODO: Add a 404 page
                            <Stack>
                                <Txt variant={'h4'}>Lesson not found</Txt>
                                <ActionCard
                                    onClick={() => {
                                        router.push('/app/lessons/new')
                                    }}
                                    cardProps={{
                                        elevation: 20
                                    }}
                                >
                                    <Txt startIcon={<AddCircle/>}>Create a new lesson</Txt>
                                </ActionCard>
                            </Stack>
                            :
                            <ActionCard
                                onClick={() => {
                                    router.push(`/app/lessons/${lesson.id}/edit`)
                                }}
                            >
                                <Txt variant={'h4'}>{lesson.name}</Txt>
                                <Txt>{lesson.summary}</Txt>
                            </ActionCard>
                    )
                )
            }
    </CenterPaperStack> 
}