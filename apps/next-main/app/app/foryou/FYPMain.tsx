"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import _ from "lodash";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import posthog from "posthog-js";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {useUserXP} from "@/clientOnly/hooks/useUserXP";
import {ActivityFooter} from "@/components/activity/footer/ActivityFooter";
import {BaseCallout} from "@/components/cards/BaseCallout";
import {vAIPageContext} from "@/components/chat/ChatBubble";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useApolloClient} from "@apollo/client";
import {
  Refresh,
  Warning,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Fade,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {ActivityResult} from "@reasonote/activity-definitions";
import {ActivityTypes} from "@reasonote/core";
import {
  createUserActivityResultFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {listIsPrefixOf} from "@reasonote/lib-utils";
import {
  useAsyncEffect,
  useInterval,
} from "@reasonote/lib-utils-frontend";

import {generateFYPActivity} from "./algorithm/generateFYPActivity";
import {FYPActivity} from "./FYPActivity";
import FYPHeaderContainer from "./FYPHeader/FYPHeader";
import {
  ActivityWithSkillStack,
  FYPIntent,
} from "./FYPTypes";

const MAX_FAILED_TRIES = 5;

export interface ForYouMainProps {
  fypIntent: FYPIntent | null;
  setFYPIntent: (intent: FYPIntent | null) => void;
  onBack: () => void;
}

export default function ForYouMain({ fypIntent, setFYPIntent, onBack }: ForYouMainProps) {
  const { skills: skillData, loading: skillLoading, error, refetch } = useUserSkills();
  const ac = useApolloClient();

  const { rsnUserId } = useRsnUser();

  const pinned = useMemo(() => {
    if (fypIntent?.type === 'review-pinned') {
      return fypIntent.pinned;
    }
    else {
      return null;
    }
  }, [fypIntent]);

  const allowedActivityConfig = fypIntent?.activitiesAllowed;
  const allowedActivities = useMemo(() => {
    if (allowedActivityConfig === undefined) {
      return [...ActivityTypes];
    }
    else {
      if (allowedActivityConfig.type === 'allowAll') {
        return [...ActivityTypes];
      }
      else {
        return [
          ...allowedActivityConfig.allowedActivityTypes,
        ]
      }
    }
  }, [allowedActivityConfig]);

  const [settingsToggled, setSettingsToggled] = useState(false);

  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice()

  const searchParams = useSearchParams();

  // TODO: we should always have at least three exercises ready to show.
  // Randomly sample from the list of skills to show three exercises.
  const [activityQueue, setActivityQueue] = useState<
    ActivityWithSkillStack[]
  >([]);
  const [currentActivity, setCurrentActivity] = useState<ActivityWithSkillStack | null>(null);

  const [recentlyShownActivities, setRecentlyShownActivities] = useState<ActivityWithSkillStack[]>([]);

  const exerciseGeneratingRef = useRef<"idle" | "generating">("idle");

  const router = useRouter();

  const { token } = useToken();
  const { supabase } = useSupabase();

  const hasSkills = (skillData && skillData.length > 0)

  const currentActivityId = currentActivity?.activity.id;

  const { data: userXPData, refetch: refetchSkillXP } = useUserXP(currentActivity?.skillIdStack[0]);

  useEffect(() => {
    if (currentActivity) {
      refetchSkillXP();
    }
  }, [currentActivity])

  useEffect(() => {
    if (currentActivity) {
      // Only keep around the last 3 activities.
      setRecentlyShownActivities((old) => {
        const newActivities = [currentActivity, ...old].slice(0, 3);
        return newActivities;
      })
    }
  }, [currentActivityId])

  const isValidActivityToShowRightNow = useCallback((act: ActivityWithSkillStack) => {
    // This shouldn't happen.
    const actSkillIdStack = act.skillIdStack;
    if (!actSkillIdStack) {
      console.debug('Activity has no skill stack')
      return false;
    }

    // If we've shown this activity recently, don't show it again.
    if (recentlyShownActivities.map((act) => act.activity.id).includes(act.activity.id)) {
      console.debug('Activity has been shown recently')
      return false;
    }

    // Check to see if we've shown this skill in the past 3.
    // If we have, don't show it again.
    // TODO: re-enable this when it isn't causing issues...
    // const skillHasBeenShownRecently = recentlyShownActivities.map((act) => act.skillIdStack.join(',')).includes(actSkillIdStack.join(','));
    // if (skillHasBeenShownRecently){
    //   console.debug('Skill has been shown recently')
    //   return false;
    // }

    // If we've pinned, only show activities that are in the pinned skill path.
    const pinnedSkillIdPath = pinned?.skillIdPath;
    if (!pinnedSkillIdPath) {
      return true;
    }
    if (pinnedSkillIdPath.length === 0) {
      return true;
    }
    return listIsPrefixOf(pinnedSkillIdPath, actSkillIdStack);
  }, [pinned, recentlyShownActivities])

  const validActivityQueue = useMemo(() => {
    console.log("FILTERING VALID ACTIVITIES....")
    return activityQueue.filter(isValidActivityToShowRightNow);
  }, [activityQueue, isValidActivityToShowRightNow, pinned])

  useEffect(() => {
    // If the user doesn't have any skills,
    // Take them to the add skills page
    if (!skillLoading && !hasSkills && !pinned) {
      // router.push("/app/foryou/add_skills");
    }
  }, [hasSkills, skillLoading])

  const popActivity = useCallback(() => {
    console.log(`Popping activity`)
    if (validActivityQueue.length === 0) {
      setCurrentActivity(null);
      return;
    }

    const queueCopy = [...validActivityQueue];

    // Only pop the first activity if it's valid.
    const poppedActivity = queueCopy.shift();

    // Reset the AI page context because we're bringing in a new activity.
    vAIPageContext(null);
    setActivityQueue((ex) => ex.filter((e) => e.activity.id !== poppedActivity?.activity.id));
    setCurrentActivity(poppedActivity ?? null);
  }, [activityQueue, isValidActivityToShowRightNow]);

  const [activitiesCompleted, setActivitiesCompleted] = useState(0);
  const startTime = useRef(Date.now());

  // Track when component unmounts
  useEffect(() => {
    return () => {
      posthog.capture('practice_mode_exited', {
        activities_completed: activitiesCompleted,
        session_duration_ms: Date.now() - startTime.current,
      }, {
        send_instantly: true
      });
    };
  }, []);

  const skipActivity = useCallback(async () => {
    // Post the result to the server.
    await ac.mutate({
      mutation: createUserActivityResultFlatMutDoc,
      variables: {
        objects: [
          {
            activity: currentActivityId,
            user: rsnUserId,
            score: 0,
            skipped: true
          }
        ]
      }
    })
      .then(() => {
        console.log(`Posted activity result to server.`);
      })
      .catch(() => {
        console.error(`Error posting activity result to server.`);
      })

    popActivity();
  }, [popActivity]);

  useEffect(() => {
    if (!currentActivity && validActivityQueue.length > 0) {
      popActivity();
    }
  }, [validActivityQueue, currentActivity]);

  useEffect(() => {
    const pinnedSkillIdPath = pinned?.skillIdPath;
    if (
      currentActivity &&
      (
        !allowedActivities.includes(currentActivity?.activity.type as any)
        ||
        !listIsPrefixOf(pinnedSkillIdPath ?? [], currentActivity.skillIdStack)
      )
    ) {
      popActivity();
    }
  }, [allowedActivities, validActivityQueue, currentActivity]);

  const [failedTries, setFailedTries] = useState(0);

  const tryRefillQueue = useCallback(async () => {
    // Generate exercises if there are less than MIN_QUEUE_NUM left
    const MIN_QUEUE_NUM = 3;
    const NUM_EXTRA_TO_GEN = 2;

    const numLacking = Math.max(MIN_QUEUE_NUM - validActivityQueue.length, 0);

    // If we have a pinned skill, and we're showing the UserSkillAttestation activity,
    // then we wait until the user has attested to the skill before we generate more activities.
    const pinnedSkillIdPath = pinned?.skillIdPath;
    const hasPinnedSkill = pinnedSkillIdPath && pinnedSkillIdPath.length > 0;
    const hasCurrentActivity = !!currentActivity;

    if (failedTries < MAX_FAILED_TRIES && numLacking > 0 && allowedActivities.length > 0) {
      // We wanna stay ahead, so let's generate a few extra.
      const numToGen = numLacking + NUM_EXTRA_TO_GEN;

      if (exerciseGeneratingRef.current === "idle") {
        exerciseGeneratingRef.current = "generating";
        console.log(`Generating ${numToGen} exercises`);

        /** Was there an error thrown while refilling the queue? */
        var errorWasThrown = false;
        try {
          // TEST FIXTURE
          const test__force_failure = searchParams?.get('test__force_failure')
          if (test__force_failure === 'true') {
            throw new Error("TEST__FORCE_FAILURE")
          }

          const theToken = token ?? (await supabase.auth.getSession())?.data?.session?.access_token;

          const newActivities = await generateFYPActivity({
            ac,
            sb: supabase,
            userId: rsnUserId ?? '',
            algorithm: "v1",
            token: theToken ?? '',
            allowedActivityTypes: allowedActivities,
            numToGen,
            activityQueue,
            pinned,
            skillData: skillData as any,
            onActivityComplete: (act) => {
              setActivityQueue((oldActQueue) => {
                if (oldActQueue.find((e) => e.activity.id === act.activity.id)) {
                  return oldActQueue;
                }
                else {
                  return [
                    ...oldActQueue,
                    {
                      activity: {
                        ...act.activity,
                        nodeId: act.activity.id,
                      },
                      skillIdStack: act.skillIdStack,
                    },
                  ]
                }
              });
            }
          })

          // We succeeded, so reset the failed tries.
          setFailedTries(0);
        }
        catch (err: any) {
          console.error("Failed to generate activity", err);

          errorWasThrown = true;
        } finally {
          // We handle this here because we can reset the failed tries.
          if (!errorWasThrown) {
            setFailedTries(0);
          }
          else {
            // We failed, so increment the failed tries.
            setFailedTries((t) => t + 1);
          }
          exerciseGeneratingRef.current = "idle";
        }
      }
    }
  }, [
    activityQueue,
    validActivityQueue,
    allowedActivities,
    skillData,
    ac,
    supabase,
    searchParams,
    token,
    isValidActivityToShowRightNow
  ]);

  // If things change, we want to check if
  // we should replenish the queue.
  useAsyncEffect(tryRefillQueue, [
    skillData,
    currentActivity,
    refetch,
    searchParams
  ]);

  // Periodically check the queue, just in case.
  useInterval(() => {
    tryRefillQueue();
  }, 1000);

  const activityButtonsDisabled = !currentActivity;

  const handleActivityComplete = useCallback(async (activityResult: ActivityResult) => {
    setActivitiesCompleted(prev => prev + 1);
  }, []);

  const handleActivityCompleteAfterResultPosted = useCallback(async () => {
    await refetchSkillXP();
  }, [refetchSkillXP]);

  return (
    <Fade in={true} timeout={250}>
      <Stack gap={isSmallDevice ? 0.5 : 2} sx={{ height: '100%', overflow: 'hidden' }}>
        {/* FYP Header - Fixed */}
        <FYPHeaderContainer
          currentActivity={currentActivity}
          settingsDisabled={false}
          onBack={onBack}
          intent={fypIntent}
          setIntent={setFYPIntent}
          levelInfo={userXPData?.levelInfo}
          dailyXp={userXPData?.dailyXp}
        />

        {/* Content Area - Takes remaining space */}
        <Stack
          flex={1}
          minHeight={0}
          overflow="hidden"
          alignItems="flex-start"
        >
          <Card
            id="fyp-activity"
            sx={{
              padding: "5px",
              display: 'flex',
              minHeight: 0,
              width: '100%',
              overflow: 'auto'
            }}
            elevation={5}
          >
            {failedTries >= MAX_FAILED_TRIES && !currentActivity ? (
              <BaseCallout
                icon={<Warning />}
                header={<Typography>Issue Loading Activities!</Typography>}
                backgroundColor={theme.palette.error.dark}
                sx={{ paper: { padding: '8px' } }}
              >
                <div style={{ padding: '10px', alignItems: 'center', justifyItems: 'center', alignContent: 'center', justifyContent: 'center', display: 'flex' }}>
                  <Button
                    startIcon={<Refresh />}
                    onClick={() => router.refresh()}
                    variant="contained"
                    color="error"
                  >
                    <Typography variant="body1">Try Again</Typography>
                  </Button>
                </div>
              </BaseCallout>
            ) : (
              <FYPActivity
                activityRegenerating={false}
                currentActivity={currentActivity}
                hasSkills={hasSkills}
                skillLoading={skillLoading}
                onActivityComplete={handleActivityComplete}
                onActivityCompleteAfterResultPosted={handleActivityCompleteAfterResultPosted}
                popActivity={() => popActivity()}
              />
            )}
          </Card>
        </Stack>

        {/* Footer - Fixed */}
        <ActivityFooter
          activityId={currentActivityId ?? ""}
          onBack={() => setFYPIntent(null)}
          onNext={() => popActivity()}
          onSkip={() => skipActivity()}
          isNextDisabled={false}
          activityButtonsDisabled={activityButtonsDisabled}
        />
      </Stack>
    </Fade>
  );
}
