import {useRef} from "react";

import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {Activity} from "@/components/activity/Activity";
import {
  ActivityLoadingComponent,
} from "@/components/activity/components/ActivityLoadingComponent";
import {
  Stack,
  Typography,
} from "@mui/material";
import {ActivityResult} from "@reasonote/activity-definitions";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {ActivityWithSkillStack} from "./FYPTypes";

export interface FYPActivityProps {
    activityRegenerating: boolean;
    currentActivity: ActivityWithSkillStack | null;
    popActivity: () => void;
    hasSkills: boolean;
    skillLoading: boolean;
    onActivityComplete: (activityResult: ActivityResult) => void;
    onActivityCompleteAfterResultPosted?: () => void;
}

export function FYPActivity({
    activityRegenerating,
    currentActivity,
    popActivity,
    hasSkills,
    skillLoading,
    onActivityComplete,
    onActivityCompleteAfterResultPosted,
}: FYPActivityProps) {

    const { refetch: refetchUserSkills } = useUserSkills();
    const hasRefetched = useRef(false);

    useAsyncEffect(async () => {
        if (!hasSkills && !skillLoading && !hasRefetched.current){
            hasRefetched.current = true;
            await refetchUserSkills();
        }
    }, [hasSkills, skillLoading]);


    return <Stack gap={1} height={'100%'} width={'100%'}>
            {/* <Typography variant="h6"><i>Activity</i></Typography> */}
            {activityRegenerating ? (
            <ActivityLoadingComponent loadingText="Finding Similar Activities..."/>
            ) : currentActivity ? (
            <div data-testid="fyp-activity-loaded" style={{display: 'flex', flex: 1, height: '100%', width: '100%', minHeight: '0%'}}>
                {
                <Activity
                    key={currentActivity.activity.id}
                    activityId={currentActivity.activity.id}
                    onActivityCompleteAfterResultPosted={onActivityCompleteAfterResultPosted}
                    onActivityComplete={(activityResult) => {
                        onActivityComplete(activityResult);
                    }}
                    onNextActivity={() => {
                        popActivity();
                    }}
                    displayContext={{
                        type: 'skillIdPath',
                        skillIdPath: currentActivity.skillIdStack,
                    }} 
                    disableEdit
                />
                }
            </div>
            ) : hasSkills ? (
                <ActivityLoadingComponent/> 
            ) : (
            <>
                {
                skillLoading ? (
                    <ActivityLoadingComponent/>
                ) : (
                    <>
                    <Typography variant="h5">Create Skills</Typography>
                    <Typography variant="body1">
                    In order to review, you need to have some skills!
                    </Typography>
                    </>
                )
                }
            </>
            )} 
        </Stack>
    
}