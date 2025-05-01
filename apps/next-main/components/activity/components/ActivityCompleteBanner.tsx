import React from "react";

import posthog from "posthog-js";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {ChatDrawerState} from "@/clientOnly/state/chatDrawer";
import {
  ActivityFeedbackDialog,
} from "@/components/feedback/ActivityFeedbackDialog";
import {ActivityScoreBar} from "@/components/progress/ActivityScoreBar";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useApolloClient} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  AutoAwesome,
  CheckCircle,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {ActivityResult} from "@reasonote/activity-definitions";

interface ActivityCompleteBannerProps {
    grade0To100?: number;
    activityResult: ActivityResult;
    completedTipFinal?: string | null;
    definition: any;
    lessonSessionId?: string;
    lessonId?: string;
    activityId: string;
    activityResultId?: string;
    onNextActivity?: () => void;
}

export function ActivityCompleteBanner({
    grade0To100,
    activityResult,
    completedTipFinal,
    definition,
    lessonSessionId,
    lessonId,
    activityId,
    onNextActivity,
    activityResultId
}: ActivityCompleteBannerProps) {
    const ac = useApolloClient();
    const theme = useTheme();
    const {supabase: sb} = useSupabase()
    const isSmallDevice = useIsSmallDevice();
    
    const wasPerfect = grade0To100 ? grade0To100 === 100 : undefined;
    const wasGood = grade0To100 ? grade0To100 >= 80 : undefined;
    const wasOk = grade0To100 ? grade0To100 >= 60 : undefined;

    const mainColorName = wasPerfect ? 'success' :
        wasGood ? 'success' :
        wasOk ? 'warning' :
        'error';

    const handleFeedbackSubmit = async (feedback: { tags: string[]; details?: string }) => {
        var feedbackId: string | null = null;
        try {
            const feedbackResult = await sb.from('user_activity_feedback').insert({
                activity: activityId,
            _value: -1,
            _tags: feedback.tags,
            _description: feedback.details
            }).select('*').single();
            feedbackId = feedbackResult.data?.id ?? null;
        } catch (error) {
            console.error('Error recording feedback', error);
        }
        posthog.capture('activity_feedback', {
            activityId,
            feedbackId,
            feedback
        });
    };

    return (
        <Card sx={{
            padding: '10px', 
            backgroundColor: wasPerfect ? theme.palette.success.dark :
                wasGood ? theme.palette.success.dark :
                wasOk ? theme.palette.warning.light :
                theme.palette.error.main,
            position: 'relative'
        }}>
            <ActivityFeedbackDialog 
                onSubmit={handleFeedbackSubmit}
                sx={{ 
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    color: theme.palette.text.primary,
                    '&:hover': {
                        color: theme.palette.error.light
                    }
                }}
            />
            <Stack gap={isSmallDevice ? 1 : 2}>
                <Stack gap={1}>
                    {/* TODO: Abstract out some of this so that each activity can provide default titles and tips based on the score. */}
                    {grade0To100 !== undefined && (
                        grade0To100 === 100 ? (
                            <Stack alignItems={'center'} justifyItems={'center'} direction={'row'} gap={1}>
                                <CheckCircle/>
                                <Typography variant={isSmallDevice ? 'subtitle1' : 'h6'} fontStyle={'bold'} textAlign={'center'}>
                                    Perfect!
                                </Typography>
                            </Stack>
                        ) : grade0To100 >= 80 ? (
                            <Typography variant={isSmallDevice ? 'subtitle1' : 'h6'}>Great!</Typography>
                        ) : grade0To100 >= 60 ? (
                            activityResult.activityType === 'flashcard' ? <Typography variant={isSmallDevice ? 'subtitle1' : 'h6'}>Keep practicing!</Typography> :
                            <Typography variant={isSmallDevice ? 'subtitle1' : 'h6'}>Good</Typography>
                        ) : (
                            activityResult.activityType === 'flashcard' ? <Typography variant={isSmallDevice ? 'subtitle1' : 'h6'}>Keep practicing!</Typography> :
                            <Typography variant={isSmallDevice ? 'subtitle1' : 'h6'}>Incorrect</Typography>
                        )
                    )}
                    <Typography variant="body2">
                        {completedTipFinal}
                    </Typography>
                    {activityResult.gradeType === 'graded-numeric' && !definition?.hideScoreBarOnResults && notEmpty(grade0To100) && (
                        <ActivityScoreBar 
                            grade0To100={grade0To100}
                            lpProps={{
                                lpProps: {
                                    color: mainColorName === 'success' ? theme.palette.success.main :
                                        mainColorName === 'warning' ? theme.palette.warning.main :
                                        theme.palette.error.main,
                                    sx: {
                                        filter: 'brightness(1.2)'
                                    }
                                }
                            }}
                        />
                    )}
                </Stack>

                <Button
                    startIcon={<AutoAwesome/>}
                    variant={'outlined'}
                    color={'gray'}
                    onClick={() => {
                        if (lessonId || lessonSessionId) {
                            ChatDrawerState.openChatDrawerNewChat(ac, {
                                contextType: 'ViewingLesson',
                                contextId: (lessonSessionId ?? lessonId) as string,
                                contextData: {
                                    lessonSessionId,
                                    lessonId,
                                    activityId,
                                    activityResultId: activityResultId ?? undefined
                                }
                            })
                        } else {
                            ChatDrawerState.openChatDrawerNewChat(ac, {
                                contextType: 'ViewingActivity',
                                contextId: activityId,
                                contextData: {
                                    activityId,
                                    activityResultId: activityResultId ?? undefined
                                }
                            })
                        }
                    }}
                    sx={{
                        color: theme.palette.text.primary,
                        borderColor: theme.palette.divider,
                    }}
                    size={isSmallDevice ? 'small' : 'medium'}
                >
                    Help Me Understand
                </Button>

                {onNextActivity && (
                    <Button
                        color={mainColorName}
                        variant="contained"
                        sx={{
                            color: theme.palette.text.primary,
                            boxShadow: theme.shadows[2],
                            border: `1px solid ${theme.palette.text.primary}`,
                        }}
                        onClick={onNextActivity}
                        size={isSmallDevice ? 'small' : 'medium'}
                    >
                        Next
                    </Button>
                )}
            </Stack>
        </Card>
    );
} 