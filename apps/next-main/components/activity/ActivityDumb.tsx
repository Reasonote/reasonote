import {aib} from "@/clientOnly/ai/aib";
import {
  Skeleton,
  Typography,
} from "@mui/material";
import {ActivitySubmitResult} from "@reasonote/core";
import {Activity} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {
  useActivityTypeClient,
} from "./activity-type-clients/useActivityTypeClient";

export interface ActivityDumbProps {
  activity: Activity;
  onSubmission?: (userAnswer: any) => Promise<ActivitySubmitResult>;
  onSkip?: (partialSubmission: any) => Promise<void>;
  hideSkipButton?: boolean;
  restrictHeight?: boolean;
}

export function ActivityDumb({
  activity,
  onSubmission,
  onSkip,
  hideSkipButton = false,
  restrictHeight = false,
}: ActivityDumbProps) {
  const safeTypeConfig = JSONSafeParse(activity.typeConfig);

  const {data: {definition}} = useActivityTypeClient({
    activityType: activity.type,
  });
  const {data: {
    client
  }} = useActivityTypeClient({activityType: activity.type});
 


  if (!activity.typeConfig){
    return <Skeleton height={200}/>
  }

  if (!safeTypeConfig.data) {
    return <div>
      <Typography>Error: Invalid typeConfig.</Typography>
      <pre>{JSON.stringify(activity.typeConfig, null, 2)}</pre>
    </div>;
  }

  if (!definition) {
    return <Typography>Error: Invalid activity type (missing Definition).</Typography>;
  }

  if (!client) {
    return <Typography>Error: Invalid activity client (missing Client).</Typography>;
  }

  return client.render({
    config: safeTypeConfig.data,
    callbacks:{
      onSubmission,
      onSkip,
      hideSkipButton,
      restrictHeight,
    },
    ai: aib 
  });
}
