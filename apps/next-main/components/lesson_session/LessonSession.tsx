"use client"
import {AnimatePresence} from "framer-motion";
import {useRouter} from "next/navigation";

import {vFYPIntent} from "@/app/app/foryou/FYPState";
import {useIsOverLicenseLimit} from "@/clientOnly/hooks/useIsOverLicenseLimit";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {
  FriendlyNotifierPopover,
} from "@/components/notifications/FriendlyNotifierPopover";
import {useQuery} from "@apollo/client";
import {
  Box,
  Skeleton,
} from "@mui/material";
import {GetLessonSessionDeepDocument} from "@reasonote/lib-sdk-apollo-client";

import {
  FriendlyNotifierWrapper,
} from "../notifications/FriendlyNotifierWrapper";
import {
  LessonSessionConceptPracticeReview,
} from "./SessionTypes/LessonSessionConceptPracticeReview";

export interface FYPLessonRunMockupScreenProps {
    lessonSessionId: string;
    onBackOverride?: () => void;
    onBackAfterLessonCompleteOverride?: () => void;
    onStartNewLessonOverride?: (newLessonId: string) => void;
}

export function LessonSession({ lessonSessionId, onBackOverride, onBackAfterLessonCompleteOverride, onStartNewLessonOverride }: FYPLessonRunMockupScreenProps) {
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();
    const { data: subscriptionData } = useReasonoteLicense();
    const { data: isOverLimit } = useIsOverLicenseLimit('lessons_generated');

    console.log('isOverLimit', isOverLimit);

    const lessonSessionDeepRes = useQuery(GetLessonSessionDeepDocument, {
        variables: {
            filter: {
                id: {
                    eq: lessonSessionId
                }
            }
        }
    });

    return (
        <>
            <Box sx={{
                opacity: isOverLimit ? 0.5 : 1,
                pointerEvents: isOverLimit ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
                filter: isOverLimit ? 'blur(2px)' : 'none',
                height: '100%',
            }}>
                {lessonSessionDeepRes.loading ? (
                    <Skeleton variant="rounded" height={400} width={'100%'} />
                ) : (
                    lessonSessionDeepRes.data?.lessonSessionCollection?.edges?.[0]?.node?.lesson?.lessonType === 'initial-assessment-lesson' ?
                        null
                        :
                        <LessonSessionConceptPracticeReview
                            lessonSessionId={lessonSessionId}
                            onBack={() => {
                                if (onBackOverride) {
                                    onBackOverride();
                                }
                                else {
                                    const rootSkill = lessonSessionDeepRes.data?.lessonSessionCollection?.edges?.[0]?.node?.lesson?.rootSkill;
                                    if (rootSkill) {
                                        router.push(`/app/skills/${rootSkill}`);
                                    }
                                    else {
                                        vFYPIntent(null)
                                        router.push('/app');
                                    }
                                }
                            }}
                            onBackAfterLessonComplete={() => {
                                if (onBackAfterLessonCompleteOverride) {
                                    onBackAfterLessonCompleteOverride();
                                }
                                else {
                                    const rootSkill = lessonSessionDeepRes.data?.lessonSessionCollection?.edges?.[0]?.node?.lesson?.rootSkill;
                                    if (rootSkill) {
                                        router.push(`/app/skills/${rootSkill}`);
                                    }
                                    else {
                                        vFYPIntent(null)
                                        router.push('/app');
                                    }
                                }
                            }}
                            onStartNewLesson={(newLessonId) => {
                                if (onStartNewLessonOverride) {
                                    onStartNewLessonOverride(newLessonId);
                                }
                                else {
                                    router.push(`/app/lessons/${newLessonId}/new_session`)
                                }
                            }}
                        />
                )}
            </Box>

            <AnimatePresence>
                {isOverLimit && (
                    <FriendlyNotifierWrapper isVisible={!!isOverLimit}>
                        <FriendlyNotifierPopover
                            title={subscriptionData?.currentPlan?.type === 'Reasonote-Anonymous' ? 'Keep Learning!' : "Let's Keep Learning!"}
                            subtitle={
                                subscriptionData?.currentPlan?.type === 'Reasonote-Anonymous'
                                    ? <>
                                        To keep making lessons, please create a free account.
                                    </>
                                    : <>
                                        You've hit your daily limit of lessons.
                                        <br />
                                        To keep making lessons, please upgrade.
                                    </>
                            }
                            features={[
                                { icon: '📚', label: 'More lessons per day' },
                                { icon: '🎯', label: 'Advanced learning features' },
                                { icon: '🎧', label: 'More podcasts per day' },
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