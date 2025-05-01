import {ChatDrawerState} from "@/clientOnly/state/chatDrawer";
import {
  UserActivityFeedbackButton,
} from "@/components/userActivityFeedback/UserActivityFeedbackButton";
import {useApolloClient} from "@apollo/client";
import {
  Chat,
  QuestionMarkOutlined,
  SkipNext,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";

export interface ActivityFooterProps {
    activityId: string;
    activityResultId?: string;
    onBack?: () => void;
    onNext?: () => void;
    onSkip?: () => void;
    onRateBad?: () => void;
    onRateGood?: () => void;
    isNextDisabled: boolean;
    activityButtonsDisabled: boolean;
}

export function ActivityFooter({activityId, activityResultId, onBack, onNext, onRateBad, onRateGood, onSkip, isNextDisabled, activityButtonsDisabled}: ActivityFooterProps) {
    const ac = useApolloClient();
    
    const subtleIconButtonStyle = {
        color: 'text.secondary',
        opacity: 0.7,
        '&:hover': {
            opacity: 1,
            color: 'text.primary'
        }
    };
    
    return (
        <Stack 
            direction="row" 
            alignItems="center"
            sx={{
                width: '100%',
                maxWidth: '48rem',
                margin: '0 auto',
                px: 1,
            }}
        >
            {/* Left-aligned chat button */}
            <Tooltip title="Ask for Help">
                <span>
                    <IconButton
                        onClick={() => {
                            ChatDrawerState.openChatDrawerNewChat(
                                ac,
                                {
                                    contextType: 'ViewingActivity',
                                    contextId: activityId,
                                    contextData: {
                                        activityId,
                                        activityResultId: activityResultId
                                    }
                                }
                            )
                        }}
                        disabled={activityButtonsDisabled}
                        sx={subtleIconButtonStyle}
                    >
                        <Badge 
                            badgeContent={<QuestionMarkOutlined fontSize="small"/>}
                            sx={{ '& .MuiBadge-badge': { opacity: 0.7 } }}
                        >
                            <Chat />
                        </Badge>
                    </IconButton>
                </span>
            </Tooltip>

            {/* Spacer */}
            <Box flex={1} />

            {/* Center-aligned rating buttons */}
            <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
            >
                <Tooltip title="Rate Activity Bad">
                    <span>
                        <UserActivityFeedbackButton 
                            activityId={activityId} 
                            feedbackVariant="down" 
                            disabled={activityButtonsDisabled}
                            onClick={onRateBad}
                            sx={subtleIconButtonStyle}
                        />
                    </span>
                </Tooltip>

                <Tooltip title="Rate Activity Good">
                    <span>
                        <UserActivityFeedbackButton
                            onClick={onRateGood}
                            activityId={activityId}
                            feedbackVariant="up" 
                            disabled={activityButtonsDisabled}
                            sx={subtleIconButtonStyle}
                        />
                    </span>
                </Tooltip>
            </Stack>

            {/* Spacer */}
            <Box flex={1} />

            {/* Right-aligned skip button */}
            {onSkip && (
                <Tooltip title="Skip Activity">
                    <span>
                        <IconButton
                            aria-label="Next Activity"
                            onClick={onSkip}
                            disabled={activityButtonsDisabled}
                            sx={subtleIconButtonStyle}
                        >
                            <SkipNext />
                        </IconButton>
                    </span>
                </Tooltip>
            )}
        </Stack>
    );
}