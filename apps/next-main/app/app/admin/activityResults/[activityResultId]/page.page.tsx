'use client'
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {NotFoundPage} from "@/components/navigation/NotFound";
import FullCenter from "@/components/positioning/FullCenter";

import ActivityResultViewer from "./ActivityResultViewer";

export default function ActivityIdPage({params}: {params: any}){
    const activityResultId = useRouteParams(params, 'activityResultId');

    return activityResultId ?
        <FullCenter>
            <ActivityResultViewer activityResultId={activityResultId} /> 
        </FullCenter>
        :
        <NotFoundPage />
}