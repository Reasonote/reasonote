import {
  useCallback,
  useState,
} from "react";

import {Activity} from "@/components/activity/Activity";
import {
  ActivityLoadingSkeleton,
} from "@/components/activity/ActivityLoadingSkeleton";
import {
  ActivityTypeIndicator,
} from "@/components/activity/ActivityTypeIndicator";
import {
  generateActivityForSkill,
} from "@/components/activity/generate/generateActivityForSkill";
import {
  ActivityType,
  ActivityTypesPublic,
} from "@reasonote/core";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {useApolloClient} from "@apollo/client";
import {
  Button,
  Card,
  Grid,
  Stack,
  TextField,
} from "@mui/material";
import {getActivityFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";

interface CreateActivityTypeButtonGroupProps {
    onActivityTypeCreate: (activityType: ActivityType) => any;
    disabled?: boolean;
}


export function CreateActivityTypeButtonGroup({
    onActivityTypeCreate,
    disabled
}: CreateActivityTypeButtonGroupProps){
    return <Grid container gap={1}>
        {ActivityTypesPublic.map((ex) => {
            return <Grid item><Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                    onActivityTypeCreate(ex);
                }}
                disabled={disabled}
            >
                <Stack direction="row">
                    + <ActivityTypeIndicator activityType={ex}/>
                </Stack>
            </Button>
            </Grid>;
        })}
    </Grid>
}

type ActivityGenerateResult = {
    tmpId: string,
    resultType: 'loading',
    type: ActivityType,
    forSkill: string,
} | {
    tmpId: string,
    resultType: 'success',
    id: string,
    type: ActivityType,
    name: string,
    forSkill: string,
} | {
    tmpId: string,
    resultType: 'error',
    type: ActivityType,
    error: string,
    forSkill: string,
}

export function NewActivitiesFromSkillScreen(){
    const [wipSkillName, setWipSkillName] = useState<string>('');
    const [skillNames, setSkillNames] = useState<string[]>([]);
    const [forCurrentUser, setForCurrentUser] = useState<boolean>(false);
    const [generatedActivities, setGeneratedActivities] = useState<ActivityGenerateResult[]>([]);
    const ac = useApolloClient();
    const {sb} = useSupabase();
    const [allowedActivityTypes, setAllowedActivityTypes] = useState<string[]>([...ActivityTypesPublic]);

    const createActivitiesForSkill = useCallback(async (skillName: string, activityType?: ActivityType) => {
        const tmpId = Math.random().toString();

        setGeneratedActivities((existing) => [
            ...existing,
            {
                tmpId,
                resultType: 'loading',
                type: activityType ?? 'loading' as any,
                forSkill: skillName,
            }
        ]);

        const ret = await generateActivityForSkill({
            ac,
            sb,
            skill: {
                name: skillName,
                skillIdPath: [],
            },
            activityType
        });

        const createdActivityId = ret?.data?.activityIds?.[0];

        const createdActivity = createdActivityId ? (await ac.query({
            query: getActivityFlatQueryDoc,
            variables: {
                filter: {
                    id: {
                        eq: createdActivityId,
                    }
                }
            }
        })).data?.activityCollection?.edges?.[0]?.node : undefined;

        if (createdActivity && createdActivity){
            setGeneratedActivities((existing) => {
                return existing.map((ex) => {
                    if (ex.tmpId === tmpId){
                        return {
                            tmpId,
                            resultType: 'success',
                            id: createdActivity.id,
                            type: createdActivity.type as any,
                            name: createdActivity.name,
                            forSkill: skillName,
                        }
                    }
                    return ex;
                })
            })
        }
    }, [ac, wipSkillName]);


    const activitiesGroupedBySkillName = generatedActivities.reduce((acc, activity) => {
        if (!acc[activity.forSkill]){
            acc[activity.forSkill] = [];
        }
        acc[activity.forSkill].push(activity);
        return acc;
    }, {} as Record<string, ActivityGenerateResult[]>);

    console.log(activitiesGroupedBySkillName)

    return <Stack gap={1}>
        <Txt variant={'h5'}>Create New Activities From Skill</Txt>
        <Stack gap={1}>
            <TextField
                label={'Skill Name'}
                value={wipSkillName}
                onChange={(e) => {
                    setWipSkillName(e.target.value);
                }}
            />
            <Button
                variant={'contained'}
                color={'primary'}
                onClick={() => {
                    setSkillNames((existing) => {
                        return [...existing, wipSkillName];
                    });
                    setWipSkillName('');
                }}
            >
                Add Skill
            </Button>
        </Stack>
        
        <Stack>
            {generatedActivities.length > 0 ? <Txt variant={'h6'}>Generated Activities</Txt> : null}
            <Stack gap={1}>
                {
                    skillNames.map((skillName) => {
                        const activities = activitiesGroupedBySkillName[skillName] ?? [];

                        return <Card elevation={4} sx={{padding: '10px'}}>
                            <Stack>
                                <SkillChip topicOrId={skillName}/>
                                <CreateActivityTypeButtonGroup
                                    onActivityTypeCreate={(activityType) => {
                                            createActivitiesForSkill(skillName, activityType);
                                    }}
                                    disabled={!skillName || skillName.trim().length < 2}
                                />
                                <Stack gap={1}>
                                    {
                                        activities.map((activity) => 
                                            <Card elevation={10} sx={{padding: '10px'}}>
                                            {activity.resultType === 'loading' ?
                                                <ActivityLoadingSkeleton activityType={activity.type}/>
                                                :
                                                activity.resultType === 'error' ?
                                                    <Txt variant={'h6'}>Error: {activity.error}</Txt>
                                                    :
                                                    <Activity activityId={activity.id} onActivityComplete={() => {}}
                                                        onDelete={() => {
                                                            setGeneratedActivities((existing) => {
                                                                return existing.filter((ex) => ex.tmpId !== activity.tmpId);
                                                            })
                                                        }}
                                                    />
                                        }
                                            </Card>
                                        )
                                    }
                                    
                                </Stack>
                            </Stack>
                        </Card>
                    })
                }
            </Stack>
        </Stack>
    </Stack>
}