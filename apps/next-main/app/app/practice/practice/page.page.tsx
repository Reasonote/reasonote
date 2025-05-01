'use client'
import React, {
  useEffect,
  useState,
} from "react";

import {AnimatePresence} from "framer-motion";
import {useRouter} from "next/navigation";

import {SkillVisitRoute} from "@/app/api/skill-visit/routeSchema";
import {useIsOverLicenseLimit} from "@/clientOnly/hooks/useIsOverLicenseLimit";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {
  FriendlyNotifierPopover,
} from "@/components/notifications/FriendlyNotifierPopover";
import {
  FriendlyNotifierWrapper,
} from "@/components/notifications/FriendlyNotifierWrapper";
import FullCenter from "@/components/positioning/FullCenter";
import {
  Box,
  Stack,
  useTheme,
} from "@mui/material";

import ForYouMain from "../../foryou/FYPMain";
import {
  FYPIntent,
  FYPIntentActivitiesAllowed,
} from "../../foryou/FYPTypes";

export default function PracticePage(){
    const theme = useTheme();
    const {
        value: type,
        update: setType
    } = useSearchParamHelper('type');
    const {
        value: skillIdPath,
        update: setSkillIdPath
    } = useSearchParamHelper('skillIdPath');
    const {
        value: courseId,
        update: setCourseId
    } = useSearchParamHelper('courseId');

    const { data: subscriptionData } = useReasonoteLicense();
    const isSmallDevice = useIsSmallDevice();
    const {data: isOverLimit, loading: isOverLimitLoading, refetch: refetchIsOverLimit} = useIsOverLicenseLimit('practice_activities');

    const [allowedActivities, setAllowedActivities] = useState<FYPIntentActivitiesAllowed>({
        type: 'allowAll',
    });
    const userIntent: FYPIntent = {
        type: (type ?? 'review-all') as any,
        pinned: skillIdPath ? {
            skillIdPath: JSON.parse(decodeURIComponent(skillIdPath))
        } : undefined,
        activitiesAllowed: allowedActivities,
    }

    useEffect(() => {
        if (!type) {
            setType('review-all');
        }
    }, [type]);

    useEffect(() => {
        if (userIntent.type === 'review-pinned' && userIntent.pinned?.skillIdPath) {
            const skillId = userIntent.pinned.skillIdPath[0];
            SkillVisitRoute.call({ skillId }).catch(console.error);
        }
    }, [userIntent]);

    const router = useRouter();

    const readyForMain = type;

    return (
      <>
        <Box sx={{ 
          opacity: isOverLimit ? 0.5 : 1,
          pointerEvents: isOverLimit ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
          filter: isOverLimit ? 'blur(2px)' : 'none',
        }}>
          <FullCenter>
            <Stack
              direction="column"
              gap={1}
              sx={{
                width: isSmallDevice ? "100vw" : theme.breakpoints.values["sm"],
                height: isSmallDevice ? 'calc(100dvh - 56px)' : "100%",
                alignContent: "center",
                justifyContent: "center",
              }}
              paddingX={'3px'}
            >
              {
                !readyForMain ? (
                  <div>Loading...</div>
                ) : (
                  <ForYouMain 
                    fypIntent={userIntent} 
                    setFYPIntent={(newIntent) => {
                        if (!newIntent) {
                            setType(null);
                            setSkillIdPath(null);
                            return;
                        }

                        setType(newIntent.type);
                        
                        if (newIntent.type === 'review-pinned') {
                            if (newIntent.activitiesAllowed){
                                setAllowedActivities(newIntent.activitiesAllowed);
                            }
                            setSkillIdPath(JSON.stringify(newIntent.pinned.skillIdPath));
                        }
                        else {
                            setAllowedActivities({
                                type: 'allowAll',
                            });
                        }
                    }}
                    onBack={() => {
                        if (courseId) {
                            router.push(`/app/courses/${courseId}/view`);
                        }
                        else if (userIntent?.type === 'review-pinned' && userIntent.pinned?.skillIdPath) {
                            router.push(`/app/skills/${userIntent.pinned.skillIdPath[0]}`);
                        } else {
                            router.push('/app');
                        }
                    }}
                  />
                )
              }
            </Stack>
          </FullCenter>
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