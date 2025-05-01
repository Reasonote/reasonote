import {useState} from "react";

import {
  upsertActivityFeedback,
} from "@/clientOnly/functions/sendActivityFeedback";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {
  ThumbDown,
  ThumbDownOutlined,
  ThumbUp,
  ThumbUpOutlined,
} from "@mui/icons-material";
import {
  IconButton,
  IconButtonProps,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  getUserActivityFeedbackFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {RsnSnackbar} from "../snackbars/RsnSnackbar";

export interface UserActivityFeedbackButtonProps extends IconButtonProps {
    activityId?: string;
    feedbackVariant: "up" | "down";
}

export function UserActivityFeedbackButton({activityId, feedbackVariant, ...props}: UserActivityFeedbackButtonProps) {
    const rsnUserId = useRsnUserId();
    const ac = useApolloClient();
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarContent, setSnackbarContent] = useState<React.ReactNode | undefined>(undefined);

    const existingFeedbackResult = useQuery(getUserActivityFeedbackFlatQueryDoc, {
        variables: {
            filter: {
                activity: {
                    eq: activityId
                },
                createdBy: {
                    eq: rsnUserId
                }
            },
            first: 1
        }
    })

    const existingLikeValue = existingFeedbackResult.data?.userActivityFeedbackCollection?.edges?.[0]?.node?.value;
    const isFilledIn = existingLikeValue !== undefined && existingLikeValue !== null &&
        feedbackVariant === "up" ? 
            existingLikeValue === 1 
            :
            existingLikeValue === -1
        ;
    
    return <>
        <Tooltip title={feedbackVariant === "up" ? "Like Activity" : "Dislike Activity"}>
            <span>
                <IconButton
                    aria-label={feedbackVariant === "up" ? "Like Activity" : "Dislike Activity"}
                    {...props}
                    disabled={(!activityId || !rsnUserId) || props.disabled}
                    color={isFilledIn ? 
                        (
                            feedbackVariant === "up" ?
                                "primary" 
                                : 
                                "default"
                        )
                        : 
                        "default"}
                    onClick={async (ev) => {
                        // Pass event anyway
                        if (props.onClick){
                            new Promise(() => { props.onClick?.(ev)} );
                        }

                        if (!activityId) {
                            console.error("No activity id")
                            return;
                        }

                        if (!rsnUserId){
                            console.error("No rsnUserId")
                            return;
                        }

                        const valueToSet = isFilledIn ? 
                            0 
                            : 
                            feedbackVariant === "up" ? 
                                1 
                                : 
                                -1;

                        setSnackbarContent(valueToSet === 1 ?
                            <Stack>
                                <Typography variant="body1">
                                    Glad you liked it 👍
                                </Typography>
                                <Typography variant="body2">
                                    We'll show things like this more.
                                </Typography>
                            </Stack>
                            :
                            (
                                valueToSet === -1 ?
                                    <Stack>
                                        <Typography variant="body1">
                                            Thanks for the feedback 🫡 
                                        </Typography>
                                        <Typography variant="body2">
                                            We'll show things like this less.
                                        </Typography>
                                    </Stack>
                                    :
                                    null
                            )
                            // `
                            // Thanks for the feedback. 
                            // We'll show things like this less.
                            // `
                        )
                        setShowSnackbar(valueToSet !== 0);

                        await upsertActivityFeedback({
                            ac,
                            feedback: {
                                activityId: activityId,
                                value: valueToSet,
                            },
                            rsnUserId
                        })

                        await ac.refetchQueries({
                            include: [
                                "getUserActivityFeedbackFlat"
                            ]
                        })
                    }}
                >
                    {
                        feedbackVariant === "up" ? 
                            // Like
                            (
                                isFilledIn ?
                                    <ThumbUp /> 
                                    : 
                                    <ThumbUpOutlined />
                            )
                            :
                            // Dislike
                            (
                                isFilledIn ?
                                    <ThumbDown /> 
                                    : 
                                    <ThumbDownOutlined />
                            )
                    }
                </IconButton>
            </span>
        </Tooltip>
        <RsnSnackbar
            color="primary"
            open={showSnackbar}
            autoHideDuration={6000}
            onClose={() => {
                setShowSnackbar(false);
            }}
            message={snackbarContent}
        />
    </>
}