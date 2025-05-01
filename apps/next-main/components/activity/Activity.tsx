import {
  useCallback,
  useEffect,
  useState,
} from "react";

import _ from "lodash";
import {ErrorBoundary} from "next/dist/client/components/error-boundary";
import posthog from "posthog-js";

import {
  ActivityAfterCompleteRoute,
} from "@/app/api/activity/after_complete/routeSchema";
import {ActivitySubmitRoute} from "@/app/api/activity/submit/routeSchema";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useUserXP} from "@/clientOnly/hooks/useUserXP";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {
  ErrorOutline,
  KeyboardArrowDown,
  Refresh,
  Restore,
  SkipNext,
  Warning,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {ActivityResult} from "@reasonote/activity-definitions";
import {GetActivityResultsDeepDocument} from "@reasonote/lib-sdk-apollo-client";
import {
  useActivityFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

import {BaseCallout} from "../cards/BaseCallout";
import {Txt} from "../typography/Txt";
import {
  useActivityTypeClient,
} from "./activity-type-clients/useActivityTypeClient";
import {ActivityBody} from "./ActivityBody";

export interface ActivityProps {
  activityId: string;
  lessonSessionId?: string;
  onActivityComplete?: (completed: ActivityResult) => void;
  onActivityCompleteAfterResultPosted?: (args: { activityId?: string, completed?: ActivityResult, resultId?: string }) => void;
  onNextActivity?: () => void;
  disableEdit?: boolean;
  /** Disables the button for adding / removing the activity from the user's library. */
  disableAddToUserLibrary?: boolean;
  /** Context that this activity is being displayed in, if any.*/
  displayContext?: {
    type: 'skillIdPath',
    skillIdPath: string[];
  }
  /** Show Delete */
  onDelete?: () => void;
  /** Whether to disable the overflow for the body of the activity. */
  disableBodyOverflow?: boolean;
  /** Whether to disable the skip button. */
  disableSkip?: boolean;
  /** Whether to disable the header of the activity. */
  disableHeader?: boolean;
  /** Whether to restrict the height of the activity. */
  restrictHeight?: boolean;
}

export function useUserHasSeenActivityBefore(activityId: string) {
  const { rsnUserId } = useRsnUser();

  const activityResult = useQuery(GetActivityResultsDeepDocument, {
    variables: {
      filter: {
        user: {
          eq: rsnUserId ?? 'EMPTY'
        },
        activity: {
          eq: activityId
        }
      }
    }
  })

  const edges = activityResult.data?.userActivityResultCollection?.edges ?? [];

  return edges && edges.length > 0;
}

export function Activity({ activityId, lessonSessionId, displayContext, onActivityComplete, onActivityCompleteAfterResultPosted, onNextActivity, disableEdit, disableAddToUserLibrary, onDelete, disableBodyOverflow, disableSkip, disableHeader, restrictHeight }: ActivityProps) {
  const { rsnUserId } = useRsnUser();
  const theme = useTheme();
  const { data: activity, loading, error, refetch } = useActivityFlatFragLoader(activityId);
  const ac = useApolloClient();
  const { token } = useToken();
  const [activityResult, setActivityResult] = useState<ActivityResult | null>(null);
  const [showResultDetails, setShowResultDetails] = useState(false);
  const [activityResultId, setActivityResultId] = useState<string | null>(null);

  const [isLoadingNextActivity, setIsLoadingNextActivity] = useState(false);
  const { refetch: refetchSubscriptionData } = useReasonoteLicense();
  const { refetch: refetchUserXP } = useUserXP();

  useEffect(() => {
    setIsLoadingNextActivity(false);
  }, [activityId]);

  const { supabase } = useSupabase();
  const skillIdPath = displayContext?.type === 'skillIdPath' ? displayContext.skillIdPath : undefined;

  const { data: { client, definition } } = useActivityTypeClient({ activityType: activity?.type });

  const toggleDetails = (open: boolean) => {
    setShowResultDetails(open);
  }

  // const activityCompleted = useCallback(async (result: ActivityResult) => {
    // // If the activity has a skipResultBar flag, then we skip the result bar and go straight to the next activity.
    // if (definition?.skipResultBar) {
    //   setIsLoadingNextActivity(true);
    //   onNextActivity?.();
    // }

    // // If this was a "skip", we should go straight to the next activity.
    // if (result.type === 'skipped') {
    //   onNextActivity?.();
    // }

    // const generatedForSkillPaths = JSONSafeParse(activity?.generatedForSkillPaths)?.data as string[][];
    // const firstPath = generatedForSkillPaths?.[0];
    // const rootSkillId = firstPath?.[0];

    // setActivityResult(result);
    // onActivityComplete?.(result);
    
    // /////////////////////////////////////////////////
    // // 1. Post the result to the server.
    // const { error, data } = await ActivityCompleteRoute.call({
    //   activityId,
    //   lessonSessionId,
    //   score: result.type === 'graded' ? result.grade0to100 : undefined,
    //   resultData: result.resultData,
    //   skipped: result.type === 'skipped' ? true : undefined,
    // });

    // if (error) {
    //   console.error('Error completing activity:', error);
    // }

    // onActivityCompleteAfterResultPosted?.({
    //   activityId,
    //   completed: result,
    //   resultId: data?.activityResultId,
    // });

    // refetchUserXP?.();

    // setActivityResultId(data?.activityResultId ?? null);

    // /////////////////////////////////////////////////////////
    // // Refetch the user's subscription data.
    // console.log('refetching subscription data...', refetchSubscriptionData);
    // refetchSubscriptionData?.();

    // /////////////////////////////////////////////////////////
    // // Logging Capture the event in PostHog.
    // posthog.capture('activity_completed', {
    //   lessonSessionId: lessonSessionId,
    //   skillId: skillIdPath?.[skillIdPath.length - 1],
    //   score: result.type === 'graded' ? result.grade0to100 : undefined,
    //   type: result.type,
    //   activityType: result.activityType
    // }, {
    //   send_instantly: true,
    // });

    // /////////////////////////////////////////////////////////
    // // 2. Capture the event in Supabase.
    // await ActivityAfterCompleteRoute.call({
    //   activityId: activityId,
    //   activityResult: result,
    //   lessonSessionId: lessonSessionId
    // })
  // }, [onActivityComplete, refetchSubscriptionData, activityId, lessonSessionId, rsnUserId, skillIdPath, supabase]);

  const onSubmission = useCallback(async (userAnswer: any = null, skipped: boolean = false) => {
    // If the activity has a skipResultBar flag, then we skip the result bar and go straight to the next activity.
    if (definition?.skipResultBar || skipped) {
      setIsLoadingNextActivity(true);
      onNextActivity?.();
    }

    // 1. Call the activity/grade endpoint.
    const { error, data } = await ActivitySubmitRoute.call({
      activityId,
      userAnswer: userAnswer || {},
      lessonSessionId,
      skipped,
    });

    /////////////////////////////////////////////////////////
    // Refetch the user's subscription data.
    console.log('refetching subscription data...', refetchSubscriptionData);
    refetchSubscriptionData?.();

    const resultData = data?.resultData;
    const resultId = data?.resultId;

    if (!resultData || !resultId) {
      throw new Error("No resultData or resultId provided");
    }

    onActivityComplete?.(resultData);

    onActivityCompleteAfterResultPosted?.({
      activityId,
      completed: resultData,
      resultId: resultId,
    });

    // 2. Set the result based on the grade endpoint's return value.
    setActivityResultId(resultId);
    setActivityResult(resultData);

    /////////////////////////////////////////////////////////
    // Logging Capture the event in PostHog.
    posthog.capture(skipped ? 'activity_skipped' : 'activity_completed', {
      lessonSessionId: lessonSessionId,
      skillId: skillIdPath?.[skillIdPath.length - 1],
      score: resultData.type === 'graded' ? resultData.grade0to100 : undefined,
      type: resultData.type,
      activityType: resultData.activityType
    }, {
      send_instantly: true,
    });

    // No await
    ActivityAfterCompleteRoute.call({
      activityId: activityId,
      activityResult: resultData,
      lessonSessionId: lessonSessionId
    })

    return resultData;
  }, [activityId, definition?.skipResultBar, lessonSessionId, onActivityCompleteAfterResultPosted, onNextActivity, refetchSubscriptionData, skillIdPath]);

  const onSkip = useCallback(async (partialSubmission: any = {}) => {
    return onSubmission(partialSubmission, true);
  }, [onSubmission]);

  if (loading) {
    return (
      <div>
        <Typography variant="h4">Loading...</Typography>
        <LinearProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Stack gap={1}>
          <Txt startIcon={<ErrorOutline />} color="error">Error Loading Activity</Txt>
          <Button startIcon={<Refresh />} onClick={() => refetch()}>Retry</Button>
        </Stack>
      </Card>
    );
  }

  if (!activityId) {
    return (
      <Typography variant="body1" color={"error"}>
        No activityId provided.
      </Typography>
    );
  }

  if (!activity) {
    return (
      <Typography variant="h4" color={"error"}>
        Activity `{activityId}` not found.
      </Typography>
    );
  }

  return (
    <ErrorBoundary
      errorComponent={({ error, reset }) => {
        return <BaseCallout
          icon={<Warning />}
          header={<Typography>Oh No! This Activity Failed to Render.</Typography>}
          backgroundColor={theme.palette.error.dark}
          sx={{ paper: { padding: '0px' } }}
        >
          <Stack gap={1} width={'100%'}>
            <Typography variant="caption">ActivityId: {activityId}</Typography>
            {
              onNextActivity ?
                <Button
                  startIcon={<SkipNext />}
                  onClick={() => onNextActivity?.()}
                  variant="contained"
                  color="error"
                >
                  <Typography variant="body1">Next Activity</Typography>
                </Button>
                :
                <Button
                  startIcon={<Restore />}
                  onClick={() => window.location.reload()}
                  variant="contained"
                  color="error"
                >
                  <Typography variant="body1">Refresh Page</Typography>
                </Button>
            }

            <Accordion sx={{ backgroundColor: theme.palette.error.main }}>
              <AccordionSummary expandIcon={<KeyboardArrowDown />}>
                <Typography variant="caption">Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">Error</Typography>
                <Typography variant="body2">Name: <b>"{error.name}"</b></Typography>
                <Typography variant="body2">Message: <b>"{error.message}"</b></Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </BaseCallout>
      }}
    >
      <ActivityBody
        activityId={activityId}
        lessonSessionId={lessonSessionId}
        activity={activity}
        disableEdit={disableEdit}
        disableAddToUserLibrary={disableAddToUserLibrary}
        activityResult={activityResult}
        activityResultId={activityResultId ?? undefined}
        onSubmission={onSubmission}
        onSkip={onSkip}
        skillIdPath={skillIdPath ?? []}
        onNextActivity={onNextActivity}
        showResultDetails={showResultDetails}
        toggleDetails={toggleDetails}
        definition={definition}
        disableBodyOverflow={disableBodyOverflow}
        onDelete={onDelete}
        disableSkip={disableSkip}
        disableHeader={disableHeader}
        restrictHeight={restrictHeight}
      />
    </ErrorBoundary>
  );
}
