'use client'
import {DateTime} from "luxon";

import {Score0To100Chip} from "@/app/app/badges/Score0To100Badge";
import {Activity} from "@/components/activity/Activity";
import {
  ActivityLoadingComponent,
} from "@/components/activity/components/ActivityLoadingComponent";
import FullCenter from "@/components/positioning/FullCenter";

import {useQuery} from "@apollo/client";
import {
  Schedule,
  Scoreboard,
  ThumbsUpDown,
} from "@mui/icons-material";
import {
  Card,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  GetActivityResultsDeepDocument,
  getUserActivityFeedbackFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {UserCard} from "../../users/UserCard";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export default function ActivityResultViewer({activityResultId}: {activityResultId: string}){
    const isSmallDevice = useIsSmallDevice();

    const activityResultResult = useQuery(GetActivityResultsDeepDocument, {
        variables: {
            filter: {
                id: {
                    eq: activityResultId
                }
            }
        }
    })

    const userFeedbackResult = useQuery(getUserActivityFeedbackFlatQueryDoc, {
        variables: {
            filter: {
                activity: {
                    eq: activityResultId
                }
            }
        }
    })

    const allFeedbacks = userFeedbackResult.data?.userActivityFeedbackCollection?.edges?.map(edge => edge?.node ?? '') ?? [];

    const firstResult = activityResultResult.data?.userActivityResultCollection?.edges?.[0]?.node;
    const firstResultActivityId = firstResult?.activity?.id;

    return <FullCenter>
        <Stack gap={1} width={isSmallDevice ? '100vw' : '80vw'}>
            <Typography variant={'h6'} color="white" textAlign={'center'}>
                Activity Result
            </Typography>
            <Grid container gap={1}>
                <Grid item>
                    <UserCard userId={firstResult?.user ?? ''} />
                </Grid>
                <Grid item>
                    <Card sx={{padding: '10px'}}>
                        <Stack gap={1}>
                            <Stack>
                                <Stack direction={'row'} alignItems={'center'} gap={1}>
                                    <Scoreboard/>
                                    <Typography variant={'h6'}>
                                        Score
                                    </Typography>
                                </Stack>
                                <Score0To100Chip score={firstResult?.score ?? 0} />
                            </Stack>
                            {firstResult?.createdDate && <Stack>
                                <Stack direction={'row'} alignItems={'center'} gap={1}>
                                    <Schedule />
                                    <Typography variant={'h6'}>
                                        Date 
                                    </Typography>
                                </Stack>
                                
                                <Typography>
                                    {DateTime.fromISO(firstResult?.createdDate).toRelative()} 
                                </Typography>
                            </Stack>}
                        </Stack>
                    </Card>
                </Grid>
                <Grid item>
                    <Card sx={{padding: '10px'}}>
                        <Stack gap={1}>
                            <Stack>
                                <Stack direction={'row'} alignItems={'center'} gap={1}>
                                    <ThumbsUpDown/>
                                    <Typography variant={'h6'}>
                                        Feedback
                                    </Typography>
                                </Stack>
                                {
                                    allFeedbacks.length === 0 ?
                                        <Typography variant={'caption'}>
                                            <i>No feedback</i>
                                        </Typography>
                                        :
                                        allFeedbacks.map((feedback) => {
                                            return <Chip label={<Typography>{feedback.value}</Typography>} color={feedback.value && feedback.value >= 0 ? 'success' : 'error'} />
                                        })
                                        
                                }
                            </Stack>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
            <Paper style={{padding: '10px'}}>
                {
                    activityResultResult.loading ?
                    (
                        <ActivityLoadingComponent />
                    )
                    :
                    (
                        (
                            !firstResultActivityId ?
                                <div>Activity not found</div>
                                :
                                <Activity activityId={firstResultActivityId} onActivityComplete={() => {}} />
                        )
                    )
                }
            </Paper>  
        </Stack>
    </FullCenter>  
}