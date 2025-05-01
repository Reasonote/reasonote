import React from "react";

import _ from "lodash";
import {
  Delete,
  Edit,
} from "lucide-react";
import {useRouter} from "next/navigation";

import {Restore} from "@mui/icons-material";
import {
  Chip,
  IconButton,
  Stack,
} from "@mui/material";
import {ActivityResult} from "@reasonote/activity-definitions";
import {
  ActivityMaxHeightModeArgument,
  ActivitySubmitResult,
  useActivityMaxHeight,
} from "@reasonote/core";
import {JSONSafeParse} from "@reasonote/lib-utils";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";

import {useSupabase} from "../supabase/SupabaseProvider";
import {useUserHasSeenActivityBefore} from "./Activity";
import {
  getActivityTypeClient,
} from "./activity-type-clients/getActivityTypeClient";
import {ActivityCitationHeaderIndicator} from "./ActivityCitationIndicator";
import {ActivityDumb} from "./ActivityDumb";
import {ActivityHeaderSimple} from "./ActivityHeader";
import {ActivityCompleteBanner} from "./components/ActivityCompleteBanner";
import {ActivitySourceIndicator} from "./components/ActivitySourceIndicator";
import {
  AddToUserActivityLibraryButton,
} from "./components/AddToUserActivityLibraryButton";

export interface ActivityBodyProps {
  activityId: string;
  activity: any;
  lessonId?: string;
  lessonSessionId?: string;
  activityResult: ActivityResult | null;
  activityResultId?: string;
  /**
   * Called when the user submits an answer.
   * 
   * This is called when the user has submitted an answer to be graded.
   * @param userAnswer The user's answer.
   * @returns The grade for the answer.
   */
  onSubmission: (userAnswer: any) => Promise<ActivitySubmitResult>;
  skillIdPath: string[];
  onNextActivity: any;
  showResultDetails: boolean;
  toggleDetails: any;
  definition: any;
  disableAddToUserLibrary?: boolean;
  disableEdit?: boolean;
  onDelete?: any;
  maxHeight?: ActivityMaxHeightModeArgument;
  disableBodyOverflow?: boolean;
  onSkip?: (partialSubmission: any) => Promise<void>;
  disableSkip?: boolean;
  disableHeader?: boolean;
  restrictHeight?: boolean;
}

export function ActivityBody({
  activityId,
  lessonId,
  lessonSessionId,
  activity,
  activityResult,
  activityResultId,
  skillIdPath,
  onNextActivity,
  onSubmission,
  onSkip,
  showResultDetails,
  toggleDetails,
  definition,
  disableAddToUserLibrary,
  disableEdit,
  onDelete,
  maxHeight = 'viewport',
  disableBodyOverflow,
  disableSkip,
  disableHeader,
  restrictHeight = true,
}: ActivityBodyProps) {
  if (!activity) {
    return null;
  }

  const { sb } = useSupabase();

  const activityMaxHeight = useActivityMaxHeight(maxHeight);

  const grade0To100 = activityResult?.type === 'graded' ? (activityResult?.grade0to100 ?? undefined) : undefined;


  //TODO dirty
  const completedTipFinal = useAsyncMemo(async () => {
    if (!activityResult || !activity) return null;

    const actClient = await getActivityTypeClient({ activityType: activity.type, sb });

    if (actClient?.getCompletedTip) {
      return await actClient.getCompletedTip(activityResult);
    }
  }, [activityResult]);

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const hasBeenSeenBefore = useUserHasSeenActivityBefore(activityId);
  const router = useRouter();

  return <Stack className="rsn_activity" data-testid="activity-body" ref={wrapperRef} sx={{ maxHeight: '100%', width: '100%', height: '100%', position: 'relative' }}>
    {
      !definition?.hideCardHeader && !disableHeader && (
        <ActivityHeaderSimple
          activity={{
            type: activity.type
          }}
          rightOptions={
            <Stack direction={'row'} gap={1} alignItems={'center'} className="rsn_activity_header">
              {hasBeenSeenBefore ?
                <Chip size="small" icon={<Restore color="primary" />} label={"Review"} />
                : <ActivitySourceIndicator activityId={activityId} />}
              {!disableAddToUserLibrary ?
                <AddToUserActivityLibraryButton activityId={activityId} />
                :
                null
              }
              {!disableEdit ?
                <IconButton
                  onClick={() => {
                    router.push(`/app/activities/${activityId}/edit`)
                  }}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
                :
                null
              }
              {
                onDelete ?
                  <IconButton
                    onClick={() => onDelete()}
                    size="small"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                  :
                  null
              }
              <ActivityCitationHeaderIndicator activityConfig={_.isString(activity.typeConfig) ? JSONSafeParse(activity.typeConfig).data : activity.typeConfig}/>
            </Stack>}
        />
      )
    }

    <Stack
      sx={{
        maxHeight: activityMaxHeight,
        overflowY: disableBodyOverflow ? undefined : 'auto',
        minHeight: '0px',
        flexShrink: 1,
      }}
      gap={1}
      className={'rsn_activity_body'}
    >
      <ActivityDumb
        key={activityId}
        activity={{ ...activity, nodeId: activity.id }}
        onSubmission={onSubmission}
        onSkip={onSkip}
        hideSkipButton={disableSkip}
        restrictHeight={restrictHeight}
      />
    </Stack>
    {
      activityResult && activityResult.type === 'graded' ?
        <Stack sx={{ flexShrink: '0', width: '100%' }} gap={1}>
          <ActivityCompleteBanner
            grade0To100={grade0To100}
            activityResult={activityResult}
            completedTipFinal={completedTipFinal}
            definition={definition}
            lessonSessionId={lessonSessionId}
            lessonId={lessonId}
            activityId={activityId}
            onNextActivity={onNextActivity}
            activityResultId={activityResultId}
          />
        </Stack>
        :
        null
    }
  </Stack>
}