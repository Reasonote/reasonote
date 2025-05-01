import {
  Skeleton,
  Stack,
} from "@mui/material";

import {
  ActivityType,
} from "@reasonote/core"
import {ActivityHeaderSimple} from "./ActivityHeader";

export interface ActivityLoadingSkeletonProps {
    activityType: ActivityType;
}

export function ActivityLoadingSkeleton({activityType}: ActivityLoadingSkeletonProps){
    return <Stack>
        <ActivityHeaderSimple activity={{type: activityType}}/>
        <Skeleton variant="rounded" height={200}/>
    </Stack>
}