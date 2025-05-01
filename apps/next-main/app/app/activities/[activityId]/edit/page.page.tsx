'use client'
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {ActivityEditor} from "@/components/activity/ActivityEditor";
import {NotFoundPage} from "@/components/navigation/NotFound";
import { MainMobileLayout } from "@/components/positioning/MainMobileLayout";

export default function ActivityEditorPage({params}: {params: any}){
    const activityId = useRouteParams(params, 'activityId');

    return <MainMobileLayout>
        {
            activityId ? 
                <ActivityEditor activityId={activityId} />
                :
                <NotFoundPage />
        }
    </MainMobileLayout>
}
