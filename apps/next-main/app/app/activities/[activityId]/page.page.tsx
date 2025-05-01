'use client'
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {Activity} from "@/components/activity/Activity";
import {
  ActivityLoadingComponent,
} from "@/components/activity/components/ActivityLoadingComponent";
import {NotFoundPage} from "@/components/navigation/NotFound";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {useQuery} from "@apollo/client";
import {getActivityFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";

export default function ActivityIdPage({params}: {params: any}){
    const activityId = useRouteParams(params, 'activityId');
    const activityResult = useQuery(getActivityFlatQueryDoc, {
        variables: {
            filter: {
                id: {
                    eq: activityId
                }
            }
        }
    })

    const firstActivity = activityResult.data?.activityCollection?.edges?.[0]?.node;

    const isSmallDevice = useIsSmallDevice();

    return activityId ? <CenterPaperStack paperProps={{elevation: isSmallDevice ? 0 : undefined}}> 
            {
                activityResult.loading ?
                (
                    <ActivityLoadingComponent />
                )
                :
                (
                    (
                        firstActivity === undefined || !activityId ?
                            <NotFoundPage />
                            :
                            <Activity activityId={activityId} onActivityComplete={() => {}} />
                    )
                )
            }
    </CenterPaperStack> 
    :
    <NotFoundPage/>
}