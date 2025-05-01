"use client"
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {AnimatePresence} from "framer-motion";
import _ from "lodash";

import {
  PracticeGetNextActivityRoute,
} from "@/app/api/practice/get_next_activity/routeSchema";
import ForYouMain from "@/app/app/foryou/FYPMain";
import {FYPIntent} from "@/app/app/foryou/FYPTypes";
import {useRefreshCallback} from "@/clientOnly/hooks/useCallbackSingleThreaded";
import {useIsOverLicenseLimit} from "@/clientOnly/hooks/useIsOverLicenseLimit";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useUserXP} from "@/clientOnly/hooks/useUserXP";
import {Activity} from "@/components/activity/Activity";
import {ActivityFooter} from "@/components/activity/footer/ActivityFooter";
import MissedActivityIcon from "@/components/icons/MissedActivityIcon";
import SavedActivityIcon from "@/components/icons/SavedActivityIcon";
import {
  FriendlyNotifierPopover,
} from "@/components/notifications/FriendlyNotifierPopover";
import {PracticeHeaderDumb} from "@/components/practice/PracticeHeaderDumb";
import {
  SkeletonWithOverlay,
} from "@/components/smart-skeleton/SkeletonWithOverlay";
import {Txt} from "@/components/typography/Txt";
import {useApolloClient} from "@apollo/client";
import {
  asyncSleep,
  notEmpty,
} from "@lukebechtel/lab-ts-utils";
import {
  BookmarkAdd,
  Refresh,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ActivityType,
  ActivityTypePublic,
  ActivityTypesPublic,
} from "@reasonote/core";
import {
  createUserActivityResultFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {useStateWithRef} from "@reasonote/lib-utils-frontend";

import {
  FriendlyNotifierWrapper,
} from "../notifications/FriendlyNotifierWrapper";

interface PracticePageMainProps {
    skillId: string;
    onBack: () => void;
}

export function PracticePageMain({ skillId, onBack }: PracticePageMainProps) {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();
    const ac = useApolloClient();
    const { rsnUserId } = useRsnUser();
    const { value: type, update: setType } = useSearchParamHelper('type');
    const { value: allowedActivityTypes, update: setAllowedActivityTypes } = useSearchParamHelper('allowedActivityTypes', 'allow-all');
    const [userIntent, setUserIntent] = useState<FYPIntent | null>(null);
    const [activityList, setActivityList] = useState<{ activityId: string, type: string }[]>([]);
    const [currentActivity, setCurrentActivity] = useState<{ activityId: string, type: string } | null>(null);
    const [noMoreActivitiesInThisSet, setNoMoreActivitiesInThisSet] = useState<{ loading: boolean, success?: boolean, data?: boolean, error?: any }>({ loading: true });
    const [noItemsInSetAtAll, setNoItemsInSetAtAll] = useState<{ loading: boolean, success?: boolean, data?: boolean, error?: any }>({ loading: true });
    const [activitiesShownThisSession, setActivitiesShownThisSession, activitiesShownThisSessionRef] = useStateWithRef<string[]>([]);
    const [currentActivityIsAllowed, setCurrentActivityIsAllowed] = useState(true);
    const [activitiesCompleted, setActivitiesCompleted] = useState(0);

    const { data: userXPData, refetch: refetchSkillXP } = useUserXP(skillId);
    const { data: subscriptionData } = useReasonoteLicense();
    const { data: isOverLimit, refetch: refetchIsOverLimit } = useIsOverLicenseLimit('practice_activities');
    const [activityResultId, setActivityResultId] = useState<string | null>(null);

    const currentActivityId = currentActivity?.activityId;

    useEffect(() => {
        setActivitiesShownThisSession((old) => _.uniq([...(old ?? []), currentActivity?.activityId].filter(notEmpty)));
    }, [currentActivity]);

    const refillQueueInner = useCallback(async () => {
        if (!skillId || !type) return;

        const resp = await PracticeGetNextActivityRoute.call({
            skillIdPath: [skillId],
            ignoreActivities: activitiesShownThisSession,
            activityTypes: allowedActivityTypes === 'allow-all' ?
                [...ActivityTypesPublic] :
                allowedActivityTypes?.split(',') as ActivityType[],
            practiceMode: type as any
        });

        const activityList = resp.data?.activityList;
        if (!activityList) return;

        setActivityList(activityList.map(a => ({ activityId: a.activityId, type: a.type })));

        if (resp.data?.warnings?.find((w) => w.code === 'NO_SAVED_ACTIVITIES' || w.code === 'NO_MISSED_ACTIVITIES')) {
            setNoItemsInSetAtAll({
                loading: false,
                success: true,
                data: true
            });
            return;
        }

        setNoItemsInSetAtAll({
            loading: false,
            success: true,
            data: false
        });

        if (activityList.length === 0) {
            setCurrentActivity(null);
            setNoMoreActivitiesInThisSet({
                loading: false,
                success: true,
                data: true
            });
            return;
        } else {
            setCurrentActivity(activityList[0]);
        }
    }, [skillId, type, activitiesShownThisSession, allowedActivityTypes]);

    const tryRefillQueue = useRefreshCallback('tryRefillQueue', refillQueueInner, { throttleMs: 1000 });

    const onActivityComplete = useCallback(async () => {
        setActivitiesCompleted(prev => prev + 1);
    }, []);

    const onActivityCompleteAfterResultPosted = useCallback(async ({resultId}: {resultId?: string}) => {
        setActivityResultId(resultId ?? null);
        // Refetch the XP data
        await refetchSkillXP();
        // Refetch the license limit status after completing an activity
        await refetchIsOverLimit();
    }, [refetchIsOverLimit, refetchSkillXP]);

    useEffect(() => {
        setActivityResultId(null);
    }, [currentActivityId]);

    const onNextActivity = useCallback(async () => {
        if (!currentActivity) return;

        // If there are more activities, set the next one.
        const currentIndex = activityList.indexOf(currentActivity);
        if (currentIndex !== -1 && currentIndex < activityList.length - 1) {
            setCurrentActivity(activityList[currentIndex + 1]);
        } else {
            tryRefillQueue();
        }
    }, [currentActivity, activityList, tryRefillQueue]);

    const skipActivity = useCallback(async () => {

        if (!currentActivity) return;

        // Post the result to the server.
        await ac.mutate({
            mutation: createUserActivityResultFlatMutDoc,
            variables: {
                objects: [
                    {
                        activity: currentActivity.activityId,
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

        // If there are more activities, set the next one.
        const currentIndex = activityList.indexOf(currentActivity);
        if (currentIndex !== -1 && currentIndex < activityList.length - 1) {
            setCurrentActivity(activityList[currentIndex + 1]);
        } else {
            tryRefillQueue();
        }
    }, [tryRefillQueue, activityList, currentActivity]);

    const resetQueue = useCallback(async () => {
        setActivitiesShownThisSession([]);
        setNoMoreActivitiesInThisSet({ loading: true });

        // HACK: but works
        await asyncSleep(100);
        tryRefillQueue();
    }, [tryRefillQueue]);

    useEffect(() => {
        // Initialize allowedActivityTypes if needed
        if (!allowedActivityTypes) {
            setAllowedActivityTypes('allow-all');
            return; // Don't continue with other initializations yet
        }

        // Initialize type if needed
        if (!type) {
            setType('missed');
            return; // Don't continue until type is set
        }

        // Only proceed with queue fill if we have both type and allowedActivityTypes
        if (type === 'saved' || type === 'missed') {
            const currentTypes = allowedActivityTypes === 'allow-all'
                ? ActivityTypesPublic
                : allowedActivityTypes.split(',') as ActivityType[];

            // Only refill if current activity's type is not in the allowed types
            if (currentActivity && !currentTypes.includes(currentActivity.type as ActivityTypePublic)) {
                tryRefillQueue();
            } else if (!currentActivity) {
                // Initial load - only fill queue if we don't have an activity
                tryRefillQueue();
            }
        } else if (type === 'review-pinned') {
            setUserIntent({
                type,
                pinned: {
                    skillIdPath: [skillId]
                },
                activitiesAllowed: allowedActivityTypes === 'allow-all' ? {
                    type: 'allowAll'
                } : {
                    type: 'allowOnly',
                    allowedActivityTypes: allowedActivityTypes?.split(',') as ActivityType[]
                }
            });
        }
    }, [type, allowedActivityTypes, skillId, currentActivity]); // Include all dependencies

    useEffect(() => {
        if (!allowedActivityTypes) {
            setAllowedActivityTypes('allow-all');
            return; // Don't trigger refill here
        }

        if (currentActivity) {
            setCurrentActivityIsAllowed(allowedActivityTypes.includes(currentActivity.type));
        }

    }, [allowedActivityTypes, currentActivity]);

    const isLoading = noMoreActivitiesInThisSet.loading && noItemsInSetAtAll.loading;

    const headerProps = {
        currentActivityId: currentActivity?.activityId,
        handleBack: onBack,
        settingsDisabled: undefined,
        usingSkillIdStack: skillId ? [skillId] : [],
        allowedActivities: allowedActivityTypes === 'allow-all' ? [...ActivityTypesPublic] : allowedActivityTypes?.split(',') ?? [],
        setAllowedActivityTypes: (newTypes: string[]) => {
            setAllowedActivityTypes(newTypes.join(','));
        },
        extraBreadcrumb: (
            <Stack alignSelf="center" spacing={1} direction="row">
                <Txt startIcon={type === 'missed' ? <MissedActivityIcon fontSize="small" /> : <SavedActivityIcon fontSize="small" />} variant="caption">
                    {type === 'missed' ? "Missed Activities" : "Saved Activities"}
                </Txt>
            </Stack>
        ),
        disablePins: true
    };

    return (
        <>
            <Box sx={{
                opacity: isOverLimit ? 0.5 : 1,
                pointerEvents: isOverLimit ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
                filter: isOverLimit ? 'blur(2px)' : 'none',
                height: '100%',
            }}>
                <Stack gap={isSmallDevice ? 0.5 : 2} p={isSmallDevice ? 0 : 2} sx={{ height: '100%', overflow: 'hidden' }}>
                    {/* Content Area - Takes remaining space */}
                    <Stack
                        p={isSmallDevice ? 0.5 : 2}
                        gap={2}
                        sx={{
                            backgroundColor: theme.palette.background.default,
                            width: '100%',
                            maxWidth: '48rem',
                            alignItems: 'flex-start',
                            alignSelf: 'stretch',
                            borderRadius: '5px',
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {userIntent ? (
                            <Stack
                                direction="column"
                                gap={1}
                                sx={{
                                    width: '100%',
                                    maxWidth: '48rem',
                                    alignContent: "center",
                                    justifyContent: "center",
                                    overflow: 'auto', // Enable scroll here
                                    flex: 1,
                                }}
                            >
                                <ForYouMain
                                    fypIntent={userIntent}
                                    setFYPIntent={setUserIntent}
                                    onBack={onBack}
                                />
                            </Stack>
                        ) : (
                            <Stack gap={2} width="100%" sx={{ height: '100%', overflow: 'hidden' }}>
                                <PracticeHeaderDumb
                                    {...headerProps}
                                    icon={type === 'missed' ? <MissedActivityIcon /> : <SavedActivityIcon />}
                                    levelInfo={userXPData?.levelInfo}
                                    dailyXp={userXPData?.dailyXp}
                                />
                                <Stack flex={1} overflow="auto" minHeight={0}>
                                    {/* Activity content */}
                                    {isLoading ? (
                                        <SkeletonWithOverlay height={'400px'} width={'100%'}>
                                            <Card elevation={5}>
                                                Loading...
                                            </Card>
                                        </SkeletonWithOverlay>
                                    ) : (
                                        noMoreActivitiesInThisSet.data ? (
                                            <Card elevation={5} sx={{ width: '100%' }}>
                                                <CardContent>
                                                    <Stack spacing={2} alignItems={'center'}>
                                                        {type === 'missed' ? (
                                                            <>
                                                                <Typography variant="h6">
                                                                    🎉 Nice work!
                                                                </Typography>
                                                                <Typography variant="body1">
                                                                    You completed all the activities you missed{skillId ? ` for this skill.` : '.'}
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Typography variant="h6">
                                                                    🎉 Nice work!
                                                                </Typography>
                                                                <Typography variant="body1">
                                                                    You completed all the activities you saved{skillId ? ` for this skill.` : '.'}
                                                                </Typography>
                                                            </>
                                                        )}
                                                        <Button size="small" startIcon={<Refresh />} variant="contained" onClick={resetQueue}>
                                                            Keep Going?
                                                        </Button>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ) : noItemsInSetAtAll.data ? (
                                            <Card elevation={5} sx={{ width: '100%' }}>
                                                <CardContent>
                                                    <Stack spacing={2} alignItems={'center'}>
                                                        {type === 'missed' ? (
                                                            <>
                                                                <Typography variant="h6">
                                                                    🤔 No Missed Activities
                                                                </Typography>
                                                                <Typography variant="body1">
                                                                    You haven't missed any activities{skillId ? ` for this skill.` : '.'}
                                                                </Typography>
                                                                <Typography>
                                                                    Practice more activities to see some here!
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Typography variant="h6">
                                                                    🤔 No Saved Activities
                                                                </Typography>
                                                                <Typography variant="body1">
                                                                    You haven't saved any activities{skillId ? ` for this skill.` : '.'}
                                                                </Typography>
                                                                <Typography>
                                                                    Try clicking the <BookmarkAdd /> icon on an activity you want to save!
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ) : currentActivity ? (
                                            <Stack gap={2} width="100%" height="100%">
                                                <Stack flex={1} minHeight={0} overflow="auto">
                                                    <Card elevation={5} sx={{ width: '100%' }}>
                                                        <Activity
                                                            key={currentActivity.activityId}
                                                            activityId={currentActivity.activityId}
                                                            disableEdit
                                                            onNextActivity={onNextActivity}
                                                            onActivityComplete={onActivityComplete}
                                                            onActivityCompleteAfterResultPosted={onActivityCompleteAfterResultPosted}
                                                        />
                                                    </Card>
                                                </Stack>
                                                {/* Footer outside the scrollable area */}
                                                <ActivityFooter
                                                    activityId={currentActivity.activityId}
                                                    activityResultId={activityResultId ?? undefined}
                                                    onSkip={skipActivity}
                                                    isNextDisabled={true}
                                                    activityButtonsDisabled={false}
                                                />
                                            </Stack>
                                        ) : null
                                    )}
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </Box>

            <AnimatePresence>
                {isOverLimit && (
                    <FriendlyNotifierWrapper isVisible={!!isOverLimit}>
                        <FriendlyNotifierPopover
                            title={subscriptionData?.currentPlan?.type === 'Reasonote-Anonymous' ? 'Keep Practicing!' : "Let's Keep Going!"}
                            subtitle={
                                subscriptionData?.currentPlan?.type === 'Reasonote-Anonymous'
                                    ? "You're making great progress with practice mode!"
                                    : "We're glad you're enjoying our practice mode activities."
                            }
                            features={[
                                { icon: '🎯', label: 'More practice activities per day' },
                                { icon: '🧠', label: 'Advanced learning features' },
                                { icon: '💫', label: 'Unlimited practice sessions' },
                                { icon: '💖', label: '...and more!' }
                            ]}
                            licenseType={subscriptionData?.currentPlan?.type ?? 'Reasonote-Free'}
                            illustration="/images/illustrations/step_to_the_sun.svg"
                        />
                    </FriendlyNotifierWrapper>
                )}
            </AnimatePresence>
        </>
    );
} 